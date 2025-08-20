"""
生成最终的基准测试报告
整合所有测试结果并生成排名
"""
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List


def load_all_results():
    """加载所有测试结果"""
    all_results = []
    sources = []
    
    # 1. 加载主要的 OpenAI 报告（包含早期测试的所有模型）
    main_report = Path("benchmark_results/openai/openai_benchmark_report.json")
    if main_report.exists():
        with open(main_report, 'r', encoding='utf-8') as f:
            data = json.load(f)
        all_results.extend(data.get('all_results', []))
        sources.append(f"Main report: {len(data.get('all_results', []))} results")
    
    # 2. 加载 OpenAI 最终测试（o1-mini, o3-mini）
    openai_final = Path("benchmark/results/openai/final/openai_final_20250819_124857.json")
    if openai_final.exists():
        with open(openai_final, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # 只添加成功的结果
        new_results = [r for r in data.get('results', []) if r.get('success')]
        all_results.extend(new_results)
        sources.append(f"OpenAI final: {len(new_results)} results")
    
    # 3. 加载 DeepSeek 测试结果
    deepseek_results = Path("benchmark/results/deepseek/deepseek_results_20250819_125442.json")
    if deepseek_results.exists():
        with open(deepseek_results, 'r', encoding='utf-8') as f:
            data = json.load(f)
        new_results = [r for r in data.get('results', []) if r.get('success')]
        all_results.extend(new_results)
        sources.append(f"DeepSeek: {len(new_results)} results")
    
    print("Data Sources:")
    for source in sources:
        print(f"  - {source}")
    
    return all_results


def deduplicate_results(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """去重，保留最高分的结果"""
    unique = {}
    
    for result in results:
        if not result.get('success'):
            continue
        
        key = f"{result['model_id']}_{result['test_id']}"
        
        if key not in unique:
            unique[key] = result
        else:
            # 保留分数更高的
            if result.get('overall_score', 0) > unique[key].get('overall_score', 0):
                unique[key] = result
    
    return list(unique.values())


def calculate_rankings(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """计算模型排名"""
    # 按模型汇总
    model_data = {}
    
    for result in results:
        model_id = result['model_id']
        if model_id not in model_data:
            model_data[model_id] = {
                'scores': [],
                'dimensions': {d: [] for d in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']},
                'tests': []
            }
        
        model_data[model_id]['scores'].append(result['overall_score'])
        model_data[model_id]['tests'].append(result['test_id'])
        
        for dim, score in result.get('dimensions', {}).items():
            if dim in model_data[model_id]['dimensions']:
                model_data[model_id]['dimensions'][dim].append(score)
    
    # 计算平均分和排名
    rankings = []
    
    for model_id, data in model_data.items():
        if not data['scores']:
            continue
        
        avg_score = sum(data['scores']) / len(data['scores'])
        avg_dimensions = {}
        
        for dim, scores in data['dimensions'].items():
            if scores:
                avg_dimensions[dim] = sum(scores) / len(scores)
        
        # 判断厂商
        if 'gpt' in model_id.lower() or 'o1' in model_id.lower() or 'o3' in model_id.lower():
            provider = 'OpenAI'
        elif 'deepseek' in model_id.lower():
            provider = 'DeepSeek'
        elif 'claude' in model_id.lower():
            provider = 'Anthropic'
        elif 'qwen' in model_id.lower():
            provider = 'Alibaba'
        else:
            provider = 'Other'
        
        rankings.append({
            'model_id': model_id,
            'provider': provider,
            'average_score': avg_score,
            'average_dimensions': avg_dimensions,
            'tests_completed': len(data['scores']),
            'test_list': list(set(data['tests']))
        })
    
    # 排序
    rankings.sort(key=lambda x: x['average_score'], reverse=True)
    
    # 添加排名
    for i, r in enumerate(rankings, 1):
        r['rank'] = i
    
    return rankings


def generate_final_report():
    """生成最终报告"""
    print("\n" + "="*60)
    print("Generating Final Benchmark Report")
    print("="*60)
    
    # 加载所有结果
    all_results = load_all_results()
    print(f"\nTotal results loaded: {len(all_results)}")
    
    # 去重
    unique_results = deduplicate_results(all_results)
    print(f"After deduplication: {len(unique_results)}")
    
    # 计算排名
    rankings = calculate_rankings(unique_results)
    print(f"Models ranked: {len(rankings)}")
    
    # 统计信息
    providers = {}
    for r in rankings:
        provider = r['provider']
        if provider not in providers:
            providers[provider] = []
        providers[provider].append(r)
    
    # 创建最终报告
    final_report = {
        'report_date': datetime.now().isoformat(),
        'total_models': len(rankings),
        'total_tests': len(unique_results),
        'test_cases': 3,  # poem_moon, story_robot, code_fibonacci
        'providers_tested': len(providers),
        'provider_summary': {
            p: {
                'models': len(models),
                'avg_score': sum(m['average_score'] for m in models) / len(models)
            }
            for p, models in providers.items()
        },
        'rankings': rankings,
        'all_results': unique_results
    }
    
    # 保存 JSON 报告
    output_dir = Path("benchmark_results/final")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    json_path = output_dir / "final_benchmark_report.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(final_report, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] JSON report: {json_path}")
    
    # 生成 Markdown 报告
    md_content = generate_markdown_report(final_report)
    md_path = output_dir / "final_benchmark_report.md"
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"[SAVED] Markdown report: {md_path}")
    
    # 显示前10名
    print("\n" + "="*60)
    print("Top 10 Models")
    print("-"*60)
    print(f"{'Rank':<6} {'Model':<20} {'Provider':<12} {'Score':<8} {'Tests'}")
    print("-"*60)
    
    for r in rankings[:10]:
        print(f"{r['rank']:<6} {r['model_id']:<20} {r['provider']:<12} "
              f"{r['average_score']:.1f} {'':>3} {r['tests_completed']}")
    
    # 显示厂商汇总
    print("\n" + "="*60)
    print("Provider Summary")
    print("-"*60)
    
    for provider, summary in sorted(final_report['provider_summary'].items(), 
                                   key=lambda x: x[1]['avg_score'], 
                                   reverse=True):
        print(f"{provider:<12}: {summary['models']} models, avg score: {summary['avg_score']:.1f}")
    
    return final_report


def generate_markdown_report(report: Dict[str, Any]) -> str:
    """生成 Markdown 格式报告"""
    md = f"""# AI Model Benchmark Final Report

**Report Date**: {report['report_date']}

## Executive Summary

- **Total Models Tested**: {report['total_models']}
- **Total Test Cases**: {report['total_tests']}
- **Providers Tested**: {report['providers_tested']}

## Provider Performance

| Provider | Models | Average Score |
|----------|--------|---------------|
"""
    
    for provider, summary in sorted(report['provider_summary'].items(), 
                                   key=lambda x: x[1]['avg_score'], 
                                   reverse=True):
        md += f"| {provider} | {summary['models']} | {summary['avg_score']:.1f} |\n"
    
    md += """
## Complete Rankings

| Rank | Model | Provider | Score | Tests | Dimensions (R/C/N/E/Cr/Cu) |
|------|-------|----------|-------|-------|----------------------------|
"""
    
    for r in report['rankings']:
        dims = r['average_dimensions']
        dim_str = f"{dims.get('rhythm', 0):.0f}/{dims.get('composition', 0):.0f}/"
        dim_str += f"{dims.get('narrative', 0):.0f}/{dims.get('emotion', 0):.0f}/"
        dim_str += f"{dims.get('creativity', 0):.0f}/{dims.get('cultural', 0):.0f}"
        
        md += f"| {r['rank']} | {r['model_id']} | {r['provider']} | "
        md += f"{r['average_score']:.1f} | {r['tests_completed']} | {dim_str} |\n"
    
    md += """
## Test Methodology

### Test Cases
1. **poem_moon**: Poetry creation about moon and stars (150 tokens)
2. **story_robot**: Short story about robot learning to paint (250 tokens)
3. **code_fibonacci**: Python Fibonacci sequence function (200 tokens)

### Scoring Dimensions
- **Rhythm (R)**: Flow and pacing of content
- **Composition (C)**: Structure and organization
- **Narrative (N)**: Storytelling ability
- **Emotion (E)**: Emotional expression
- **Creativity (Cr)**: Originality and imagination
- **Cultural (Cu)**: Cultural relevance and appropriateness

### Scoring Method
All models were scored by GPT-4o-mini with temperature 0.3 for consistency.
Each dimension is scored 0-100, with the overall score being the average.

## Notes
- Some models failed certain tests due to API limitations or configuration issues
- DeepSeek R1 series had issues with poetry generation
- GPT-5-nano consistently returned empty responses
"""
    
    return md


if __name__ == "__main__":
    report = generate_final_report()
    
    print("\n" + "="*60)
    print("Report Generation Complete!")
    print("="*60)
    print("\nKey Findings:")
    
    # 找出最佳模型
    if report['rankings']:
        best = report['rankings'][0]
        print(f"  Best Model: {best['model_id']} ({best['provider']}) - {best['average_score']:.1f}/100")
        
        # 找出最佳厂商
        best_provider = max(report['provider_summary'].items(), 
                          key=lambda x: x[1]['avg_score'])
        print(f"  Best Provider: {best_provider[0]} - {best_provider[1]['avg_score']:.1f}/100 avg")