"""
Qwen Provider适配器
"""
from typing import Dict, Any
import logging
import os
from openai import AsyncOpenAI

from .base import BaseAdapter

logger = logging.getLogger(__name__)


class QwenAdapter(BaseAdapter):
    """Qwen适配器"""
    
    def _initialize_client(self):
        api_key = os.getenv("QWEN_API_KEY")
        if not api_key:
            raise ValueError("Qwen API key not configured")
        
        return AsyncOpenAI(
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
    
    async def generate(self, request: Dict[str, Any]) -> Any:
        if not self.validate_request(request):
            raise ValueError("Invalid request parameters")
        
        params = {
            'model': request['model'],
            'messages': [{"role": "user", "content": request['prompt']}],
            'max_tokens': request.get('max_tokens', 1024),
            'temperature': request.get('temperature', 0.7)
        }
        
        return await self.client.chat.completions.create(**params)
    
    async def health_check(self) -> bool:
        try:
            await self.client.chat.completions.create(
                model="qwen-plus",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10
            )
            return True
        except:
            return False