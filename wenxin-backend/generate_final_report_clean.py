"""
Generate final comprehensive benchmark report from cleaned data
"""
import json
from pathlib import Path
from datetime import datetime


def load_provider_data(provider: str) -> dict:
    """Load data for a specific provider"""
    # Try different file names
    possible_files = [
        f"benchmark_results/{provider}/{provider}_complete.json",  # New complete test results
        f"benchmark_results/{provider}/{provider}_final.json",
        f"benchmark_results/{provider}/{provider}_results.json",
        f"benchmark_results/{provider}/{provider}_benchmark_report.json"
    ]
    
    for file_path in possible_files:
        if Path(file_path).exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    
    return None


def generate_final_report():
    """Generate comprehensive final report"""
    print("="*70)
    print("GENERATING FINAL COMPREHENSIVE BENCHMARK REPORT")
    print("="*70)
    
    # Load data from all providers
    providers = ['openai', 'deepseek', 'anthropic', 'qwen']
    all_data = {}
    
    for provider in providers:
        data = load_provider_data(provider)
        if data:
            all_data[provider] = data
            print(f"\n{provider.upper()}:")
            print(f"  Models: {data.get('models_tested', 0)}")
            print(f"  Tests: {data.get('total_tests', 0)}")
            print(f"  Successful: {data.get('successful_tests', 0)}")
    
    # Combine all results
    all_results = []
    for provider, data in all_data.items():
        if 'all_results' in data:
            all_results.extend(data['all_results'])
    
    # Calculate global rankings
    model_scores = {}
    for result in all_results:
        if result.get('success') and result.get('overall_score'):
            model_id = result['model_id']
            if model_id not in model_scores:
                model_scores[model_id] = {
                    'provider': '',
                    'scores': [],
                    'dimensions': {},
                    'tests': set()
                }
            
            # Determine provider
            if 'gpt' in model_id or 'o1' in model_id or 'o3' in model_id:
                model_scores[model_id]['provider'] = 'OpenAI'
            elif 'deepseek' in model_id:
                model_scores[model_id]['provider'] = 'DeepSeek'
            elif 'claude' in model_id:
                model_scores[model_id]['provider'] = 'Anthropic'
            elif 'qwen' in model_id:
                model_scores[model_id]['provider'] = 'Alibaba'
            
            model_scores[model_id]['scores'].append(result['overall_score'])
            model_scores[model_id]['tests'].add(result.get('test_id', 'unknown'))
            
            if 'dimensions' in result:
                for dim, score in result['dimensions'].items():
                    if dim not in model_scores[model_id]['dimensions']:
                        model_scores[model_id]['dimensions'][dim] = []
                    model_scores[model_id]['dimensions'][dim].append(score)
    
    # Create rankings
    global_rankings = []
    for model_id, data in model_scores.items():
        avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        avg_dimensions = {}
        for dim, scores in data['dimensions'].items():
            avg_dimensions[dim] = sum(scores) / len(scores) if scores else 0
        
        global_rankings.append({
            'rank': 0,
            'model_id': model_id,
            'provider': data['provider'],
            'average_score': avg_score,
            'tests_completed': len(data['scores']),
            'test_coverage': sorted(data['tests']),
            'average_dimensions': avg_dimensions
        })
    
    # Sort and assign ranks
    global_rankings.sort(key=lambda x: x['average_score'], reverse=True)
    for i, ranking in enumerate(global_rankings):
        ranking['rank'] = i + 1
    
    # Calculate provider statistics
    provider_stats = {}
    for provider, data in all_data.items():
        successful = [r for r in data.get('all_results', []) if r.get('success')]
        failed = [r for r in data.get('all_results', []) if not r.get('success')]
        
        # Get provider's models in rankings
        provider_models = [r for r in global_rankings if r['provider'].lower() == provider]
        avg_score = sum(m['average_score'] for m in provider_models) / len(provider_models) if provider_models else 0
        
        provider_stats[provider] = {
            'models_configured': data.get('models_tested', 0),
            'models_tested': len(provider_models),
            'total_tests': data.get('total_tests', 0),
            'successful_tests': len(successful),
            'failed_tests': len(failed),
            'average_score': avg_score,
            'top_model': provider_models[0]['model_id'] if provider_models else 'N/A',
            'top_rank': provider_models[0]['rank'] if provider_models else 'N/A'
        }
    
    # Create final report
    final_report = {
        'report_date': datetime.now().isoformat(),
        'title': 'AI Model Benchmark Comprehensive Report',
        'summary': {
            'total_providers': len(all_data),
            'total_models_configured': sum(d.get('models_tested', 0) for d in all_data.values()),
            'total_models_tested': len(global_rankings),
            'total_tests_run': len(all_results),
            'successful_tests': len([r for r in all_results if r.get('success')]),
            'failed_tests': len([r for r in all_results if not r.get('success')])
        },
        'provider_statistics': provider_stats,
        'global_rankings': global_rankings[:20],  # Top 20
        'metadata': {
            'test_cases': ['poem_moon', 'story_robot', 'code_fibonacci'],
            'scoring_model': 'gpt-4o-mini',
            'scoring_dimensions': ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']
        }
    }
    
    # Save JSON report
    reports_dir = Path("benchmark_results/reports")
    reports_dir.mkdir(exist_ok=True)
    
    json_file = reports_dir / "comprehensive_report.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(final_report, f, indent=2, ensure_ascii=False)
    
    print(f"\n[SAVED] JSON report: {json_file}")
    
    # Generate markdown report
    md_content = f"""# AI Model Benchmark Comprehensive Report

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Total Providers**: {final_report['summary']['total_providers']}  
**Models Configured**: {final_report['summary']['total_models_configured']}  
**Models Successfully Tested**: {final_report['summary']['total_models_tested']}  
**Total Test Cases Run**: {final_report['summary']['total_tests_run']}  

## Executive Summary

This comprehensive benchmark evaluated AI models across multiple providers using three standardized test cases:
- **Poetry Generation**: Creative writing about moon and stars
- **Story Writing**: Narrative about a robot learning to paint  
- **Code Generation**: Python Fibonacci sequence implementation

All scoring was performed using GPT-4o-mini for consistency across 6 dimensions: rhythm, composition, narrative, emotion, creativity, and cultural appropriateness.

## Provider Performance Summary

| Provider | Models Configured | Models Tested | Tests Run | Success Rate | Avg Score | Top Model | Top Rank |
|----------|-------------------|---------------|-----------|--------------|-----------|-----------|----------|
"""
    
    for provider, stats in provider_stats.items():
        success_rate = (stats['successful_tests'] / stats['total_tests'] * 100) if stats['total_tests'] > 0 else 0
        md_content += f"| {provider.title()} | {stats['models_configured']} | {stats['models_tested']} | {stats['total_tests']} | {success_rate:.0f}% | {stats['average_score']:.1f} | {stats['top_model']} | #{stats['top_rank']} |\n"
    
    md_content += "\n## Global Rankings (Top 20)\n\n"
    md_content += "| Rank | Model | Provider | Score | Tests | Coverage |\n"
    md_content += "|------|-------|----------|-------|-------|----------|\n"
    
    for ranking in global_rankings[:20]:
        coverage = "✅" if len(ranking['test_coverage']) == 3 else f"{len(ranking['test_coverage'])}/3"
        md_content += f"| {ranking['rank']} | **{ranking['model_id']}** | {ranking['provider']} | {ranking['average_score']:.1f}/100 | {ranking['tests_completed']} | {coverage} |\n"
    
    md_content += "\n## Dimension Analysis (Top 10)\n\n"
    md_content += "| Model | Rhythm | Composition | Narrative | Emotion | Creativity | Cultural | Overall |\n"
    md_content += "|-------|--------|-------------|-----------|---------|------------|----------|---------|"
    
    for ranking in global_rankings[:10]:
        md_content += f"\n| {ranking['model_id']} "
        dims = ranking['average_dimensions']
        for dim in ['rhythm', 'composition', 'narrative', 'emotion', 'creativity', 'cultural']:
            score = dims.get(dim, 0)
            md_content += f"| {score:.0f} "
        md_content += f"| **{ranking['average_score']:.1f}** |"
    
    md_content += "\n\n## Key Findings\n\n"
    md_content += "### Top Performers\n"
    for i, ranking in enumerate(global_rankings[:3], 1):
        md_content += f"{i}. **{ranking['model_id']}** ({ranking['provider']}): {ranking['average_score']:.1f}/100\n"
    
    md_content += "\n### Provider Analysis\n"
    
    # Find best provider
    best_provider = max(provider_stats.items(), key=lambda x: x[1]['average_score'] if x[1]['models_tested'] > 0 else 0)
    md_content += f"- **Best Provider**: {best_provider[0].title()} with average score of {best_provider[1]['average_score']:.1f}/100\n"
    
    # Count successful providers
    successful_providers = [p for p, s in provider_stats.items() if s['models_tested'] > 0]
    md_content += f"- **Active Providers**: {len(successful_providers)}/{len(provider_stats)} successfully tested\n"
    
    md_content += "\n### Test Coverage\n"
    fully_tested = [r for r in global_rankings if len(r['test_coverage']) == 3]
    md_content += f"- **Complete Coverage**: {len(fully_tested)} models tested on all 3 cases\n"
    md_content += f"- **Partial Coverage**: {len(global_rankings) - len(fully_tested)} models with incomplete testing\n"
    
    md_content += "\n## Technical Notes\n\n"
    md_content += "### Configuration Updates\n"
    md_content += "- **DeepSeek R1/R1-distill**: Fixed API endpoint from `deepseek-reasoner` to `deepseek-chat` for poetry support\n"
    md_content += "- **OpenAI o1/o3 series**: System messages merged into user messages (not supported separately)\n"
    md_content += "- **GPT-5 series**: Using `max_completion_tokens` parameter instead of `max_tokens`\n"
    
    md_content += "\n### Failed Providers\n"
    failed_providers = [p for p, s in provider_stats.items() if s['models_tested'] == 0 and s['models_configured'] > 0]
    if failed_providers:
        md_content += "The following providers were configured but could not be tested:\n"
        for provider in failed_providers:
            stats = provider_stats[provider]
            md_content += f"- **{provider.title()}**: {stats['models_configured']} models configured, {stats['failed_tests']} tests failed\n"
    
    md_content += "\n---\n\n"
    md_content += f"*Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*  \n"
    md_content += "*Testing framework: WenXin MoYun AI Evaluation Platform*  \n"
    md_content += "*Scoring model: GPT-4o-mini*\n"
    
    # Save markdown report
    md_file = reports_dir / "comprehensive_report.md"
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"[SAVED] Markdown report: {md_file}")
    
    # Print summary
    print("\n" + "="*70)
    print("REPORT GENERATION COMPLETE")
    print("="*70)
    
    print("\nTop 10 Models:")
    for ranking in global_rankings[:10]:
        coverage = "✅" if len(ranking['test_coverage']) == 3 else f"({len(ranking['test_coverage'])}/3)"
        print(f"  {ranking['rank']:2d}. {ranking['model_id']:20s} {ranking['average_score']:5.1f}/100 {coverage}")
    
    print("\nProvider Summary:")
    for provider, stats in provider_stats.items():
        if stats['models_tested'] > 0:
            print(f"  {provider:10s}: {stats['models_tested']} models, avg score {stats['average_score']:.1f}")
    
    return final_report


if __name__ == "__main__":
    report = generate_final_report()