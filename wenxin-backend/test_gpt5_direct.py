"""
Test GPT-5 models directly with OpenAI API
"""
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings

async def test_gpt5():
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    # Test GPT-5-mini with different parameters
    tests = [
        {
            "name": "With max_completion_tokens",
            "params": {
                "model": "gpt-5-mini",
                "messages": [{"role": "user", "content": "Say hello"}],
                "max_completion_tokens": 100
            }
        },
        {
            "name": "With max_tokens",
            "params": {
                "model": "gpt-5-mini", 
                "messages": [{"role": "user", "content": "Say hello"}],
                "max_tokens": 100
            }
        },
        {
            "name": "With verbosity",
            "params": {
                "model": "gpt-5-mini",
                "messages": [{"role": "user", "content": "Say hello"}],
                "max_completion_tokens": 100,
                "verbosity": "high"
            }
        },
        {
            "name": "With reasoning_effort",
            "params": {
                "model": "gpt-5-mini",
                "messages": [{"role": "user", "content": "Say hello"}],
                "max_completion_tokens": 100,
                "reasoning_effort": "low"
            }
        }
    ]
    
    for test in tests:
        print(f"\n{test['name']}:")
        print(f"Params: {test['params']}")
        try:
            response = await client.chat.completions.create(**test['params'])
            content = response.choices[0].message.content if response.choices else "No choices"
            print(f"Response content: '{content}'")
            print(f"Response model: {response.model}")
            if hasattr(response, 'usage'):
                print(f"Tokens used: {response.usage.total_tokens}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gpt5())