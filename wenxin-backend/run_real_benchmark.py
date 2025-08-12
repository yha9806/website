"""
运行真实的基准测试
"""
import asyncio
import json
from datetime import datetime
from app.services.models import UnifiedModelClient, model_registry, load_all_models

# 测试用例
TEST_CASES = [
    {
        "id": "poem_spring",
        "type": "poem",
        "prompt": "Write a poem about spring flowers",
        "max_tokens": 200
    },
    {
        "id": "story_ai",
        "type": "story", 
        "prompt": "Write a short story about an AI discovering emotions",
        "max_tokens": 300
    }
]

async def test_single_model(client: UnifiedModelClient, model_id: str, test_case: dict):
    """测试单个模型"""
    try:
        print(f"  Testing {model_id}...", end=" ")
        start = datetime.now()
        
        response = await client.generate(
            model_id=model_id,
            prompt=test_case['prompt'],
            task_type=test_case['type'],
            max_tokens=test_case['max_tokens']
        )
        
        duration = (datetime.now() - start).total_seconds()
        
        result = {
            'model_id': model_id,
            'test_id': test_case['id'],
            'success': True,
            'duration': duration,
            'model_used': response.get('model_used', 'unknown'),
            'tokens_used': response.get('tokens_used', 0),
            'content_length': len(response.get('content', '')),
            'content_preview': response.get('content', '')[:100]
        }
        
        print(f"[OK] {duration:.2f}s, {result['tokens_used']} tokens")
        return result
        
    except Exception as e:
        print(f"[FAILED] {str(e)[:50]}")
        return {
            'model_id': model_id,
            'test_id': test_case['id'],
            'success': False,
            'error': str(e)
        }

async def run_benchmark_suite():
    """运行完整的基准测试套件"""
    # 加载模型
    stats = load_all_models()
    print(f"\nLoaded {stats['total_models']} models")
    
    # 初始化客户端
    client = UnifiedModelClient()
    
    # 选择要测试的模型
    test_models = []
    for model_id, config in model_registry._models.items():
        if config.model_type != 'image':  # 跳过图像模型
            # 只测试OpenAI模型作为示例（因为我们知道API可用）
            if config.provider == 'openai':
                test_models.append(model_id)
    
    print(f"Will test {len(test_models)} OpenAI models")
    print("="*60)
    
    all_results = []
    
    for test_case in TEST_CASES:
        print(f"\nTest Case: {test_case['id']}")
        print("-"*40)
        
        for model_id in sorted(test_models):
            result = await test_single_model(client, model_id, test_case)
            all_results.append(result)
            await asyncio.sleep(0.5)  # 避免API限制
    
    # 统计结果
    print("\n" + "="*60)
    print("BENCHMARK RESULTS SUMMARY")
    print("="*60)
    
    success_count = sum(1 for r in all_results if r['success'])
    total_count = len(all_results)
    
    print(f"Total Tests: {total_count}")
    print(f"Successful: {success_count}")
    print(f"Failed: {total_count - success_count}")
    print(f"Success Rate: {success_count/total_count*100:.1f}%")
    
    # 显示成功的模型
    print("\nSuccessful Models:")
    successful_models = set(r['model_id'] for r in all_results if r['success'])
    for model in sorted(successful_models):
        config = model_registry.get_model(model)
        print(f"  - {model:<20} (API: {config.api_model_name})")
    
    # 显示失败的模型
    failed_results = [r for r in all_results if not r['success']]
    if failed_results:
        print("\nFailed Models:")
        failed_models = set(r['model_id'] for r in failed_results)
        for model in sorted(failed_models):
            errors = [r['error'] for r in failed_results if r['model_id'] == model]
            print(f"  - {model:<20} Error: {errors[0][:50]}")
    
    # 保存结果
    with open('benchmark_results.json', 'w') as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\nResults saved to benchmark_results.json")
    
    return all_results

async def quick_test():
    """快速测试几个关键模型"""
    print("\n" + "="*60)
    print("QUICK TEST - Testing Key Models")
    print("="*60)
    
    # 加载模型
    load_all_models()
    client = UnifiedModelClient()
    
    # 测试关键模型
    test_models = ['gpt-4o-mini', 'gpt-5', 'o1-mini']
    
    for model_id in test_models:
        print(f"\nTesting {model_id}:")
        try:
            response = await client.generate(
                model_id=model_id,
                prompt="Say hello in one sentence",
                max_tokens=50
            )
            print(f"  [SUCCESS] Model used: {response.get('model_used')}")
            print(f"  Response: {response.get('content', '')[:100]}")
        except Exception as e:
            print(f"  [FAILED] {str(e)[:100]}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        asyncio.run(quick_test())
    else:
        print("Starting full benchmark suite...")
        print("(Use --quick for a quick test of key models)")
        asyncio.run(run_benchmark_suite())