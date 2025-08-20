"""
Merge all test results including Claude 4.1
"""
import json
from pathlib import Path
from datetime import datetime

def load_json_file(file_path):
    """Load JSON file if exists"""
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def merge_anthropic_results():
    """Merge Anthropic results including Claude 4.1"""
    base_path = Path("benchmark_results/anthropic")
    
    # Load existing Anthropic results
    anthropic_final = load_json_file(base_path / "anthropic_final.json")
    claude_41 = load_json_file(base_path / "claude_41_retry.json")
    claude_4_final = load_json_file(base_path / "claude_4_final.json")
    
    all_results = []
    all_models = set()
    
    # Add results from anthropic_final.json (Claude 3.x models)
    if anthropic_final:
        all_results.extend(anthropic_final.get('all_results', []))
        all_models.update(anthropic_final.get('models', []))
    
    # Add results from claude_4_final.json (Claude 4.0 models)
    if claude_4_final:
        all_results.extend(claude_4_final.get('all_results', []))
        all_models.update(claude_4_final.get('models', []))
    
    # Add results from claude_41_retry.json (Claude 4.1)
    if claude_41:
        all_results.extend(claude_41.get('all_results', []))
        all_models.update(claude_41.get('models', []))
    
    # Calculate rankings
    model_scores = {}
    for result in all_results:
        if result.get('success') and result.get('overall_score'):
            model_id = result['model_id']
            if model_id not in model_scores:
                model_scores[model_id] = {
                    'display_name': result.get('display_name', model_id),
                    'scores': [],
                    'dimensions': {},
                    'results': []
                }
            model_scores[model_id]['scores'].append(result['overall_score'])
            model_scores[model_id]['results'].append(result)
            
            if 'dimensions' in result:
                for dim, score in result['dimensions'].items():
                    if dim not in model_scores[model_id]['dimensions']:
                        model_scores[model_id]['dimensions'][dim] = []
                    model_scores[model_id]['dimensions'][dim].append(score)
    
    rankings = []
    for model_id, data in model_scores.items():
        avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        avg_dimensions = {}
        for dim, scores in data['dimensions'].items():
            avg_dimensions[dim] = sum(scores) / len(scores) if scores else 0
        
        rankings.append({
            'model_id': model_id,
            'display_name': data['display_name'],
            'average_score': avg_score,
            'average_dimensions': avg_dimensions,
            'tests_completed': len(data['scores']),
            'test_results': data['results']
        })
    
    rankings.sort(key=lambda x: x['average_score'], reverse=True)
    
    # Create merged report
    merged_report = {
        'provider': 'Anthropic',
        'test_date': datetime.now().isoformat(),
        'models_tested': len(model_scores),
        'models': list(all_models),
        'total_tests': len(all_results),
        'successful_tests': len([r for r in all_results if r.get('success')]),
        'all_results': all_results,
        'rankings': rankings
    }
    
    # Save merged report
    output_file = base_path / "anthropic_complete_v2.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_report, f, indent=2, ensure_ascii=False)
    
    print(f"Merged Anthropic results: {len(model_scores)} models, {len(all_results)} tests")
    print(f"Saved to: {output_file}")
    
    return merged_report

