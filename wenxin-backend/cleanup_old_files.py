"""
清理旧的测试脚本和临时数据
"""
import os
from pathlib import Path

# 要删除的旧测试脚本
old_scripts = [
    'test_openai_simple.py',
    'test_openai_quick.py', 
    'test_openai_limited.py',
    'test_single_model.py',
    'test_openai_remaining.py',
    'test_anthropic_models.py',
    'test_fixed_models.py',
    'test_limited_models.py',
    'test_unified_interface.py'  # 这个也是旧的
]

# 要删除的临时数据文件
temp_data = [
    'test_single_result.json',
    'openai_benchmark_results_backup.json',
    'openai_model_scores_backup.json',
    'nul'  # Windows 创建的临时文件
]

# 删除文件
deleted_count = 0
for filename in old_scripts + temp_data:
    filepath = Path(filename)
    if filepath.exists():
        try:
            filepath.unlink()
            print(f"Deleted: {filename}")
            deleted_count += 1
        except PermissionError:
            print(f"Skipped: {filename} (permission denied)")

print(f"\nTotal deleted: {deleted_count} files")

# 列出剩余的测试相关文件
print("\nRemaining test files:")
for f in Path('.').glob('test_*.py'):
    print(f"  - {f.name}")
    
print("\nKeeping these essential scripts:")
essential = [
    'test_openai_final.py',  # 最新的 OpenAI 测试脚本
    'run_all_models_benchmark.py',  # 主要的基准测试脚本
    'benchmark_by_provider.py',  # 按厂商测试脚本
    'show_final_results.py',  # 显示结果脚本
    'check_results.py'  # 检查结果脚本
]
for f in essential:
    if Path(f).exists():
        print(f"  ✓ {f}")