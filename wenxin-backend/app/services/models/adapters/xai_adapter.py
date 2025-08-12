"""X AI Provider适配器"""
from .base import BaseAdapter
import os
from openai import AsyncOpenAI

class XAIAdapter(BaseAdapter):
    def _initialize_client(self):
        api_key = os.getenv("XAI_API_KEY")
        if not api_key:
            raise ValueError("X AI API key not configured")
        return AsyncOpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
    
    async def generate(self, request):
        params = {
            'model': request['model'],
            'messages': [{'role': 'user', 'content': request['prompt']}],
            'max_tokens': request.get('max_tokens', 1024)
        }
        return await self.client.chat.completions.create(**params)
    
    async def health_check(self):
        return False  # 暂时返回False