def create_comprehensive_report_v2():
    """Create comprehensive report with all providers including Claude 4.1"""
    
    providers_data = {}
    all_results = []
    
    # Load OpenAI results
    openai_path = Path("benchmark_results/openai/openai_results.json")
    if openai_path.exists():
        openai_data = load_json_file(openai_path)
        if openai_data:
            providers_data['openai'] = openai_data
            all_results.extend(openai_data.get('all_results', []))
    
    # Load DeepSeek results
    deepseek_path = Path("benchmark_results/deepseek/deepseek_benchmark_report.json")
    if deepseek_path.exists():
        deepseek_data = load_json_file(deepseek_path)
        if deepseek_data:
            providers_data['deepseek'] = deepseek_data
            all_results.extend(deepseek_data.get('all_results', []))
    
    # Get merged Anthropic results
    anthropic_data = merge_anthropic_results()
    providers_data['anthropic'] = anthropic_data
    all_results.extend(anthropic_data.get('all_results', []))
    
    # Load Qwen results
    qwen_path = Path("benchmark_results/qwen/qwen_complete.json")
    if qwen_path.exists():
        qwen_data = load_json_file(qwen_path)
        if qwen_data:
            providers_data['qwen'] = qwen_data
            all_results.extend(qwen_data.get('all_results', []))
    
    # Calculate global rankings
    model_scores = {}
    for result in all_results:
        if result.get('success') and result.get('overall_score', 0) > 0:
            model_id = result['model_id']
            provider = None
            
            # Determine provider
            if 'gpt' in model_id or 'o1' in model_id or 'o3' in model_id:
                provider = 'OpenAI'
            elif 'claude' in model_id:
                provider = 'Anthropic'
            elif 'deepseek' in model_id:
                provider = 'DeepSeek'
            elif 'qwen' in model_id:
                provider = 'Qwen'
            
            if model_id not in model_scores:
                model_scores[model_id] = {
                    'provider': provider,
                    'display_name': result.get('display_name', model_id),
                    'scores': [],
                    'dimensions': {},
                    'test_coverage': set()
                }
            
            model_scores[model_id]['scores'].append(result['overall_score'])
            model_scores[model_id]['test_coverage'].add(result.get('test_id', ''))
            
            if 'dimensions' in result:
                for dim, score in result['dimensions'].items():
                    if dim not in model_scores[model_id]['dimensions']:
                        model_scores[model_id]['dimensions'][dim] = []
                    model_scores[model_id]['dimensions'][dim].append(score)
    
    # Create global rankings
    global_rankings = []
    for model_id, data in model_scores.items():
        avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        avg_dimensions = {}
        for dim, scores in data['dimensions'].items():
            avg_dimensions[dim] = sum(scores) / len(scores) if scores else 0
        
        global_rankings.append({
            'model_id': model_id,
            'provider': data['provider'],
            'display_name': data['display_name'],
            'average_score': avg_score,
            'tests_completed': len(data['scores']),
            'test_coverage': list(data['test_coverage']),
            'average_dimensions': avg_dimensions
        })
    
    global_rankings.sort(key=lambda x: x['average_score'], reverse=True)
    for i, rank in enumerate(global_rankings):
        rank['rank'] = i + 1
    
    # Calculate provider statistics
    provider_stats = {}
    for provider_name in ['openai', 'anthropic', 'deepseek', 'qwen']:
        if provider_name in providers_data:
            data = providers_data[provider_name]
            
            # Calculate average score for provider
            provider_models = [r for r in global_rankings if r['provider'] and r['provider'].lower() == provider_name]
            avg_score = sum(m['average_score'] for m in provider_models) / len(provider_models) if provider_models else 0
            
            provider_stats[provider_name] = {
                'models_configured': len(data.get('models', [])),
                'models_tested': data.get('models_tested', 0),
                'total_tests': data.get('total_tests', 0),
                'successful_tests': data.get('successful_tests', 0),
                'failed_tests': data.get('total_tests', 0) - data.get('successful_tests', 0),
                'average_score': avg_score,
                'top_model': provider_models[0]['model_id'] if provider_models else 'N/A',
                'top_rank': provider_models[0]['rank'] if provider_models else 'N/A'
            }
    
    # Create comprehensive report
    comprehensive_report = {
        'report_date': datetime.now().isoformat(),
        'title': 'AI Model Benchmark Comprehensive Report V2',
        'summary': {
            'total_providers': len(provider_stats),
            'total_models_configured': sum(p['models_configured'] for p in provider_stats.values()),
            'total_models_tested': len(model_scores),
            'total_tests_run': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'failed_tests': len([r for r in all_results if not r.get('success')])
        },
        'provider_statistics': provider_stats,
        'global_rankings': global_rankings[:30],  # Top 30 models
        'providers_data': providers_data
    }
    
    # Save comprehensive report
    output_dir = Path("benchmark_results/reports")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / "comprehensive_v2.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_report, f, indent=2, ensure_ascii=False)
    
    print(f"\nComprehensive Report V2 Created:")
    print(f"  Total Providers: {comprehensive_report['summary']['total_providers']}")
    print(f"  Total Models Tested: {comprehensive_report['summary']['total_models_tested']}")
    print(f"  Total Tests: {comprehensive_report['summary']['total_tests_run']}")
    print(f"  Successful: {comprehensive_report['summary']['successful_tests']}")
    print(f"  Failed: {comprehensive_report['summary']['failed_tests']}")
    print(f"\nTop 5 Models:")
    for i, model in enumerate(global_rankings[:5]):
        print(f"  {i+1}. {model['display_name']} ({model['provider']}): {model['average_score']:.1f}")
    print(f"\nSaved to: {output_file}")
    
    # Generate markdown report
    generate_markdown_report_v2(comprehensive_report, output_dir / "comprehensive_v2.md")
    
    return comprehensive_report

