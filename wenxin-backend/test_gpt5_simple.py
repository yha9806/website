"""
Simplest possible test of GPT-5 models
"""
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings

async def test_gpt5_simple():
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    # Test with absolute minimum parameters
    models = ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o-mini"]
    
    for model in models:
        print(f"\nTesting {model}:")
        try:
            # Minimal call - only required params
            params = {
                "model": model,
                "messages": [{"role": "user", "content": "Write one word"}]
            }
            
            # GPT-5 models need max_completion_tokens
            if model.startswith("gpt-5"):
                params["max_completion_tokens"] = 500  # Try larger value
            else:
                params["max_tokens"] = 10
                
            response = await client.chat.completions.create(**params)
            
            content = response.choices[0].message.content if response.choices else "No choices"
            print(f"  Content: '{content}'")
            print(f"  Model used: {response.model}")
            
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gpt5_simple())