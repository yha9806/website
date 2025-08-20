"""
分析所有提供商的数据分布
"""
import json
from pathlib import Path

def analyze_data():
    print("="*60)
    print("所有提供商数据分析")
    print("="*60)
    
    # 1. 分析complete文件（包含所有提供商）
    complete_file = Path("benchmark_results/complete/complete_benchmark_report.json")
    if complete_file.exists():
        with open(complete_file, 'r', encoding='utf-8') as f:
            complete_data = json.load(f)
        
        print("\n📁 COMPLETE文件（所有提供商汇总）:")
        print(f"路径: {complete_file}")
        print(f"总模型数: {complete_data['models_tested']}")
        print(f"总测试数: {complete_data['total_tests']}")
        
        # 按提供商分析
        provider_results = {}
        for result in complete_data['all_results']:
            model_id = result['model_id']
            
            # 判断提供商
            if 'gpt' in model_id or 'o1' in model_id or 'o3' in model_id:
                provider = 'OpenAI'
            elif 'deepseek' in model_id:
                provider = 'DeepSeek'
            elif 'claude' in model_id:
                provider = 'Anthropic'
            elif 'qwen' in model_id:
                provider = 'Qwen'
            else:
                provider = 'Other'
            
            if provider not in provider_results:
                provider_results[provider] = {
                    'total': 0,
                    'success': 0,
                    'models': set()
                }
            
            provider_results[provider]['total'] += 1
            provider_results[provider]['models'].add(model_id)
            if result.get('success'):
                provider_results[provider]['success'] += 1
        
        print("\n按提供商分布:")
        for provider, stats in provider_results.items():
            success_rate = (stats['success'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"\n{provider}:")
            print(f"  - 测试数: {stats['total']}")
            print(f"  - 成功数: {stats['success']}")
            print(f"  - 成功率: {success_rate:.1f}%")
            print(f"  - 模型: {', '.join(sorted(stats['models']))}")
    
    # 2. 分析openai文件（主文件，但包含所有数据）
    openai_file = Path("benchmark_results/openai/openai_benchmark_report.json")
    if openai_file.exists():
        with open(openai_file, 'r', encoding='utf-8') as f:
            openai_data = json.load(f)
        
        print("\n" + "="*60)
        print("📁 OPENAI文件（实际包含所有提供商）:")
        print(f"路径: {openai_file}")
        print(f"总模型数: {openai_data['models_tested']}")
        print(f"总测试数: {openai_data['total_tests']}")
        
        # 显示排名中的非OpenAI模型
        non_openai = []
        for ranking in openai_data['rankings']:
            model_id = ranking['model_id']
            if 'deepseek' in model_id or 'claude' in model_id or 'qwen' in model_id:
                non_openai.append(f"{model_id}: {ranking['average_score']:.1f}")
        
        if non_openai:
            print("\n非OpenAI模型排名:")
            for model in non_openai:
                print(f"  - {model}")
    
    # 3. 检查是否有单独的提供商文件夹
    results_dir = Path("benchmark_results")
    print("\n" + "="*60)
    print("目录结构:")
    
    for provider_dir in results_dir.iterdir():
        if provider_dir.is_dir():
            files = list(provider_dir.glob("*.json"))
            print(f"\n{provider_dir.name}/")
            for file in files[:5]:  # 只显示前5个文件
                print(f"  - {file.name}")
            if len(files) > 5:
                print(f"  ... 还有 {len(files) - 5} 个文件")
    
    # 4. 数据完整性总结
    print("\n" + "="*60)
    print("数据存储说明:")
    print("-"*60)
    print("1. openai/openai_benchmark_report.json")
    print("   ⚠️ 名称有误导性，实际包含所有提供商的数据")
    print("   ✅ 包含: OpenAI, DeepSeek, Anthropic, Qwen等所有测试结果")
    print()
    print("2. complete/complete_benchmark_report.json")
    print("   ✅ 完整备份，与openai文件内容相同")
    print()
    print("3. 单个提供商测试:")
    print("   ❌ 没有deepseek/, anthropic/, qwen/等单独文件夹")
    print("   原因: run_all_models_benchmark.py将所有结果保存到同一文件")
    
    print("\n" + "="*60)
    print("建议:")
    print("如需按提供商分离数据，可以运行 benchmark_by_provider.py")
    print("该脚本会创建单独的提供商文件夹和结果文件")

if __name__ == "__main__":
    analyze_data()