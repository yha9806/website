"""
验证 DeepSeek R1 修复是否生效
"""
import asyncio
from app.services.models import UnifiedModelClient, model_registry
from app.services.models.configs import model_configs


async def verify_fix():
    """验证修复"""
    print("Verifying DeepSeek R1 Fix")
    print("="*50)
    
    # 加载模型
    model_configs.load_all_models()
    
    # 检查配置
    r1 = model_registry.get_model('deepseek-r1')
    r1_distill = model_registry.get_model('deepseek-r1-distill')
    
    print(f"deepseek-r1 API: {r1.api_model_name}")
    print(f"deepseek-r1-distill API: {r1_distill.api_model_name}")
    print()
    
    client = UnifiedModelClient()
    
    # 测试两个 R1 模型
    for model_id in ['deepseek-r1', 'deepseek-r1-distill']:
        print(f"Testing {model_id}...")
        try:
            response = await client.generate(
                model_id=model_id,
                prompt='Write a beautiful poem about the moon and stars',
                task_type='poem',
                max_tokens=150,
                temperature=0.7
            )
            
            if isinstance(response, dict):
                content = response.get('content', '')
            elif hasattr(response, 'choices'):
                content = response.choices[0].message.content if response.choices else ''
            else:
                content = str(response) if response else ''
            
            if content:
                print(f"  SUCCESS! Got {len(content)} chars")
                print(f"  Preview: {content[:150]}...")
            else:
                print(f"  FAILED: Still getting empty response")
                
        except Exception as e:
            print(f"  ERROR: {str(e)[:100]}")
        
        print()
    
    print("="*50)
    print("Fix Status:")
    print("If both models now work: Fix successful!")
    print("If still failing: May need to use different model variants")


if __name__ == "__main__":
    asyncio.run(verify_fix())