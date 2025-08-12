"""
Provider适配器系统
"""
from typing import Optional
from .base import BaseAdapter
from ..model_registry import ModelConfig


def get_adapter(provider: str, model_config: ModelConfig) -> Optional[BaseAdapter]:
    """
    获取对应的Provider适配器
    
    Args:
        provider: Provider名称
        model_config: 模型配置
        
    Returns:
        对应的适配器实例，如果不存在则返回None
    """
    if provider == 'openai':
        from .openai_adapter import OpenAIAdapter
        return OpenAIAdapter(model_config)
    
    elif provider == 'deepseek':
        from .deepseek_adapter import DeepSeekAdapter
        return DeepSeekAdapter(model_config)
    
    elif provider == 'qwen':
        from .qwen_adapter import QwenAdapter
        return QwenAdapter(model_config)
    
    elif provider == 'xai':
        from .xai_adapter import XAIAdapter
        return XAIAdapter(model_config)
    
    elif provider == 'openrouter':
        from .openrouter_adapter import OpenRouterAdapter
        return OpenRouterAdapter(model_config)
    
    elif provider == 'gemini':
        from .gemini_adapter import GeminiAdapter
        return GeminiAdapter(model_config)
    
    elif provider == 'anthropic':
        from .anthropic_adapter import AnthropicAdapter
        return AnthropicAdapter(model_config)
    
    elif provider == 'huggingface':
        from .huggingface_adapter import HuggingFaceAdapter
        return HuggingFaceAdapter(model_config)
    
    else:
        return None


__all__ = ['BaseAdapter', 'get_adapter']