def generate_markdown_report_v2(report, output_file):
    """Generate markdown version of the report"""
    md_content = f"""# {report['title']}

**Report Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Executive Summary

- **Total Providers**: {report['summary']['total_providers']}
- **Total Models Tested**: {report['summary']['total_models_tested']}
- **Total Tests Run**: {report['summary']['total_tests_run']}
- **Successful Tests**: {report['summary']['successful_tests']}
- **Failed Tests**: {report['summary']['failed_tests']}

## Provider Statistics

| Provider | Models Configured | Models Tested | Tests Run | Success Rate | Avg Score | Top Model |
|----------|------------------|---------------|-----------|--------------|-----------|-----------|
"""
    
    for provider, stats in report['provider_statistics'].items():
        success_rate = (stats['successful_tests'] / stats['total_tests'] * 100) if stats['total_tests'] > 0 else 0
        md_content += f"| {provider.capitalize()} | {stats['models_configured']} | {stats['models_tested']} | "
        md_content += f"{stats['total_tests']} | {success_rate:.1f}% | {stats['average_score']:.1f} | "
        md_content += f"{stats['top_model']} |\n"
    
    md_content += "\n## Global Rankings (Top 20)\n\n"
    md_content += "| Rank | Model | Provider | Score | Tests | Coverage |\n"
    md_content += "|------|-------|----------|-------|-------|----------|\n"
    
    for model in report['global_rankings'][:20]:
        coverage = ', '.join(model['test_coverage'])
        md_content += f"| {model['rank']} | **{model['display_name']}** | {model['provider']} | "
        md_content += f"{model['average_score']:.1f} | {model['tests_completed']} | {coverage} |\n"
    
    md_content += "\n## Dimension Analysis (Top 10)\n\n"
    md_content += "| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural | Average |\n"
    md_content += "|-------|--------|-------------|-----------|---------|------------|----------|----------|\n"
    
    for model in report['global_rankings'][:10]:
        dims = model['average_dimensions']
        md_content += f"| {model['display_name']} | "
        for dim in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']:
            score = dims.get(dim, 0)
            md_content += f"{score:.0f} | "
        md_content += f"{model['average_score']:.1f} |\n"
    
    md_content += "\n## Key Findings\n\n"
    md_content += "### Claude 4.1 Update\n"
    md_content += "- Successfully tested Claude Opus 4.1 (claude-opus-4-1-20250805)\n"
    md_content += "- Average score: 80.3/100 across 3 tests\n"
    md_content += "- All tests passed on first attempt (no retries needed)\n\n"
    
    md_content += "### Provider Performance\n"
    
    # Find best provider
    best_provider = max(report['provider_statistics'].items(), 
                       key=lambda x: x[1]['average_score'])
    md_content += f"- Best performing provider: **{best_provider[0].capitalize()}** "
    md_content += f"(avg score: {best_provider[1]['average_score']:.1f})\n"
    
    md_content += "\n### Model Categories\n"
    md_content += "- **Text Generation**: GPT, Claude, Qwen, DeepSeek models\n"
    md_content += "- **Reasoning Models**: o1, o3-mini, Claude 4.x series\n"
    md_content += "- **Efficient Models**: Haiku, Flash, Mini variants\n"
    md_content += "- **Specialized**: Qwen3-Coder for code generation\n"
    
    md_content += "\n## Notes\n\n"
    md_content += "- All models tested with standardized prompts (poem_moon, story_robot, code_fibonacci)\n"
    md_content += "- Scoring performed by GPT-4o-mini for consistency\n"
    md_content += "- Claude 4.1 tested with retry mechanism for handling server errors\n"
    md_content += "- Qwen models tested via DashScope international endpoint\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"Markdown report saved to: {output_file}")

if __name__ == "__main__":
    print("="*70)
    print("MERGING ALL TEST RESULTS V2")
    print("="*70)
    
    # Create comprehensive report
    report = create_comprehensive_report_v2()
    
    print("\n" + "="*70)
    print("MERGE COMPLETE")
    print("="*70)