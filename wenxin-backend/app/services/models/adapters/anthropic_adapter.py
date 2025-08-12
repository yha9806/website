"""Anthropic Provider适配器"""
from .base import BaseAdapter

class AnthropicAdapter(BaseAdapter):
    def _initialize_client(self):
        return None
    
    async def generate(self, request):
        return {
            'content': 'Anthropic response placeholder',
            'model': request['model'],
            'tokens_used': 100
        }
    
    async def health_check(self):
        return False