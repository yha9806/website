"""
Test GPT-5 models with UnifiedModelClient after fix
"""
import asyncio
from app.services.models import UnifiedModelClient, load_all_models

async def test_gpt5_unified():
    # Load models
    load_all_models()
    
    client = UnifiedModelClient()
    
    models = ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o-mini"]
    
    for model_id in models:
        print(f"\nTesting {model_id}:")
        try:
            response = await client.generate(
                model_id=model_id,
                prompt="Write a haiku about spring",
                max_tokens=100,
                temperature=0.7
            )
            
            print(f"  Content: '{response['content'][:100]}...'")
            print(f"  Tokens used: {response['tokens_used']}")
            
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gpt5_unified())