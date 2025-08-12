"""
检查OpenAI实际可用的模型
"""
from openai import OpenAI
import os
from app.core.config import settings

# 初始化客户端
api_key = os.getenv('OPENAI_API_KEY') or getattr(settings, 'OPENAI_API_KEY', None)
if not api_key:
    print("Error: OpenAI API key not found")
    exit(1)

client = OpenAI(api_key=api_key)

print("Fetching available OpenAI models...")
print("="*60)

try:
    # 获取模型列表
    models = client.models.list()
    
    # 筛选出聊天模型
    chat_models = []
    for model in models:
        model_id = model.id
        # 筛选可能用于聊天的模型
        if any(prefix in model_id for prefix in ['gpt', 'o1', 'o3', 'davinci', 'babbage']):
            chat_models.append(model_id)
    
    # 排序并显示
    chat_models.sort()
    
    print(f"Found {len(chat_models)} chat-capable models:\n")
    
    # 检查我们声称的模型是否存在
    claimed_models = [
        'gpt-5', 'gpt-5-mini', 'gpt-5-nano',
        'o1', 'o1-mini', 'o3-mini',
        'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'
    ]
    
    print("Checking our claimed models:")
    print("-"*40)
    for model in claimed_models:
        exists = any(model in m for m in chat_models)
        status = "✓ EXISTS" if exists else "✗ NOT FOUND"
        # 查找实际匹配的模型名
        if exists:
            actual = [m for m in chat_models if model in m]
            print(f"{model:15} : {status:12} -> {actual[0] if actual else ''}")
        else:
            print(f"{model:15} : {status}")
    
    print("\n" + "="*60)
    print("All available GPT/O-series models:")
    print("-"*40)
    for model in chat_models:
        if model.startswith(('gpt', 'o1', 'o3')):
            print(f"  - {model}")
            
except Exception as e:
    print(f"Error fetching models: {e}")

# 测试特定模型
print("\n" + "="*60)
print("Testing specific model calls:")
print("-"*40)

test_cases = [
    ('gpt-4o-mini', {'max_tokens': 50}),
    ('gpt-5', {'max_tokens': 50}),
    ('gpt-5', {'max_completion_tokens': 50}),
    ('o1-mini', {'max_completion_tokens': 50}),
]

for model, params in test_cases:
    try:
        print(f"\nTesting {model} with {params}...")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Say hello"}],
            **params
        )
        print(f"  SUCCESS: {response.choices[0].message.content[:50]}")
    except Exception as e:
        error_msg = str(e)[:150]
        print(f"  FAILED: {error_msg}")