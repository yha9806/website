"""
修复模型配置 - 基于2025年最新API信息
"""

print("="*60)
print("模型配置问题分析与修复方案")
print("="*60)

# 问题分析
issues = {
    "OpenAI o1/o1-mini/o3-mini": {
        "问题": "不支持system角色消息",
        "原因": "o1系列模型（o1-mini, o3-mini）不支持system role，只支持user和assistant角色",
        "解决方案": "修改UnifiedClient，对o1系列移除system消息或转换为user消息"
    },
    
    "DeepSeek R1系列": {
        "问题": "Model Not Exist错误",
        "原因": "API模型名称错误，应该使用'deepseek-reasoner'而不是'deepseek-r1'",
        "解决方案": "更新model_configs.py中的api_model_name为'deepseek-reasoner'"
    },
    
    "Claude系列": {
        "问题": "Model not available",
        "原因": "需要ANTHROPIC_API_KEY，且模型名称格式应为'claude-3-5-sonnet-20241022'等",
        "解决方案": "1. 配置ANTHROPIC_API_KEY\n2. 更新正确的模型名称格式"
    },
    
    "GPT-5系列": {
        "问题": "部分响应为空",
        "原因": "GPT-5系列使用reasoning_effort参数控制推理时间，可能需要特殊处理",
        "解决方案": "添加reasoning_effort参数支持"
    },
    
    "Qwen系列": {
        "问题": "Model not available",
        "原因": "需要阿里云API密钥，模型名称应为'qwen-max-2025-01-25'、'qwen-plus'等",
        "解决方案": "1. 配置QWEN_API_KEY\n2. 更新正确的模型名称"
    }
}

print("\n问题详细分析：")
for model, info in issues.items():
    print(f"\n{model}:")
    print(f"  问题: {info['问题']}")
    print(f"  原因: {info['原因']}")
    print(f"  解决方案: {info['解决方案']}")

print("\n" + "="*60)
print("需要修改的文件：")
print("="*60)

files_to_fix = [
    {
        "file": "app/services/models/configs/model_configs.py",
        "changes": [
            "DeepSeek R1: api_model_name='deepseek-reasoner'",
            "Claude 3.5: api_model_name='claude-3-5-sonnet-20241022'",
            "Qwen3-235B: api_model_name='qwen-max-2025-01-25'"
        ]
    },
    {
        "file": "app/services/models/adapters/openai_adapter.py",
        "changes": [
            "o1系列: 移除system消息支持",
            "GPT-5系列: 添加reasoning_effort参数"
        ]
    },
    {
        "file": ".env",
        "changes": [
            "添加 ANTHROPIC_API_KEY",
            "添加 QWEN_API_KEY 或 ALIBABA_API_KEY"
        ]
    }
]

for file_info in files_to_fix:
    print(f"\n{file_info['file']}:")
    for change in file_info['changes']:
        print(f"  - {change}")

print("\n" + "="*60)
print("正确的模型配置示例：")
print("="*60)

correct_configs = """
# DeepSeek R1 (正确配置)
model_registry.register_model(ModelConfig(
    model_id='deepseek-r1',
    api_model_name='deepseek-reasoner',  # 使用 deepseek-reasoner
    ...
))

# Claude 3.5 Sonnet (正确配置)
model_registry.register_model(ModelConfig(
    model_id='claude-3.5-sonnet',
    api_model_name='claude-3-5-sonnet-20241022',  # 使用完整版本号
    ...
))

# Qwen Max (正确配置)
model_registry.register_model(ModelConfig(
    model_id='qwen3-235b',
    api_model_name='qwen-max-2025-01-25',  # 使用最新版本
    ...
))

# o1-mini (特殊处理)
# 在adapter中检测o1系列，移除system消息：
if 'o1' in model_id or 'o3-mini' in model_id:
    messages = [msg for msg in messages if msg['role'] != 'system']
"""

print(correct_configs)

print("\n" + "="*60)
print("API可用性总结：")
print("="*60)

api_status = {
    "✅ OpenAI GPT-4系列": "完全可用",
    "✅ OpenAI o1": "可用（需移除system消息）",
    "⚠️ OpenAI o1-mini/o3-mini": "需要特殊处理（不支持system角色）",
    "✅ OpenAI GPT-5系列": "已发布（2025年8月），需要API访问权限",
    "✅ DeepSeek V3": "可用（使用deepseek-chat）",
    "⚠️ DeepSeek R1": "需使用deepseek-reasoner作为模型名",
    "❌ Claude系列": "需要配置ANTHROPIC_API_KEY",
    "❌ Qwen系列": "需要阿里云账号和API密钥"
}

for status, desc in api_status.items():
    print(f"{status}: {desc}")

print("\n建议优先修复：")
print("1. DeepSeek R1模型名称（简单修复）")
print("2. o1系列system消息问题（中等复杂度）")
print("3. 配置缺失的API密钥（需要用户提供）")