"""
DeepSeek Provider适配器
"""
from typing import Dict, Any
import logging
import os
from openai import AsyncOpenAI

from .base import BaseAdapter
from ..model_registry import ModelConfig

logger = logging.getLogger(__name__)


class DeepSeekAdapter(BaseAdapter):
    """DeepSeek适配器 - 使用OpenAI兼容API"""
    
    def _initialize_client(self):
        """初始化DeepSeek客户端"""
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            raise ValueError("DeepSeek API key not configured")
        
        return AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1"
        )
    
    async def generate(self, request: Dict[str, Any]) -> Any:
        """调用DeepSeek API生成内容"""
        if not self.validate_request(request):
            raise ValueError("Invalid request parameters")
        
        params = {
            'model': request['model'],  # 使用传入的模型名称
            'messages': [
                {"role": "user", "content": request['prompt']}
            ]
        }
        
        # 处理max_tokens
        if 'max_tokens' in request:
            params['max_tokens'] = request['max_tokens']
        
        # 处理temperature
        if 'temperature' in request:
            params['temperature'] = request['temperature']
        
        logger.info(f"Calling DeepSeek API with model={params['model']}")
        
        try:
            response = await self.client.chat.completions.create(**params)
            logger.info(f"DeepSeek API responded successfully")
            return response
        except Exception as e:
            logger.error(f"DeepSeek API error: {e}")
            raise
    
    async def health_check(self) -> bool:
        """检查DeepSeek API是否可用"""
        try:
            response = await self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10
            )
            return True
        except Exception as e:
            logger.error(f"DeepSeek health check failed: {e}")
            return False