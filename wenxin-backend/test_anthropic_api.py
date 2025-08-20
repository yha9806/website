"""
Test which Anthropic models are available with the given API key
"""
import asyncio
import os
from anthropic import AsyncAnthropic

# Set the API key
os.environ['ANTHROPIC_API_KEY'] = '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'

async def test_model(client, model_name):
    """Test if a model is available"""
    print(f"Testing {model_name}...", end=" ")
    try:
        response = await client.messages.create(
            model=model_name,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print(f"SUCCESS - Response: {response.content[0].text[:50]}")
        return True
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg or "not_found" in error_msg:
            print(f"NOT FOUND")
        elif "401" in error_msg or "authentication" in error_msg:
            print(f"AUTH ERROR")
        else:
            print(f"ERROR: {error_msg[:60]}")
        return False

async def main():
    client = AsyncAnthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
    
    # List of models to test
    models_to_test = [
        # Current models (as of 2024-2025)
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022', 
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        
        # Possible newer versions
        'claude-3-5-sonnet-latest',
        'claude-3-5-sonnet',
        'claude-3.5-sonnet',
        
        # Older versions
        'claude-2.1',
        'claude-2',
        'claude-instant-1.2',
        
        # Hypothetical Claude 4 models
        'claude-4',
        'claude-opus-4.1',
        'claude-sonnet-4',
    ]
    
    print("="*60)
    print("TESTING ANTHROPIC MODEL AVAILABILITY")
    print("="*60)
    print()
    
    available_models = []
    for model in models_to_test:
        is_available = await test_model(client, model)
        if is_available:
            available_models.append(model)
        await asyncio.sleep(0.5)  # Rate limiting
    
    print()
    print("="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Tested: {len(models_to_test)} models")
    print(f"Available: {len(available_models)} models")
    
    if available_models:
        print("\nAvailable models:")
        for model in available_models:
            print(f"  - {model}")
    else:
        print("\nNo models were available with this API key.")

if __name__ == "__main__":
    asyncio.run(main())