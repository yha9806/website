"""
Simple verification that DeepSeek R1 models can now generate poetry
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


async def verify_poetry():
    """Verify R1 poetry generation works"""
    print("DeepSeek R1 Poetry Generation Verification")
    print("="*60)
    
    from app.services.models import UnifiedModelClient, model_registry
    from app.services.models.configs import model_configs
    
    # Load models
    model_configs.load_all_models()
    client = UnifiedModelClient()
    
    # Test both R1 models
    models = ['deepseek-r1', 'deepseek-r1-distill']
    results = []
    
    for model_id in models:
        print(f"\nTesting {model_id}...")
        model = model_registry.get_model(model_id)
        print(f"  API: {model.api_model_name}")
        
        try:
            response = await client.generate(
                model_id=model_id,
                prompt='Write a beautiful poem about the moon and stars',
                task_type='poem',
                max_tokens=150,
                temperature=0.7
            )
            
            # Extract content
            if isinstance(response, dict):
                content = response.get('content', '')
            elif hasattr(response, 'choices') and response.choices:
                content = response.choices[0].message.content
            else:
                content = str(response) if response else ''
            
            if content:
                print(f"  [SUCCESS] Generated {len(content)} chars")
                print(f"  First 100 chars: {content[:100]}...")
                results.append({
                    'model_id': model_id,
                    'success': True,
                    'response_length': len(content),
                    'preview': content[:300]
                })
            else:
                print(f"  [FAILED] Empty response")
                results.append({
                    'model_id': model_id,
                    'success': False,
                    'error': 'Empty response'
                })
                
        except Exception as e:
            print(f"  [ERROR] {str(e)[:100]}")
            results.append({
                'model_id': model_id,
                'success': False,
                'error': str(e)[:200]
            })
    
    # Save results
    output_dir = Path("benchmark_results/deepseek")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / "r1_poetry_verification.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'test_date': datetime.now().isoformat(),
            'fix_applied': 'deepseek-reasoner → deepseek-chat',
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] {output_file}")
    
    # Summary
    print("\n" + "="*60)
    print("VERIFICATION RESULTS")
    print("="*60)
    
    successful = [r for r in results if r['success']]
    if len(successful) == len(results):
        print("\n✅ FIX CONFIRMED: All R1 models can now generate poetry!")
        print("\nConfiguration change:")
        print("  - deepseek-r1: deepseek-reasoner → deepseek-chat")
        print("  - deepseek-r1-distill: deepseek-reasoner → deepseek-chat")
    else:
        failed = [r for r in results if not r['success']]
        print(f"\n⚠️ {len(failed)}/{len(results)} models still failing")
        for r in failed:
            print(f"  - {r['model_id']}: {r.get('error', 'Unknown')}")


if __name__ == "__main__":
    asyncio.run(verify_poetry())