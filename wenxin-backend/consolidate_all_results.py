"""
整合所有测试结果到统一的目录结构
确保每个厂商的结果都正确保存在对应位置
"""
import json
import shutil
from pathlib import Path
from datetime import datetime


def consolidate_results():
    """整合所有分散的测试结果"""
    
    print("="*60)
    print("Consolidating All Benchmark Results")
    print("="*60)
    
    # 创建统一的目录结构
    base_dir = Path("benchmark_results")
    
    # 1. 整理 OpenAI 结果
    print("\n1. Processing OpenAI results...")
    openai_dir = base_dir / "openai"
    openai_dir.mkdir(exist_ok=True)
    
    # 加载主要的 OpenAI 结果（包含早期测试）
    main_openai = openai_dir / "openai_benchmark_report.json"
    if main_openai.exists():
        with open(main_openai, 'r', encoding='utf-8') as f:
            openai_data = json.load(f)
        print(f"   Loaded main OpenAI report: {len(openai_data.get('all_results', []))} results")
    else:
        openai_data = {
            'provider': 'OpenAI',
            'test_date': datetime.now().isoformat(),
            'all_results': []
        }
    
    # 合并 OpenAI 最终测试结果 (o1-mini, o3-mini)
    final_test = Path("benchmark/results/openai/final/openai_final_20250819_124857.json")
    if final_test.exists():
        with open(final_test, 'r', encoding='utf-8') as f:
            final_data = json.load(f)
        
        # 更新或添加新结果
        for new_result in final_data.get('results', []):
            if not new_result.get('success'):
                continue
            
            # 查找是否已存在
            found = False
            for i, old_result in enumerate(openai_data['all_results']):
                if (old_result.get('model_id') == new_result.get('model_id') and 
                    old_result.get('test_id') == new_result.get('test_id')):
                    # 更新为新结果
                    openai_data['all_results'][i] = new_result
                    found = True
                    print(f"   Updated: {new_result['model_id']}/{new_result['test_id']}")
                    break
            
            if not found:
                openai_data['all_results'].append(new_result)
                print(f"   Added: {new_result['model_id']}/{new_result['test_id']}")
    
    # 重新计算 OpenAI 统计
    openai_data = recalculate_stats(openai_data, 'OpenAI')
    
    # 保存更新后的 OpenAI 结果
    with open(openai_dir / "openai_benchmark_report.json", 'w', encoding='utf-8') as f:
        json.dump(openai_data, f, indent=2, ensure_ascii=False)
    print(f"   Saved consolidated OpenAI results: {len(openai_data['all_results'])} total")
    
    # 2. 整理 DeepSeek 结果
    print("\n2. Processing DeepSeek results...")
    deepseek_dir = base_dir / "deepseek"
    deepseek_dir.mkdir(exist_ok=True)
    
    # 加载 DeepSeek 测试结果
    deepseek_test = Path("benchmark/results/deepseek/deepseek_results_20250819_125442.json")
    if deepseek_test.exists():
        with open(deepseek_test, 'r', encoding='utf-8') as f:
            deepseek_raw = json.load(f)
        
        # 创建 DeepSeek 报告
        deepseek_data = {
            'provider': 'DeepSeek',
            'test_date': deepseek_raw.get('test_date', datetime.now().isoformat()),
            'all_results': [r for r in deepseek_raw.get('results', []) if r.get('success')]
        }
        
        # 计算统计
        deepseek_data = recalculate_stats(deepseek_data, 'DeepSeek')
        
        # 保存 DeepSeek 结果
        with open(deepseek_dir / "deepseek_benchmark_report.json", 'w', encoding='utf-8') as f:
            json.dump(deepseek_data, f, indent=2, ensure_ascii=False)
        print(f"   Saved DeepSeek results: {len(deepseek_data['all_results'])} successful tests")
        
        # 生成 Markdown 报告
        generate_provider_markdown(deepseek_data, deepseek_dir / "deepseek_benchmark_report.md")
    
    # 3. 创建占位符目录给其他厂商
    print("\n3. Creating placeholder directories for other providers...")
    for provider in ['anthropic', 'google', 'xai', 'moonshot']:
        provider_dir = base_dir / provider
        provider_dir.mkdir(exist_ok=True)
        
        # 创建空的报告文件
        placeholder = {
            'provider': provider.title(),
            'test_date': datetime.now().isoformat(),
            'status': 'pending',
            'all_results': [],
            'rankings': [],
            'models_tested': 0,
            'total_tests': 0
        }
        
        report_path = provider_dir / f"{provider}_benchmark_report.json"
        if not report_path.exists():
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(placeholder, f, indent=2, ensure_ascii=False)
            print(f"   Created placeholder for {provider}")
    
    # 4. 生成总体汇总
    print("\n4. Generating complete summary...")
    complete_dir = base_dir / "complete"
    complete_dir.mkdir(exist_ok=True)
    
    all_results = []
    provider_stats = {}
    
    # 收集所有厂商的结果
    for provider_dir in base_dir.iterdir():
        if provider_dir.is_dir() and provider_dir.name not in ['complete', 'final', 'simple_test']:
            report_file = provider_dir / f"{provider_dir.name}_benchmark_report.json"
            if report_file.exists():
                with open(report_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if data.get('all_results'):
                    all_results.extend(data['all_results'])
                    provider_stats[provider_dir.name] = {
                        'models': data.get('models_tested', 0),
                        'tests': len(data.get('all_results', [])),
                        'average_score': data.get('average_score', 0)
                    }
    
    # 创建完整报告
    complete_report = {
        'test_date': datetime.now().isoformat(),
        'providers_tested': len(provider_stats),
        'total_tests': len(all_results),
        'provider_stats': provider_stats,
        'all_results': all_results
    }
    
    # 计算全局排名
    complete_report = calculate_global_rankings(complete_report)
    
    # 保存完整报告
    with open(complete_dir / "complete_benchmark_report.json", 'w', encoding='utf-8') as f:
        json.dump(complete_report, f, indent=2, ensure_ascii=False)
    
    print(f"   Saved complete report: {len(all_results)} total results")
    
    # 5. 显示最终结构
    print("\n" + "="*60)
    print("Final Directory Structure")
    print("="*60)
    print("""
benchmark_results/
├── openai/
│   ├── openai_benchmark_report.json    # 所有 OpenAI 模型结果
│   └── openai_benchmark_report.md      # OpenAI Markdown 报告
├── deepseek/
│   ├── deepseek_benchmark_report.json  # 所有 DeepSeek 模型结果
│   └── deepseek_benchmark_report.md    # DeepSeek Markdown 报告
├── anthropic/
│   └── anthropic_benchmark_report.json # 待测试
├── google/
│   └── google_benchmark_report.json    # 待测试
├── xai/
│   └── xai_benchmark_report.json       # 待测试
├── moonshot/
│   └── moonshot_benchmark_report.json  # 待测试
└── complete/
    ├── complete_benchmark_report.json  # 所有结果汇总
    └── complete_benchmark_report.md    # 总体 Markdown 报告
    """)
    
    # 清理临时文件
    print("\n6. Cleaning up temporary files...")
    temp_dirs = [
        Path("benchmark/results"),
        Path("benchmark_results/final"),
        Path("benchmark_results/simple_test")
    ]
    
    for temp_dir in temp_dirs:
        if temp_dir.exists():
            print(f"   Removing temporary directory: {temp_dir}")
            # 备份重要文件
            for json_file in temp_dir.rglob("*.json"):
                backup_path = Path("benchmark_results/backup") / json_file.name
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(json_file, backup_path)
            # 可选：删除临时目录
            # shutil.rmtree(temp_dir)


def recalculate_stats(data, provider):
    """重新计算统计信息"""
    results = data.get('all_results', [])
    successful = [r for r in results if r.get('success')]
    
    # 按模型汇总
    model_stats = {}
    for r in successful:
        model_id = r['model_id']
        if model_id not in model_stats:
            model_stats[model_id] = {
                'scores': [],
                'dimensions': {d: [] for d in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']}
            }
        
        model_stats[model_id]['scores'].append(r.get('overall_score', 0))
        for dim, score in r.get('dimensions', {}).items():
            if dim in model_stats[model_id]['dimensions']:
                model_stats[model_id]['dimensions'][dim].append(score)
    
    # 计算排名
    rankings = []
    for model_id, stats in model_stats.items():
        if stats['scores']:
            avg_score = sum(stats['scores']) / len(stats['scores'])
            avg_dimensions = {
                dim: sum(scores) / len(scores) if scores else 0
                for dim, scores in stats['dimensions'].items()
            }
            
            rankings.append({
                'model_id': model_id,
                'average_score': avg_score,
                'average_dimensions': avg_dimensions,
                'tests_completed': len(stats['scores'])
            })
    
    rankings.sort(key=lambda x: x['average_score'], reverse=True)
    for i, r in enumerate(rankings, 1):
        r['rank'] = i
    
    # 更新数据
    data['models_tested'] = len(model_stats)
    data['total_tests'] = len(results)
    data['successful_tests'] = len(successful)
    data['rankings'] = rankings
    
    # 计算厂商平均分
    if rankings:
        data['average_score'] = sum(r['average_score'] for r in rankings) / len(rankings)
    else:
        data['average_score'] = 0
    
    return data


def calculate_global_rankings(report):
    """计算全局排名"""
    all_models = {}
    
    for result in report['all_results']:
        if not result.get('success'):
            continue
        
        model_id = result['model_id']
        if model_id not in all_models:
            all_models[model_id] = {
                'scores': [],
                'provider': identify_provider(model_id)
            }
        all_models[model_id]['scores'].append(result.get('overall_score', 0))
    
    # 计算平均分并排名
    rankings = []
    for model_id, data in all_models.items():
        if data['scores']:
            rankings.append({
                'model_id': model_id,
                'provider': data['provider'],
                'average_score': sum(data['scores']) / len(data['scores']),
                'tests_completed': len(data['scores'])
            })
    
    rankings.sort(key=lambda x: x['average_score'], reverse=True)
    for i, r in enumerate(rankings, 1):
        r['rank'] = i
    
    report['global_rankings'] = rankings
    return report


def identify_provider(model_id):
    """识别模型所属厂商"""
    model_lower = model_id.lower()
    if 'gpt' in model_lower or 'o1' in model_lower or 'o3' in model_lower:
        return 'OpenAI'
    elif 'deepseek' in model_lower:
        return 'DeepSeek'
    elif 'claude' in model_lower:
        return 'Anthropic'
    elif 'gemini' in model_lower:
        return 'Google'
    elif 'grok' in model_lower:
        return 'XAI'
    elif 'qwen' in model_lower:
        return 'Alibaba'
    elif 'kimi' in model_lower or 'moonshot' in model_lower:
        return 'Moonshot'
    else:
        return 'Other'


def generate_provider_markdown(data, output_path):
    """生成厂商 Markdown 报告"""
    provider = data.get('provider', 'Unknown')
    
    md = f"# {provider} Models Benchmark Report\n\n"
    md += f"**Test Date**: {data.get('test_date', '')}\n\n"
    md += f"## Summary\n\n"
    md += f"- **Models Tested**: {data.get('models_tested', 0)}\n"
    md += f"- **Total Tests**: {data.get('total_tests', 0)}\n"
    md += f"- **Successful Tests**: {data.get('successful_tests', 0)}\n"
    
    if data.get('average_score'):
        md += f"- **Average Score**: {data['average_score']:.1f}/100\n"
    
    if data.get('rankings'):
        md += f"\n## Rankings\n\n"
        md += f"| Rank | Model | Average Score | Tests |\n"
        md += f"|------|-------|--------------|-------|\n"
        
        for r in data['rankings']:
            md += f"| {r['rank']} | {r['model_id']} | {r['average_score']:.1f} | {r['tests_completed']} |\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md)


if __name__ == "__main__":
    consolidate_results()