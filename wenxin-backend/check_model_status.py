"""
检查所有配置的模型状态和可测试性
"""
import os
from app.services.models import model_registry, load_all_models
from app.core.config import settings

# 加载所有模型
stats = load_all_models()
print(f"\n{'='*80}")
print(f"模型统计总览")
print(f"{'='*80}")
print(f"总模型数: {stats['total_models']}")
print(f"提供商数: {stats['providers']}")
print(f"组织数: {stats['organizations']}")
print(f"已验证模型: {stats['verified_models']}")
print(f"模型类型分布: {stats['model_types']}")

# 检查每个提供商的API配置状态
print(f"\n{'='*80}")
print(f"API配置状态检查")
print(f"{'='*80}")

api_status = {
    'openai': bool(os.getenv('OPENAI_API_KEY') or getattr(settings, 'OPENAI_API_KEY', None)),
    'deepseek': bool(os.getenv('DEEPSEEK_API_KEY') or getattr(settings, 'DEEPSEEK_API_KEY', None)),
    'qwen': bool(os.getenv('QWEN_API_KEY') or getattr(settings, 'QWEN_API_KEY', None)),
    'xai': bool(os.getenv('XAI_API_KEY') or getattr(settings, 'XAI_API_KEY', None)),
    'openrouter': bool(os.getenv('OPENROUTER_API_KEY') or getattr(settings, 'OPENROUTER_API_KEY', None)),
    'gemini': bool(os.getenv('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', None)),
    'anthropic': bool(os.getenv('ANTHROPIC_API_KEY') or getattr(settings, 'ANTHROPIC_API_KEY', None)),
    'huggingface': bool(os.getenv('HUGGINGFACE_API_KEY') or getattr(settings, 'HUGGINGFACE_API_KEY', None)),
}

for provider, has_key in api_status.items():
    status = "OK - Configured" if has_key else "NO - Not configured"
    print(f"{provider:15} : {status}")

# 列出所有模型及其测试状态
print(f"\n{'='*80}")
print(f"模型详细列表及可测试性")
print(f"{'='*80}")
print(f"{'模型ID':<25} {'提供商':<12} {'类型':<10} {'已验证':<8} {'可测试':<8}")
print(f"{'-'*80}")

testable_models = []
untestable_models = []

for model_id in sorted(model_registry._models.keys()):
    config = model_registry.get_model(model_id)
    provider = config.provider
    model_type = config.model_type
    verified = "是" if config.verified else "否"
    
    # 检查是否可测试
    can_test = False
    if model_type == 'image':
        can_test = False  # 图像模型不能进行文本测试
        testable = "N/A"
    elif provider in api_status and api_status[provider]:
        can_test = True
        testable = "YES"
        testable_models.append(model_id)
    else:
        testable = "NO"
        untestable_models.append(model_id)
    
    print(f"{model_id:<25} {provider:<12} {model_type:<10} {verified:<8} {testable:<8}")

# 总结
print(f"\n{'='*80}")
print(f"测试能力总结")
print(f"{'='*80}")
print(f"可测试模型数: {len(testable_models)}")
print(f"不可测试模型数: {len(untestable_models)}")
print(f"图像模型数 (N/A): {len([m for m in model_registry._models.values() if m.model_type == 'image'])}")

if testable_models:
    print(f"\n可立即测试的模型:")
    for model in testable_models[:10]:  # 只显示前10个
        print(f"  - {model}")
    if len(testable_models) > 10:
        print(f"  ... 还有 {len(testable_models) - 10} 个模型")

# 特别说明OpenAI模型
print(f"\n{'='*80}")
print(f"OpenAI模型特别说明")
print(f"{'='*80}")
openai_models = [m for m in model_registry._models.keys() if model_registry.get_model(m).provider == 'openai']
print(f"OpenAI模型总数: {len(openai_models)}")
print(f"包括: {', '.join(openai_models[:5])}...")

if api_status['openai']:
    print(f"\n[OK] OpenAI API is configured. The following models can be tested:")
    print(f"  - GPT-5 series (gpt-5, gpt-5-mini, gpt-5-nano)")
    print(f"  - o1 series (o1, o1-mini, o3-mini)")
    print(f"  - GPT-4 series (gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini)")
    print(f"  Note: GPT-5 and o1 series require special parameter handling")
else:
    print(f"\n[ERROR] OpenAI API not configured, need to set OPENAI_API_KEY")