"""
模型验证器 - 验证模型可用性和响应正确性
"""
from typing import Any, Optional
import logging
import re

from .model_registry import ModelConfig

logger = logging.getLogger(__name__)


class ModelValidator:
    """模型验证器"""
    
    async def validate_availability(self, model_config: ModelConfig, adapter: Any) -> bool:
        """
        验证模型是否可用
        
        Args:
            model_config: 模型配置
            adapter: Provider适配器
            
        Returns:
            是否可用
        """
        try:
            # 首先检查适配器的健康状态
            is_healthy = await adapter.health_check()
            if not is_healthy:
                logger.warning(f"Model {model_config.model_id} adapter health check failed")
                return False
            
            # 可以添加更多验证逻辑，比如实际调用一次简单请求
            # 暂时只返回健康检查结果
            return True
            
        except Exception as e:
            logger.error(f"Error validating model {model_config.model_id}: {e}")
            return False
    
    async def validate_response(self, response: Any, expected_model: str) -> bool:
        """
        验证响应是否来自预期的模型
        
        Args:
            response: Provider响应
            expected_model: 预期的模型名称
            
        Returns:
            是否有效
        """
        try:
            # 处理OpenAI格式的响应
            if hasattr(response, 'model'):
                actual_model = response.model
                
                # 某些模型返回带版本号的名称，如 gpt-4o-2024-08-06
                # 我们只检查前缀是否匹配
                expected_prefix = expected_model.split('-')[0]  # 获取模型系列，如 gpt
                
                if actual_model.startswith(expected_prefix):
                    logger.info(f"Response validated: expected {expected_model}, got {actual_model}")
                    return True
                else:
                    logger.warning(f"Model mismatch: expected {expected_model}, got {actual_model}")
                    return False
            
            # 处理字典格式的响应
            elif isinstance(response, dict) and 'model' in response:
                actual_model = response['model']
                if actual_model == expected_model:
                    return True
                else:
                    logger.warning(f"Model mismatch: expected {expected_model}, got {actual_model}")
                    return False
            
            # 如果响应没有模型信息，默认认为有效（某些Provider可能不返回模型信息）
            logger.info(f"Response has no model information, assuming valid")
            return True
            
        except Exception as e:
            logger.error(f"Error validating response: {e}")
            return False
    
    async def validate_content(self, content: str, task_type: str, min_length: int = 10) -> bool:
        """
        验证生成内容的质量
        
        Args:
            content: 生成的内容
            task_type: 任务类型
            min_length: 最小长度要求
            
        Returns:
            是否有效
        """
        if not content:
            logger.error("Generated content is empty")
            return False
        
        if len(content) < min_length:
            logger.warning(f"Generated content too short: {len(content)} < {min_length}")
            return False
        
        # 根据任务类型进行特定验证
        if task_type == 'poem':
            # 诗歌应该有换行
            if '\n' not in content and len(content) > 50:
                logger.warning("Poem has no line breaks")
                # 不一定无效，某些诗歌格式可能没有换行
        
        elif task_type == 'code':
            # 代码应该包含一些编程元素
            code_patterns = [r'\bdef\b', r'\bclass\b', r'\bfunction\b', r'\bif\b', r'\bfor\b', r'{', r'}']
            has_code_element = any(re.search(pattern, content) for pattern in code_patterns)
            if not has_code_element:
                logger.warning("Code content doesn't contain typical programming elements")
        
        return True
    
    def validate_model_config(self, config: ModelConfig) -> bool:
        """
        验证模型配置是否完整
        
        Args:
            config: 模型配置
            
        Returns:
            是否有效
        """
        required_fields = ['model_id', 'display_name', 'provider', 'api_model_name', 'organization']
        
        for field in required_fields:
            if not hasattr(config, field) or not getattr(config, field):
                logger.error(f"Model config missing required field: {field}")
                return False
        
        # 验证provider是否支持
        supported_providers = ['openai', 'deepseek', 'qwen', 'xai', 'openrouter', 
                              'gemini', 'anthropic', 'huggingface']
        if config.provider not in supported_providers:
            logger.error(f"Unsupported provider: {config.provider}")
            return False
        
        return True
    
    def validate_request_params(self, params: dict) -> bool:
        """
        验证请求参数
        
        Args:
            params: 请求参数
            
        Returns:
            是否有效
        """
        # 必需参数
        if 'prompt' not in params or not params['prompt']:
            logger.error("Request missing 'prompt' parameter")
            return False
        
        # 验证max_tokens
        if 'max_tokens' in params:
            if not isinstance(params['max_tokens'], int) or params['max_tokens'] <= 0:
                logger.error(f"Invalid max_tokens: {params['max_tokens']}")
                return False
        
        # 验证temperature
        if 'temperature' in params:
            temp = params['temperature']
            if not isinstance(temp, (int, float)) or temp < 0 or temp > 2:
                logger.error(f"Invalid temperature: {temp}")
                return False
        
        return True