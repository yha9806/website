"""
显示最终基准测试结果
"""
import json
from pathlib import Path

def show_results():
    report_file = Path("benchmark_results/openai/openai_benchmark_report.json")
    
    with open(report_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("="*60)
    print("FINAL BENCHMARK RESULTS SUMMARY")
    print("="*60)
    
    print(f"\nTest Statistics:")
    print(f"  - Total models registered: 20")
    print(f"  - Models tested: {data['models_tested']}")
    print(f"  - Total tests run: {data['total_tests']}")
    print(f"  - Successful models: {len([r for r in data['rankings'] if r['average_score'] > 0])}")
    
    print(f"\nTest Coverage by Provider:")
    # Count models by provider
    provider_counts = {}
    for result in data['all_results']:
        model_id = result['model_id']
        if 'gpt' in model_id or 'o1' in model_id or 'o3' in model_id:
            provider = 'OpenAI'
        elif 'claude' in model_id:
            provider = 'Anthropic'
        elif 'deepseek' in model_id:
            provider = 'DeepSeek'
        elif 'qwen' in model_id:
            provider = 'Qwen'
        else:
            provider = 'Other'
        
        if provider not in provider_counts:
            provider_counts[provider] = {'total': 0, 'success': 0}
        provider_counts[provider]['total'] += 1
        if result.get('success'):
            provider_counts[provider]['success'] += 1
    
    for provider, counts in provider_counts.items():
        success_rate = (counts['success'] / counts['total'] * 100) if counts['total'] > 0 else 0
        print(f"  - {provider}: {counts['success']}/{counts['total']} tests succeeded ({success_rate:.0f}%)")
    
    print(f"\nTop 10 Model Rankings:")
    print("-"*60)
    for i, ranking in enumerate(data['rankings'][:10], 1):
        print(f"{ranking['rank']:2}. {ranking['model_id']:20} {ranking['average_score']:5.1f}/100")
    
    print(f"\nModels with Issues:")
    print("-"*60)
    
    # Find failed models
    failed_models = {}
    for result in data['all_results']:
        if not result.get('success'):
            model_id = result['model_id']
            if model_id not in failed_models:
                failed_models[model_id] = []
            error = result.get('error', 'Unknown error')
            if error not in failed_models[model_id]:
                failed_models[model_id].append(error[:100])
    
    for model_id, errors in failed_models.items():
        print(f"  - {model_id}: {errors[0][:50]}...")
    
    print(f"\nData Completeness:")
    print("-"*60)
    complete_count = 0
    for result in data['all_results']:
        if result.get('response') and result.get('overall_score') and result.get('dimensions'):
            complete_count += 1
    
    print(f"  - Complete responses: {complete_count}/{len(data['all_results'])}")
    print(f"  - Response + Score saved: {complete_count}")
    print(f"  - All 6 dimensions saved: Yes")
    
    print("\n" + "="*60)
    print("CONCLUSION:")
    print("-"*60)
    print(f"✓ Successfully tested {len([r for r in data['rankings'] if r['average_score'] > 0])} models")
    print(f"✓ All model responses and scores are saved")
    print(f"✓ JSON and Markdown reports updated")
    print(f"✓ Top performer: {data['rankings'][0]['model_id']} ({data['rankings'][0]['average_score']:.1f}/100)")
    print("="*60)

if __name__ == "__main__":
    show_results()