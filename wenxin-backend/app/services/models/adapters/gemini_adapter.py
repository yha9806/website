"""Gemini Provider适配器"""
from .base import BaseAdapter
import os

class GeminiAdapter(BaseAdapter):
    def _initialize_client(self):
        # Gemini需要特殊处理
        return None
    
    async def generate(self, request):
        # 暂时返回模拟响应
        return {
            'content': 'Gemini response placeholder',
            'model': request['model'],
            'tokens_used': 100
        }
    
    async def health_check(self):
        return False