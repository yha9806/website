"""
统一模型客户端 - 提供统一的模型调用接口
"""
from typing import Dict, Any, Optional
from datetime import datetime
import logging
import uuid

from .model_registry import ModelRegistry, ModelConfig
from .validator import ModelValidator
from .monitor import ModelMonitor

logger = logging.getLogger(__name__)


class UnifiedModelResponse:
    """统一的模型响应格式"""
    
    def __init__(self, 
                 content: str,
                 model_used: str,
                 tokens_used: int = 0,
                 metadata: Optional[Dict[str, Any]] = None):
        self.content = content
        self.model_used = model_used
        self.tokens_used = tokens_used
        self.metadata = metadata or {}
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'content': self.content,
            'model_used': self.model_used,
            'tokens_used': self.tokens_used,
            'metadata': self.metadata,
            'timestamp': self.timestamp
        }


class UnifiedModelClient:
    """统一的模型调用接口"""
    
    def __init__(self):
        """
        初始化客户端
        """
        self.registry = ModelRegistry()
        self.validator = ModelValidator()
        self.monitor = ModelMonitor()
        self.adapters_cache = {}  # Cache for provider adapters
        
        logger.info(f"Initialized UnifiedModelClient")
    
    def _get_provider_adapter(self, model_config: ModelConfig):
        """获取对应的Provider适配器"""
        # Use cached adapter if available
        if model_config.provider in self.adapters_cache:
            return self.adapters_cache[model_config.provider]
        
        from .adapters import get_adapter
        
        adapter = get_adapter(model_config.provider, model_config)
        if not adapter:
            raise ValueError(f"No adapter available for provider {model_config.provider}")
        
        # Cache the adapter
        self.adapters_cache[model_config.provider] = adapter
        return adapter
    
    async def generate(self, 
                       model_id: str,
                       prompt: str, 
                       task_type: str = 'general',
                       max_tokens: Optional[int] = None,
                       temperature: Optional[float] = None,
                       **kwargs) -> Dict[str, Any]:
        """
        统一的生成接口
        
        Args:
            model_id: 模型ID
            prompt: 输入提示
            task_type: 任务类型 (poem, story, general, code, etc.)
            max_tokens: 最大生成tokens
            temperature: 温度参数
            **kwargs: 其他参数
            
        Returns:
            Dict[str, Any]: 统一格式的响应字典
        """
        # 0. 获取模型配置
        model_config = self.registry.get_model(model_id)
        provider_adapter = self._get_provider_adapter(model_config)
        
        # 1. 验证模型可用性
        is_available = await self.validator.validate_availability(model_config, provider_adapter)
        if not is_available:
            raise RuntimeError(f"Model {model_id} is not available")
        
        # 2. 准备请求
        request = self._prepare_request(model_config, prompt, task_type, max_tokens, temperature, **kwargs)
        
        # 3. 记录请求
        request_id = await self.monitor.log_request(
            model_id=model_id,
            request=request
        )
        
        try:
            # 4. 调用Provider适配器
            logger.info(f"Calling {model_config.provider} adapter for {model_id}")
            response = await provider_adapter.generate(request)
            
            # 5. 验证响应
            is_valid = await self.validator.validate_response(
                response, 
                expected_model=model_config.api_model_name
            )
            if not is_valid:
                logger.warning(f"Response validation failed for {model_id}")
            
            # 6. 记录响应
            await self.monitor.log_response(request_id, response)
            
            # 7. 返回标准化响应
            return self._standardize_response(response, model_config, model_id).to_dict()
            
        except Exception as e:
            # 8. 错误处理和记录
            logger.error(f"Error generating with {model_id}: {e}")
            await self.monitor.log_error(request_id, e)
            raise
    
    async def generate_poem(self,
                           model_id: str,
                           theme: str,
                           style: str = "modern",
                           language: str = "en",
                           **kwargs) -> Dict[str, Any]:
        """生成诗歌的便捷方法"""
        prompt = self._build_poem_prompt(theme, style, language)
        return await self.generate(model_id, prompt, task_type='poem', **kwargs)
    
    async def generate_story(self,
                            model_id: str,
                            prompt: str,
                            genre: str = "general",
                            language: str = "en",
                            **kwargs) -> Dict[str, Any]:
        """生成故事的便捷方法"""
        full_prompt = self._build_story_prompt(prompt, genre, language)
        return await self.generate(model_id, full_prompt, task_type='story', **kwargs)
    
    def _prepare_request(self, model_config: ModelConfig, prompt: str, task_type: str, 
                        max_tokens: Optional[int], 
                        temperature: Optional[float],
                        **kwargs) -> Dict[str, Any]:
        """准备请求参数"""
        request = {
            'prompt': prompt,
            'task_type': task_type,
            'model': model_config.api_model_name,
        }
        
        # 处理max_completion_tokens（优先级高于max_tokens）
        if 'max_completion_tokens' in kwargs:
            request['max_completion_tokens'] = kwargs.pop('max_completion_tokens')
            # 不再添加max_tokens
        elif max_tokens:
            request['max_tokens'] = min(max_tokens, model_config.max_tokens)
        else:
            request['max_tokens'] = min(1000, model_config.max_tokens)
        
        # 处理temperature参数
        if temperature is not None:
            request['temperature'] = temperature
        elif 'temperature' not in kwargs:  # 如果kwargs中也没有temperature
            request['temperature'] = 0.7
        
        # 处理特殊参数需求（来自模型配置）
        if model_config.requires_special_handling:
            # GPT-5, o1系列等需要max_completion_tokens
            if model_config.requires_special_handling.get('max_completion_tokens'):
                if 'max_tokens' in request and 'max_completion_tokens' not in request:
                    request['max_completion_tokens'] = request.pop('max_tokens')
                # GPT-5 models need at least 500 max_completion_tokens
                if model_config.model_id.startswith('gpt-5') and 'max_completion_tokens' in request:
                    request['max_completion_tokens'] = max(500, request['max_completion_tokens'])
                # o1系列不支持temperature
                if model_config.requires_special_handling.get('no_temperature'):
                    request.pop('temperature', None)
        
        # 添加其他参数（包括verbosity, reasoning_effort, top_p等）
        for key, value in kwargs.items():
            if value is not None:  # 只添加非None的参数
                request[key] = value
        
        return request
    
    def _standardize_response(self, response: Any, model_config: ModelConfig, model_id: str) -> UnifiedModelResponse:
        """标准化不同Provider的响应格式"""
        # 处理OpenAI格式的响应
        if hasattr(response, 'choices') and response.choices:
            content = response.choices[0].message.content
            model_used = response.model if hasattr(response, 'model') else model_config.api_model_name
            tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else 0
        # 处理字典格式的响应
        elif isinstance(response, dict):
            content = response.get('content', '')
            model_used = response.get('model', model_config.api_model_name)
            tokens_used = response.get('tokens_used', 0)
        # 处理字符串响应
        elif isinstance(response, str):
            content = response
            model_used = model_config.api_model_name
            tokens_used = 0
        else:
            raise ValueError(f"Unexpected response type: {type(response)}")
        
        return UnifiedModelResponse(
            content=content,
            model_used=model_used,
            tokens_used=tokens_used,
            metadata={
                'provider': model_config.provider,
                'model_id': model_id,
                'api_model': model_used,
                'organization': model_config.organization,
                'cost_estimate': self._calculate_cost(model_config, tokens_used)
            }
        )
    
    def _calculate_cost(self, model_config: ModelConfig, tokens: int) -> float:
        """计算预估成本"""
        if model_config.cost_per_1k_tokens and tokens:
            return (tokens / 1000) * model_config.cost_per_1k_tokens
        return 0.0
    
    def _build_poem_prompt(self, theme: str, style: str, language: str) -> str:
        """构建诗歌生成提示"""
        if language == "zh":
            return f"请创作一首关于'{theme}'的{style}诗歌。要求语言优美，意境深远。"
        else:
            return f"Write a {style} poem about '{theme}'. Make it beautiful and meaningful."
    
    def _build_story_prompt(self, prompt: str, genre: str, language: str) -> str:
        """构建故事生成提示"""
        if language == "zh":
            return f"创作一个{genre}类型的故事。开始：{prompt}"
        else:
            return f"Write a {genre} story. Beginning: {prompt}"
    
    def get_model_info(self, model_id: str) -> Dict[str, Any]:
        """获取模型信息"""
        model_config = self.registry.get_model(model_id)
        return {
            'model_id': model_id,
            'model_config': model_config.to_dict(),
            'provider': model_config.provider,
            'capabilities': model_config.capabilities,
            'cost_per_1k': model_config.cost_per_1k_tokens,
            'max_tokens': model_config.max_tokens
        }
    
    async def health_check(self, model_id: str) -> bool:
        """健康检查"""
        try:
            model_config = self.registry.get_model(model_id)
            provider_adapter = self._get_provider_adapter(model_config)
            return await provider_adapter.health_check()
        except Exception as e:
            logger.error(f"Health check failed for {model_id}: {e}")
            return False