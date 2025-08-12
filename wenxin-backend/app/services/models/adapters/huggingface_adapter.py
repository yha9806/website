"""HuggingFace Provider适配器"""
from .base import BaseAdapter

class HuggingFaceAdapter(BaseAdapter):
    def _initialize_client(self):
        return None
    
    async def generate(self, request):
        return {
            'content': 'HuggingFace response placeholder',
            'model': request['model'],
            'tokens_used': 100
        }
    
    async def health_check(self):
        return False