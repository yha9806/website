"""
测试修复后的GPT-5模型配置
"""
import asyncio
from app.services.models import UnifiedModelClient, load_all_models

async def test_models():
    """测试GPT-5和o1系列模型"""
    
    # 加载模型
    load_all_models()
    client = UnifiedModelClient()
    
    # 测试模型列表
    test_models = [
        ('gpt-4o-mini', 'GPT-4o Mini (Standard)'),
        ('gpt-5', 'GPT-5 (With max_completion_tokens)'),
        ('gpt-5-mini', 'GPT-5 Mini'),
        ('gpt-5-nano', 'GPT-5 Nano'),
        ('o1', 'O1 Reasoning Model'),
        ('o1-mini', 'O1 Mini'),
        ('o3-mini', 'O3 Mini (Maps to o1-mini)'),
    ]
    
    print("\n" + "="*60)
    print("Testing Fixed Model Configurations")
    print("="*60)
    
    for model_id, description in test_models:
        print(f"\nTesting: {description}")
        print(f"Model ID: {model_id}")
        print("-"*40)
        
        try:
            response = await client.generate(
                model_id=model_id,
                prompt="Write a haiku about coding",
                max_tokens=100,  # Will be converted to max_completion_tokens for GPT-5/o1
                temperature=0.7
            )
            
            print(f"[SUCCESS]")
            print(f"  Model Used: {response.get('model_used', 'unknown')}")
            print(f"  Tokens Used: {response.get('tokens_used', 0)}")
            content = response.get('content', '')
            if content:
                print(f"  Response Preview: {content[:150]}")
            else:
                print(f"  Response: [Empty response]")
                
        except Exception as e:
            error_str = str(e)
            print(f"[FAILED]")
            print(f"  Error: {error_str[:200]}")
            
            # 检查是否是参数问题
            if 'max_tokens' in error_str and 'max_completion_tokens' in error_str:
                print(f"  -> Issue: Parameter name conflict")
            elif 'temperature' in error_str:
                print(f"  -> Issue: Temperature parameter problem")
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print("GPT-5 and o1 series should now work correctly with:")
    print("  - max_completion_tokens (converted from max_tokens)")
    print("  - temperature parameter (unless explicitly disabled)")
    print("  - All standard OpenAI API features")

if __name__ == "__main__":
    asyncio.run(test_models())