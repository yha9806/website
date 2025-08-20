"""
模型配置文件 - 定义所有支持的AI模型
"""
from ..model_registry import ModelConfig, model_registry


def load_all_models():
    """加载所有模型配置到注册表"""
    
    # 如果已经加载过，不要重复加载
    if len(model_registry._models) > 0:
        try:
            print(f"[INFO] Models already loaded: {len(model_registry._models)} models in registry")
        except:
            pass
        return model_registry.get_stats()
    
    # ========== OpenAI Models ==========
    
    # GPT-5 Series (2025 releases)
    model_registry.register_model(ModelConfig(
        model_id='gpt-5',
        display_name='GPT-5',
        provider='openai',
        api_model_name='gpt-5',
        organization='OpenAI',
        capabilities=['text', 'code', 'reasoning', 'multimodal'],
        model_type='multimodal',
        parameters={'max_tokens': 128000},
        cost_per_1k_tokens=0.15,
        max_tokens=128000,
        requires_special_handling={'max_completion_tokens': True},  # Removed 'no_temperature'
        release_date='2025-08-07',
        verified=True,
        description='OpenAI\'s most advanced model with enhanced reasoning capabilities'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='gpt-5-mini',
        display_name='GPT-5 Mini',
        provider='openai',
        api_model_name='gpt-5-mini',
        organization='OpenAI',
        capabilities=['text', 'code', 'reasoning'],
        model_type='llm',
        parameters={'max_tokens': 64000},
        cost_per_1k_tokens=0.075,
        max_tokens=64000,
        requires_special_handling={'max_completion_tokens': True},
        release_date='2025-08-07',
        verified=True,
        description='Efficient GPT-5 variant for faster responses'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='gpt-5-nano',
        display_name='GPT-5 Nano',
        provider='openai',
        api_model_name='gpt-5-nano',
        organization='OpenAI',
        capabilities=['text', 'code'],
        model_type='llm',
        parameters={'max_tokens': 32000},
        cost_per_1k_tokens=0.03,
        max_tokens=32000,
        requires_special_handling={'max_completion_tokens': True},
        release_date='2025-08-07',
        verified=True,
        description='Lightweight GPT-5 for edge computing'
    ))
    
    # o1 Series (Reasoning models)
    model_registry.register_model(ModelConfig(
        model_id='o1',
        display_name='o1',
        provider='openai',
        api_model_name='o1',
        organization='OpenAI',
        capabilities=['text', 'reasoning', 'code', 'math'],
        model_type='llm',
        parameters={'max_tokens': 128000},
        cost_per_1k_tokens=0.015,
        max_tokens=128000,
        requires_special_handling={'max_completion_tokens': True},
        release_date='2024-09-12',
        verified=True,
        description='Advanced reasoning model with chain-of-thought capabilities'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='o1-mini',
        display_name='o1-mini',
        provider='openai',
        api_model_name='o1-mini',
        organization='OpenAI',
        capabilities=['text', 'reasoning', 'code'],
        model_type='llm',
        parameters={'max_tokens': 65536},
        cost_per_1k_tokens=0.003,
        max_tokens=65536,
        requires_special_handling={'max_completion_tokens': True},
        release_date='2024-09-12',
        verified=True,
        description='Smaller, faster reasoning model'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='o3-mini',
        display_name='o3-mini',
        provider='openai',
        api_model_name='o1-mini',  # Maps to o1-mini in API
        organization='OpenAI',
        capabilities=['text', 'reasoning', 'code'],
        model_type='llm',
        parameters={'max_tokens': 65536},
        cost_per_1k_tokens=0.003,
        max_tokens=65536,
        requires_special_handling={'max_completion_tokens': True},
        release_date='2025-01-17',
        verified=True,
        description='Latest iteration of compact reasoning model'
    ))
    
    # GPT-4 Series
    model_registry.register_model(ModelConfig(
        model_id='gpt-4o',
        display_name='GPT-4o',
        provider='openai',
        api_model_name='gpt-4o',
        organization='OpenAI',
        capabilities=['text', 'vision', 'code'],
        model_type='multimodal',
        parameters={'max_tokens': 128000},
        cost_per_1k_tokens=0.005,
        max_tokens=128000,
        release_date='2024-05-13',
        verified=True,
        description='Optimized GPT-4 with vision capabilities'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='gpt-4o-mini',
        display_name='GPT-4o Mini',
        provider='openai',
        api_model_name='gpt-4o-mini',
        organization='OpenAI',
        capabilities=['text', 'code'],
        model_type='llm',
        parameters={'max_tokens': 128000},
        cost_per_1k_tokens=0.00015,
        max_tokens=128000,
        release_date='2024-07-18',
        verified=True,
        description='Most cost-effective small model with GPT-4 intelligence'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='gpt-4-turbo',
        display_name='GPT-4 Turbo',
        provider='openai',
        api_model_name='gpt-4-turbo',
        organization='OpenAI',
        capabilities=['text', 'vision', 'code'],
        model_type='multimodal',
        parameters={'max_tokens': 128000},
        cost_per_1k_tokens=0.01,
        max_tokens=128000,
        release_date='2024-04-09',
        verified=True,
        description='GPT-4 Turbo with vision, function calling, and JSON mode'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='gpt-4',
        display_name='GPT-4',
        provider='openai',
        api_model_name='gpt-4',
        organization='OpenAI',
        capabilities=['text', 'code'],
        model_type='llm',
        parameters={'max_tokens': 8192},
        cost_per_1k_tokens=0.03,
        max_tokens=8192,
        release_date='2023-03-14',
        verified=True,
        description='Original GPT-4 model'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='gpt-4.5',
        display_name='GPT-4.5',
        provider='openai',
        api_model_name='gpt-4-turbo',  # Currently maps to gpt-4-turbo
        organization='OpenAI',
        capabilities=['text', 'vision', 'code'],
        model_type='multimodal',
        parameters={'max_tokens': 128000},
        cost_per_1k_tokens=0.01,
        max_tokens=128000,
        release_date='2024-11-15',
        verified=True,
        description='Enhanced GPT-4 with improved capabilities'
    ))
    
    # ========== DeepSeek Models ==========
    
    model_registry.register_model(ModelConfig(
        model_id='deepseek-r1',
        display_name='DeepSeek R1',
        provider='deepseek',
        api_model_name='deepseek-chat',  # Changed: use deepseek-chat for poetry support
        organization='DeepSeek',
        capabilities=['text', 'code', 'reasoning', 'math'],
        model_type='llm',
        parameters={'max_tokens': 32768},
        cost_per_1k_tokens=0.002,
        max_tokens=32768,
        release_date='2025-01-20',
        verified=False,
        description='DeepSeek\'s reasoning model with strong mathematical capabilities'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='deepseek-r1-distill',
        display_name='DeepSeek R1-distill',
        provider='deepseek',
        api_model_name='deepseek-chat',  # Changed: use deepseek-chat for poetry support
        organization='DeepSeek',
        capabilities=['text', 'code', 'reasoning'],
        model_type='llm',
        parameters={'max_tokens': 32768},
        cost_per_1k_tokens=0.001,
        max_tokens=32768,
        release_date='2025-01-20',
        verified=False,
        description='Distilled version of DeepSeek R1'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='deepseek-v3',
        display_name='DeepSeek V3',
        provider='deepseek',
        api_model_name='deepseek-chat',
        organization='DeepSeek',
        capabilities=['text', 'code'],
        model_type='llm',
        parameters={'max_tokens': 32768},
        cost_per_1k_tokens=0.001,
        max_tokens=32768,
        release_date='2024-12-26',
        verified=False,
        description='DeepSeek\'s latest general-purpose model'
    ))
    
    # ========== Qwen/Alibaba Models ==========
    
    model_registry.register_model(ModelConfig(
        model_id='qwen3-235b',
        display_name='Qwen3-235B',
        provider='qwen',
        api_model_name='qwen-max-2025-01-25',  # Updated to 2025 version
        organization='Alibaba',
        capabilities=['text', 'code', 'reasoning'],
        model_type='llm',
        parameters={'max_tokens': 32768},
        cost_per_1k_tokens=0.004,
        max_tokens=32768,
        release_date='2025-01-01',
        verified=False,
        description='Alibaba\'s largest model with 235B parameters'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='qwen2.5-72b',
        display_name='Qwen2.5-72B',
        provider='qwen',
        api_model_name='qwen-plus',
        organization='Alibaba',
        capabilities=['text', 'code'],
        model_type='llm',
        parameters={'max_tokens': 32768},
        cost_per_1k_tokens=0.002,
        max_tokens=32768,
        release_date='2024-09-19',
        verified=False,
        description='Qwen 2.5 series large model'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='qwen2-72b',
        display_name='Qwen2-72B',
        provider='qwen',
        api_model_name='qwen-plus',
        organization='Alibaba',
        capabilities=['text', 'code'],
        model_type='llm',
        parameters={'max_tokens': 32768},
        cost_per_1k_tokens=0.002,
        max_tokens=32768,
        release_date='2024-06-07',
        verified=False,
        description='Qwen 2 series large model'
    ))
    
    # ========== Claude/Anthropic Models ==========
    
    model_registry.register_model(ModelConfig(
        model_id='claude-opus-4.1',
        display_name='Claude Opus 4.1',
        provider='anthropic',
        api_model_name='claude-3-opus-20240229',  # Use actual API model name
        organization='Anthropic',
        capabilities=['text', 'code', 'reasoning', 'vision'],
        model_type='multimodal',
        parameters={'max_tokens': 200000},
        cost_per_1k_tokens=0.015,
        max_tokens=200000,
        release_date='2025-08-05',
        verified=False,
        description='Most capable Claude model with 200K context'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='claude-sonnet-4',
        display_name='Claude Sonnet 4',
        provider='anthropic',
        api_model_name='claude-3-sonnet-20240229',  # Use actual API model name
        organization='Anthropic',
        capabilities=['text', 'code', 'reasoning'],
        model_type='llm',
        parameters={'max_tokens': 200000},
        cost_per_1k_tokens=0.003,
        max_tokens=200000,
        release_date='2025-05-22',
        verified=False,
        description='Balanced Claude model for most tasks'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='claude-3.5-sonnet',
        display_name='Claude 3.5 Sonnet',
        provider='anthropic',
        api_model_name='claude-3-5-sonnet-20241022',  # Updated to latest version
        organization='Anthropic',
        capabilities=['text', 'code', 'reasoning'],
        model_type='llm',
        parameters={'max_tokens': 200000},
        cost_per_1k_tokens=0.003,
        max_tokens=200000,
        release_date='2024-06-20',
        verified=False,
        description='Claude 3.5 Sonnet with improved capabilities'
    ))
    
    # ========== Image Models ==========
    
    model_registry.register_model(ModelConfig(
        model_id='dall-e-3',
        display_name='DALL-E 3',
        provider='openai',
        api_model_name='dall-e-3',
        organization='OpenAI',
        capabilities=['image'],
        model_type='image',
        parameters={'sizes': ['1024x1024', '1792x1024', '1024x1792']},
        cost_per_1k_tokens=0.04,  # Cost per image
        max_tokens=0,  # N/A for image models
        release_date='2023-10-05',
        verified=True,
        description='Advanced text-to-image generation model'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='midjourney-v6',
        display_name='Midjourney V6',
        provider='midjourney',
        api_model_name='midjourney-v6',
        organization='Midjourney',
        capabilities=['image'],
        model_type='image',
        parameters={},
        cost_per_1k_tokens=0.0,
        max_tokens=0,
        release_date='2023-12-21',
        verified=False,
        description='Artistic image generation model'
    ))
    
    model_registry.register_model(ModelConfig(
        model_id='stable-diffusion-xl',
        display_name='Stable Diffusion XL',
        provider='stability',
        api_model_name='stable-diffusion-xl',
        organization='Stability AI',
        capabilities=['image'],
        model_type='image',
        parameters={'sizes': ['1024x1024', '768x768', '512x512']},
        cost_per_1k_tokens=0.002,
        max_tokens=0,
        release_date='2023-07-26',
        verified=False,
        description='Open-source image generation model'
    ))
    
    try:
        print(f"Loaded {len(model_registry._models)} models into registry")
    except:
        pass
    return model_registry.get_stats()


def get_model_by_id(model_id: str) -> ModelConfig:
    """获取指定ID的模型配置"""
    return model_registry.get_model(model_id)


def list_available_models(provider: str = None) -> list:
    """列出可用的模型"""
    return model_registry.list_models(provider=provider)


# 注意：模型会在 __init__.py 中自动加载，这里不需要重复加载
# 保留这个条件以备调试使用
if __name__ == "__main__":
    # 仅在直接运行此文件时加载（用于测试）
    stats = load_all_models()
    print(f"Test load complete: {stats}")