"""
Check for the latest Claude models including Opus 4.1 and Sonnet 4
"""
import asyncio
import os
from anthropic import AsyncAnthropic

# Set the API key
os.environ['ANTHROPIC_API_KEY'] = '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'

async def test_model(client, model_name):
    """Test if a model is available"""
    try:
        response = await client.messages.create(
            model=model_name,
            messages=[{"role": "user", "content": "What model are you?"}],
            max_tokens=50
        )
        response_text = response.content[0].text if response.content else ""
        return True, response_text[:100]
    except Exception as e:
        return False, str(e)[:100]

async def main():
    client = AsyncAnthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
    
    # Extended list of potential model names
    models_to_test = [
        # Try with 'latest' suffix
        'claude-3-5-sonnet-latest',
        'claude-3-5-haiku-latest',
        'claude-3-opus-latest',
        
        # Try newer date formats
        'claude-3-5-sonnet-20250101',
        'claude-3-5-sonnet-20250201',
        'claude-3-5-sonnet-20250301',
        'claude-3-5-sonnet-20250401',
        'claude-3-5-sonnet-20250501',
        'claude-3-5-sonnet-20250601',
        'claude-3-5-sonnet-20250701',
        'claude-3-5-sonnet-20250801',
        
        # Try Opus with different dates
        'claude-3-opus-20250101',
        'claude-3-opus-20250201',
        'claude-3-opus-20250301',
        'claude-3-opus-20250401',
        'claude-3-opus-20250501',
        'claude-3-opus-20250601',
        'claude-3-opus-20250701',
        'claude-3-opus-20250801',
        
        # Try potential Claude 4 formats
        'claude-4-opus',
        'claude-4-sonnet',
        'claude-4-haiku',
        'claude-opus-4',
        'claude-sonnet-4',
        'claude-haiku-4',
        
        # Try version numbers
        'claude-3.6-sonnet',
        'claude-3.7-sonnet',
        'claude-3.8-sonnet',
        'claude-3.9-sonnet',
        'claude-4.0-sonnet',
        
        # Try without version numbers
        'claude-opus',
        'claude-sonnet',
        'claude-haiku',
        
        # Known working models for reference
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229'
    ]
    
    print("="*70)
    print("CHECKING FOR LATEST CLAUDE MODELS")
    print("="*70)
    print(f"Testing {len(models_to_test)} potential model names...")
    print()
    
    available_models = []
    model_responses = {}
    
    for model_id in models_to_test:
        print(f"Testing {model_id:40s} ... ", end="")
        is_available, response = await test_model(client, model_id)
        if is_available:
            print("AVAILABLE!")
            available_models.append(model_id)
            model_responses[model_id] = response
        else:
            if "404" in response or "not_found" in response:
                print("not found")
            elif "deprecated" in response:
                print("deprecated")
            else:
                print(f"error: {response[:30]}")
        await asyncio.sleep(0.3)  # Rate limiting
    
    print()
    print("="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Tested: {len(models_to_test)} models")
    print(f"Available: {len(available_models)} models")
    
    if available_models:
        print("\nAvailable models:")
        for model in available_models:
            print(f"  - {model}")
            if model in model_responses:
                print(f"    Response: {model_responses[model][:50]}...")
    
    # Check if any of these are Claude 4 models
    claude_4_models = [m for m in available_models if '4' in m or 'opus-4' in m or 'sonnet-4' in m]
    if claude_4_models:
        print("\nPOTENTIAL CLAUDE 4 MODELS FOUND:")
        for model in claude_4_models:
            print(f"  - {model}")
    else:
        print("\nNo Claude 4.0/4.1 models found in the current API.")
        print("The models 'claude-opus-4.1' and 'claude-sonnet-4' mentioned in the configuration")
        print("appear to be placeholders or future models that are not yet available.")

if __name__ == "__main__":
    asyncio.run(main())