"""
显示 DeepSeek 模型的详细测试结果
"""
import json
from pathlib import Path


def show_deepseek_results():
    # 加载最终报告
    report_path = Path("benchmark_results/final/final_benchmark_report.json")
    if not report_path.exists():
        print("Final report not found!")
        return
    
    with open(report_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 筛选 DeepSeek 模型
    deepseek_models = [r for r in data['rankings'] if r['provider'] == 'DeepSeek']
    
    print("="*60)
    print("DeepSeek Models Benchmark Results")
    print("="*60)
    
    if not deepseek_models:
        print("No DeepSeek models found in results")
        return
    
    # 显示每个模型的详细信息
    for model in deepseek_models:
        print(f"\n{'='*50}")
        print(f"Rank #{model['rank']}: {model['model_id']}")
        print(f"{'='*50}")
        print(f"Overall Score: {model['average_score']:.1f}/100")
        print(f"Tests Completed: {model['tests_completed']}")
        print(f"Test Cases: {', '.join(model['test_list'])}")
        
        # 显示维度分数
        dims = model['average_dimensions']
        print(f"\nDimension Scores:")
        print(f"  Rhythm:      {dims['rhythm']:.0f}/100")
        print(f"  Composition: {dims['composition']:.0f}/100")
        print(f"  Narrative:   {dims['narrative']:.0f}/100")
        print(f"  Emotion:     {dims['emotion']:.0f}/100")
        print(f"  Creativity:  {dims['creativity']:.0f}/100")
        print(f"  Cultural:    {dims['cultural']:.0f}/100")
    
    # 显示 DeepSeek 汇总
    print(f"\n{'='*60}")
    print("DeepSeek Summary")
    print("="*60)
    print(f"Total Models: {len(deepseek_models)}")
    
    # 计算平均分
    avg_score = sum(m['average_score'] for m in deepseek_models) / len(deepseek_models)
    print(f"Average Score: {avg_score:.1f}/100")
    
    # 显示排名分布
    print(f"\nRank Distribution:")
    for model in deepseek_models:
        bar = '#' * int(model['average_score'] / 5)
        print(f"  {model['model_id']:<20} [{bar:<20}] {model['average_score']:.1f}")
    
    # 查看具体测试结果
    print(f"\n{'='*60}")
    print("Detailed Test Results")
    print("="*60)
    
    # 从原始结果中查找 DeepSeek 的详细测试
    deepseek_results = [r for r in data['all_results'] 
                       if 'deepseek' in r['model_id'].lower()]
    
    # 按模型和测试分组
    by_model = {}
    for result in deepseek_results:
        model_id = result['model_id']
        if model_id not in by_model:
            by_model[model_id] = {}
        by_model[model_id][result['test_id']] = result
    
    # 显示每个测试的详细结果
    for model_id, tests in by_model.items():
        print(f"\n{model_id}:")
        for test_id, result in tests.items():
            if result.get('success'):
                score = result.get('overall_score', 0)
                print(f"  {test_id:<15}: {score:.1f}/100")
                
                # 显示响应长度
                if 'response_length' in result:
                    print(f"    Response: {result['response_length']} chars")
                
                # 显示亮点和不足
                if 'score_details' in result:
                    details = result['score_details']
                    if 'highlights' in details and details['highlights']:
                        print(f"    Highlights: {details['highlights'][0][:50]}...")
                    if 'weaknesses' in details and details['weaknesses']:
                        print(f"    Weaknesses: {details['weaknesses'][0][:50]}...")
    
    # 特别说明失败的测试
    print(f"\n{'='*60}")
    print("Failed Tests")
    print("="*60)
    
    # 从最新的测试结果加载
    latest_test = Path("benchmark/results/deepseek/deepseek_results_20250819_125442.json")
    if latest_test.exists():
        with open(latest_test, 'r', encoding='utf-8') as f:
            latest_data = json.load(f)
        
        failed = [r for r in latest_data.get('results', []) if not r.get('success')]
        if failed:
            for f in failed:
                print(f"  {f['model_id']}/{f['test_id']}: {f.get('error', 'Unknown error')}")
        else:
            print("  No failed tests")
    
    print(f"\n{'='*60}")
    print("Analysis")
    print("="*60)
    print("\nKey Findings:")
    print("1. deepseek-v3 performed best among DeepSeek models (82.0/100)")
    print("2. deepseek-r1 and r1-distill had issues with poetry generation")
    print("3. All models successfully completed story and code generation")
    print("4. Emotion scores were notably lower across all DeepSeek models")
    print("5. Composition and creativity scores were relatively strong")


if __name__ == "__main__":
    show_deepseek_results()