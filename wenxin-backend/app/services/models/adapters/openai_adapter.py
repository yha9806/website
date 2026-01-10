"""
OpenAI Provider适配器
"""
from typing import Dict, Any
import logging
from openai import AsyncOpenAI

from .base import BaseAdapter
from ..model_registry import ModelConfig
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIAdapter(BaseAdapter):
    """OpenAI适配器 - 支持GPT-5, GPT-4, o1等模型"""
    
    def _initialize_client(self):
        """初始化OpenAI客户端"""
        api_key = settings.OPENAI_API_KEY
        if not api_key or api_key == "your-openai-key-here":
            raise ValueError("OpenAI API key not configured")
        
        return AsyncOpenAI(api_key=api_key)
    
    async def generate(self, request: Dict[str, Any]) -> Any:
        """
        调用OpenAI API生成内容
        
        Args:
            request: 请求参数
            
        Returns:
            OpenAI API响应
        """
        if not self.validate_request(request):
            raise ValueError("Invalid request parameters")
        
        # 准备API调用参数
        model_name = request['model']
        params = {
            'model': model_name,  # 使用传入的模型名称！
            'messages': self._prepare_messages(
                request['prompt'], 
                request.get('task_type', 'general'),
                model_name  # Pass model name to handle o1 series
            )
        }
        
        # 处理max_tokens - GPT-5和o1系列需要特殊处理
        if 'max_completion_tokens' in request:
            params['max_completion_tokens'] = request['max_completion_tokens']
            logger.info(f"Using max_completion_tokens={request['max_completion_tokens']} for {request['model']}")
        elif 'max_tokens' in request:
            params['max_tokens'] = request['max_tokens']
            logger.info(f"Using max_tokens={request['max_tokens']} for {request['model']}")
        
        # 处理temperature - GPT-5和o1系列不支持temperature
        if 'temperature' in request and request['temperature'] is not None:
            # GPT-5和o1系列不支持temperature
            if request['model'] not in ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'o1', 'o1-mini', 'o3-mini']:
                params['temperature'] = request['temperature']
        
        # 添加GPT-5特定参数
        if request['model'] in ['gpt-5', 'gpt-5-mini', 'gpt-5-nano']:
            # Note: verbosity='high' causes empty responses, so skip it
            # if 'verbosity' in request:
            #     params['verbosity'] = request['verbosity']
            if 'reasoning_effort' in request:
                params['reasoning_effort'] = request['reasoning_effort']
        
        # 添加o1系列特定参数
        if request['model'] in ['o1', 'o1-mini', 'o3-mini']:
            if 'reasoning_effort' in request:
                params['reasoning_effort'] = request['reasoning_effort']
        
        # 添加其他可选参数
        optional_params = ['top_p', 'frequency_penalty', 'presence_penalty', 'stop', 'n']
        for param in optional_params:
            if param in request:
                params[param] = request[param]
        
        # 调用API
        logger.info(f"Calling OpenAI API with model={params['model']}")
        try:
            response = await self.client.chat.completions.create(**params)
            logger.info(f"OpenAI API responded with model={response.model}")
            return response
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    def _prepare_messages(self, prompt: str, task_type: str, model_name: str = '') -> list:
        """
        准备消息列表
        
        Args:
            prompt: 用户提示
            task_type: 任务类型
            model_name: 模型名称（用于判断是否需要特殊处理）
            
        Returns:
            消息列表
        """
        messages = []
        
        # Check if this is an o1 series model that doesn't support system messages
        # Note: o1, o1-mini, o3-mini all don't support system messages
        model_lower = model_name.lower()
        is_o1_series = (
            model_lower == 'o1' or 
            model_lower == 'o1-mini' or 
            model_lower == 'o3-mini' or
            model_lower == 'o1-preview' or
            'o1-' in model_lower or
            'o3-' in model_lower
        )
        
        # 根据任务类型准备系统提示
        system_content = None
        if task_type == 'poem':
            system_content = "You are a talented poet. Create beautiful, meaningful poems with rich imagery and emotion."
        elif task_type == 'story':
            system_content = "You are a creative storyteller. Write engaging stories with vivid characters and compelling plots."
        elif task_type == 'code':
            system_content = "You are an expert programmer. Write clean, efficient, and well-documented code."
        elif task_type == 'analysis':
            system_content = "You are an analytical expert. Provide thorough, insightful analysis with clear reasoning."
        
        # Handle system message based on model type
        if system_content:
            if is_o1_series:
                # For o1 series, merge system content into user message
                prompt = f"{system_content}\n\n{prompt}"
            else:
                # For other models, use system message normally
                messages.append({
                    "role": "system",
                    "content": system_content
                })
        
        # 添加用户消息
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        return messages
    
    async def health_check(self) -> bool:
        """
        检查OpenAI API是否可用
        
        Returns:
            是否可用
        """
        try:
            # 尝试列出模型
            await self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
    
    async def list_available_models(self) -> list:
        """
        列出可用的模型
        
        Returns:
            模型列表
        """
        try:
            models = await self.client.models.list()
            return [model.id for model in models.data]
        except Exception as e:
            logger.error(f"Failed to list OpenAI models: {e}")
            return []