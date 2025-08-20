"""
检查基准测试结果的完整性
"""
import json
from pathlib import Path

def check_openai_results():
    """检查OpenAI测试结果"""
    report_file = Path("benchmark_results/openai/openai_benchmark_report.json")
    
    if not report_file.exists():
        print("[ERROR] Report file not found")
        return
    
    with open(report_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("="*60)
    print("OpenAI基准测试结果审核")
    print("="*60)
    
    # 1. 基本信息
    print(f"\n1. 测试概况:")
    print(f"   - 测试日期: {data['test_date']}")
    print(f"   - 测试模型数: {data['models_tested']}")
    print(f"   - 测试用例数: {data['test_cases']}")
    print(f"   - 总测试数: {len(data['all_results'])}")
    
    # 2. 检查每个模型的测试完整性
    print(f"\n2. 模型测试完整性:")
    model_test_count = {}
    for result in data['all_results']:
        model_id = result['model_id']
        if model_id not in model_test_count:
            model_test_count[model_id] = []
        model_test_count[model_id].append(result['test_id'])
    
    for model_id, tests in model_test_count.items():
        print(f"   - {model_id}: {len(tests)} tests completed")
        print(f"     Tests: {', '.join(tests)}")
    
    # 3. 检查数据保存完整性
    print(f"\n3. 数据保存完整性检查:")
    
    missing_data = []
    for i, result in enumerate(data['all_results']):
        issues = []
        
        # 检查响应内容
        if 'response' not in result:
            issues.append("missing response")
        elif len(result['response']) == 0:
            issues.append("empty response")
        
        # 检查评分
        if 'overall_score' not in result:
            issues.append("missing overall_score")
        
        # 检查维度评分
        if 'dimensions' not in result:
            issues.append("missing dimensions")
        else:
            dims = result['dimensions']
            expected_dims = ["rhythm", "composition", "narrative", "emotion", "creativity", "cultural"]
            for dim in expected_dims:
                if dim not in dims:
                    issues.append(f"missing dimension: {dim}")
        
        # 检查评分详情
        if 'score_details' not in result:
            issues.append("missing score_details")
        
        if issues:
            missing_data.append(f"   Test {i+1} ({result['model_id']} - {result['test_id']}): {', '.join(issues)}")
    
    if missing_data:
        print("   [WARNING] Found incomplete data:")
        for issue in missing_data:
            print(issue)
    else:
        print("   [OK] All data fields are complete")
    
    # 4. 显示每个测试的详细信息
    print(f"\n4. 详细测试结果:")
    for result in data['all_results']:
        print(f"\n   {result['model_id']} - {result['test_id']}:")
        print(f"     - Success: {result.get('success', False)}")
        print(f"     - Response length: {len(result.get('response', ''))} chars")
        print(f"     - Overall score: {result.get('overall_score', 0)}/100")
        
        dims = result.get('dimensions', {})
        if dims:
            dim_str = ", ".join([f"{k}:{v}" for k, v in dims.items()])
            print(f"     - Dimensions: {dim_str}")
        
        # 显示部分响应内容
        response = result.get('response', '')
        if response:
            preview = response[:100].replace('\n', ' ')
            print(f"     - Response preview: {preview}...")
        
        # 显示评分亮点
        if 'score_details' in result:
            highlights = result['score_details'].get('highlights', [])
            if highlights:
                print(f"     - Highlights: {highlights[0] if highlights else 'None'}")
    
    # 5. 模型排名汇总
    print(f"\n5. 最终排名:")
    for rank in data['rankings']:
        print(f"   {rank['rank']}. {rank['model_id']}: {rank['average_score']:.1f}/100")
    
    # 6. 检查需要测试但未测试的模型
    print(f"\n6. OpenAI模型覆盖情况:")
    all_openai_models = [
        'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-4.5',
        'gpt-5', 'gpt-5-mini', 'gpt-5-nano',
        'o1', 'o1-mini', 'o3-mini'
    ]
    tested_models = list(model_test_count.keys())
    
    print(f"   Tested: {', '.join(tested_models)}")
    not_tested = [m for m in all_openai_models if m not in tested_models]
    if not_tested:
        print(f"   Not tested: {', '.join(not_tested)}")
        print(f"   Note: Some models may not have valid API access")
    
    print("\n" + "="*60)
    print("审核完成")
    print("="*60)

if __name__ == "__main__":
    check_openai_results()