"""
Quick script to test remaining Qwen models
"""
import asyncio
import sys
import os

# Set API keys
os.environ['QWEN_API_KEY'] = 'sk-906c1e5cd7494bc3b45bc3b738c273ac'
os.environ['OPENAI_API_KEY'] = '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'

# Import the test class
sys.path.insert(0, 'I:\\website\\wenxin-backend')
from test_qwen_complete import QwenCompleteBenchmark

async def main():
    """Test only the remaining untested models"""
    benchmark = QwenCompleteBenchmark()
    
    # Already tested models
    already_tested = [
        'qwen-max-2025-01-25',
        'qwen-plus',
        'qwen-flash',
        'qwen3-32b',
        'qwen3-8b',
        'qwen3-coder-plus'
    ]
    
    # Models to test (remaining from the complete list)
    remaining_models = {
        'qwen-max-latest': 'Qwen-Max (Latest)',
        'qwen-max': 'Qwen-Max (Stable)',
        'qwen-turbo': 'Qwen-Turbo (Legacy)',
        'qwen3-235b-a22b-thinking-2507': 'Qwen3-235B-A22B (Thinking)',
        'qwen3-235b-a22b-instruct-2507': 'Qwen3-235B-A22B (Instruct)',
        'qwen3-30b-a3b-thinking-2507': 'Qwen3-30B-A3B (Thinking)',
        'qwen3-30b-a3b-instruct-2507': 'Qwen3-30B-A3B (Instruct)',
        'qwen3-14b': 'Qwen3-14B',
        'qwen3-4b': 'Qwen3-4B',
        'qwen2.5-72b-instruct': 'Qwen2.5-72B-Instruct',
        'qwen2.5-32b-instruct': 'Qwen2.5-32B-Instruct',
        'qwen2.5-14b-instruct': 'Qwen2.5-14B-Instruct',
        'qwen2.5-7b-instruct': 'Qwen2.5-7B-Instruct',
    }
    
    print(f"Testing {len(remaining_models)} remaining Qwen models...")
    print("Already tested:", ', '.join(already_tested))
    print("\nModels to test:")
    for model_id, name in remaining_models.items():
        print(f"  - {name} ({model_id})")
    print()
    
    # Run tests for remaining models only
    report = await benchmark.run_tests(models_to_test=remaining_models)
    
    if report:
        print(f"\nCompleted testing {len(remaining_models)} additional models")
        print(f"Results saved to benchmark_results/qwen/qwen_complete.json")
    else:
        print("\nNo new models to test or test failed")

if __name__ == "__main__":
    asyncio.run(main())