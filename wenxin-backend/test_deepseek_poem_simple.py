"""
简单测试 DeepSeek R1 诗歌问题
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


async def test_simple():
    """简单测试"""
    print("Testing DeepSeek R1 Poetry Issue")
    print("="*50)
    
    from app.services.models import UnifiedModelClient, model_registry
    from app.services.models.configs import model_configs
    
    # 加载模型
    model_configs.load_all_models()
    
    client = UnifiedModelClient()
    
    # 测试 deepseek-r1
    print("\n1. Testing deepseek-r1 with poem")
    try:
        response = await client.generate(
            model_id='deepseek-r1',
            prompt='Write a poem about moon',
            task_type='poem',
            max_tokens=100,
            temperature=0.7
        )
        
        if isinstance(response, dict):
            content = response.get('content', '')
        elif hasattr(response, 'choices'):
            content = response.choices[0].message.content if response.choices else ''
        else:
            content = str(response) if response else ''
        
        if content:
            print(f"   SUCCESS: Got {len(content)} chars")
            print(f"   Content: {content[:100]}...")
        else:
            print(f"   FAILED: Empty response")
            
    except Exception as e:
        print(f"   ERROR: {str(e)[:100]}")
    
    # 测试不带 task_type
    print("\n2. Testing deepseek-r1 without task_type")
    try:
        response = await client.generate(
            model_id='deepseek-r1',
            prompt='Write a poem about moon',
            max_tokens=100,
            temperature=0.7
        )
        
        if isinstance(response, dict):
            content = response.get('content', '')
        elif hasattr(response, 'choices'):
            content = response.choices[0].message.content if response.choices else ''
        else:
            content = str(response) if response else ''
        
        if content:
            print(f"   SUCCESS: Got {len(content)} chars")
            print(f"   Content: {content[:100]}...")
        else:
            print(f"   FAILED: Empty response")
            
    except Exception as e:
        print(f"   ERROR: {str(e)[:100]}")
    
    # 直接测试 API
    print("\n3. Testing direct API call")
    from openai import AsyncOpenAI
    
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if api_key:
        client_direct = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1"
        )
        
        try:
            response = await client_direct.chat.completions.create(
                model='deepseek-reasoner',
                messages=[
                    {"role": "user", "content": "Write a poem about moon"}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            content = response.choices[0].message.content
            if content:
                print(f"   SUCCESS: Got {len(content)} chars")
                print(f"   Content: {content[:100]}...")
            else:
                print(f"   FAILED: Empty response")
                
        except Exception as e:
            print(f"   ERROR: {str(e)[:100]}")
    
    # 测试 deepseek-v3 作为对比
    print("\n4. Testing deepseek-v3 (for comparison)")
    try:
        response = await client.generate(
            model_id='deepseek-v3',
            prompt='Write a poem about moon',
            task_type='poem',
            max_tokens=100,
            temperature=0.7
        )
        
        if isinstance(response, dict):
            content = response.get('content', '')
        elif hasattr(response, 'choices'):
            content = response.choices[0].message.content if response.choices else ''
        else:
            content = str(response) if response else ''
        
        if content:
            print(f"   SUCCESS: Got {len(content)} chars")
            print(f"   Content: {content[:100]}...")
        else:
            print(f"   FAILED: Empty response")
            
    except Exception as e:
        print(f"   ERROR: {str(e)[:100]}")
    
    print("\n" + "="*50)
    print("Analysis:")
    print("If deepseek-r1 fails but deepseek-v3 works:")
    print("- The issue is with 'deepseek-reasoner' API endpoint")
    print("- Solution: Use 'deepseek-chat' for R1 models")
    print("\nIf direct API also fails:")
    print("- The model itself doesn't support poetry")
    print("- R1 may be specialized for reasoning only")


if __name__ == "__main__":
    asyncio.run(test_simple())