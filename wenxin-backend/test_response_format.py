"""
Test script to check the actual response format from UnifiedModelClient
"""
import asyncio
from app.services.models import UnifiedModelClient, load_all_models

async def test_response():
    # Load models
    load_all_models()
    
    client = UnifiedModelClient()
    
    # Test with a simple prompt
    response = await client.generate(
        model_id="gpt-5-mini",
        prompt="Say hello in one word",
        max_tokens=10,
        temperature=0.3
    )
    
    print("Response type:", type(response))
    print("Response keys:", response.keys() if isinstance(response, dict) else "Not a dict")
    print("Full response:", response)
    
    # Check content field
    if isinstance(response, dict):
        content = response.get("content", "No content field")
        print(f"Content field: '{content}'")
        print(f"Content type: {type(content)}")
        print(f"Content length: {len(content) if content else 0}")

if __name__ == "__main__":
    asyncio.run(test_response())