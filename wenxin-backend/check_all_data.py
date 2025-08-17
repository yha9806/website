"""
检查所有数据库和数据文件的详细清单
"""
import sqlite3
import json
import os
from pathlib import Path

def check_databases():
    """检查所有数据库文件"""
    print("=== 数据库文件清单 ===")
    
    db_files = ['wenxin.db', 'model_monitor.db']
    
    for db_file in db_files:
        if os.path.exists(db_file):
            size = os.path.getsize(db_file) / 1024  # KB
            print(f"\n{db_file}:")
            print(f"  文件大小: {size:.1f} KB")
            
            try:
                conn = sqlite3.connect(db_file)
                cursor = conn.cursor()
                
                # 获取表结构
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                print(f"  表数量: {len(tables)}")
                
                for table in tables:
                    table_name = table[0]
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    count = cursor.fetchone()[0]
                    print(f"    - {table_name}: {count} 条记录")
                
                conn.close()
            except Exception as e:
                print(f"  错误: {e}")

def check_main_database():
    """详细检查主数据库中的模型"""
    print("\n=== 主数据库详细内容 (wenxin.db) ===")
    
    if not os.path.exists('wenxin.db'):
        print("wenxin.db 不存在")
        return
    
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    # 检查所有模型
    cursor.execute('''
        SELECT name, organization, overall_score, data_source, verification_count, confidence_level 
        FROM ai_models 
        ORDER BY organization, overall_score DESC NULLS LAST
    ''')
    
    results = cursor.fetchall()
    print(f"总模型数: {len(results)}")
    
    current_org = None
    for name, org, score, source, tests, confidence in results:
        if org != current_org:
            print(f"\n=== {org} 组织 ===")
            current_org = org
        
        score_str = f"{score:.2f}" if score is not None else "N/A"
        source_str = source or "unknown"
        tests_str = tests or 0
        confidence_str = f"{confidence:.2%}" if confidence is not None else "N/A"
        
        print(f"  {name:20} | 分数: {score_str:8} | 来源: {source_str:10} | 测试: {tests_str:2} | 信心: {confidence_str}")
    
    conn.close()

def check_json_files():
    """检查所有JSON数据文件"""
    print("\n=== JSON数据文件清单 ===")
    
    json_files = [
        'openai_model_scores_backup.json',
        'openai_benchmark_results_backup.json',
        'openai_benchmark_results.json',
        'openai_model_scores.json',
        'benchmark_test_cases.json'
    ]
    
    for json_file in json_files:
        if os.path.exists(json_file):
            size = os.path.getsize(json_file) / 1024  # KB
            print(f"\n{json_file}:")
            print(f"  文件大小: {size:.1f} KB")
            
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    print(f"  数据类型: 列表，包含 {len(data)} 个项目")
                    if data and isinstance(data[0], dict):
                        print(f"  第一个项目的键: {list(data[0].keys())}")
                elif isinstance(data, dict):
                    print(f"  数据类型: 字典，包含 {len(data)} 个键")
                    print(f"  主要键: {list(data.keys())[:10]}")  # 显示前10个键
                else:
                    print(f"  数据类型: {type(data)}")
                    
            except Exception as e:
                print(f"  错误: {e}")

def check_collected_responses():
    """检查collected_responses目录"""
    print("\n=== collected_responses 目录 ===")
    
    responses_dir = Path('collected_responses')
    if responses_dir.exists():
        json_files = list(responses_dir.glob('*.json'))
        print(f"文件数量: {len(json_files)}")
        
        total_size = 0
        for file_path in json_files:
            size = file_path.stat().st_size / 1024  # KB
            total_size += size
            
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    count = len(data)
                elif isinstance(data, dict):
                    count = len(data)
                else:
                    count = "unknown"
                
                print(f"  {file_path.name:30} | {size:8.1f} KB | {count} 项")
            except Exception as e:
                print(f"  {file_path.name:30} | {size:8.1f} KB | 错误: {e}")
        
        print(f"\n总计大小: {total_size:.1f} KB")
    else:
        print("collected_responses 目录不存在")

def check_scoring_results():
    """检查scoring_results目录"""
    print("\n=== scoring_results 目录 ===")
    
    scoring_dir = Path('scoring_results')
    if scoring_dir.exists():
        json_files = list(scoring_dir.glob('*.json'))
        print(f"文件数量: {len(json_files)}")
        
        total_size = 0
        for file_path in json_files:
            size = file_path.stat().st_size / 1024  # KB
            total_size += size
            
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    count = len(data)
                elif isinstance(data, dict):
                    count = len(data)
                else:
                    count = "unknown"
                
                print(f"  {file_path.name:30} | {size:8.1f} KB | {count} 项")
            except Exception as e:
                print(f"  {file_path.name:30} | {size:8.1f} KB | 错误: {e}")
        
        print(f"\n总计大小: {total_size:.1f} KB")
    else:
        print("scoring_results 目录不存在")

def main():
    print("=" * 60)
    print("WenXin MoYun 项目数据清单报告")
    print("=" * 60)
    
    # 检查数据库
    check_databases()
    
    # 检查主数据库详情
    check_main_database()
    
    # 检查JSON文件
    check_json_files()
    
    # 检查collected_responses目录
    check_collected_responses()
    
    # 检查scoring_results目录
    check_scoring_results()
    
    print("\n" + "=" * 60)
    print("报告完成")

if __name__ == "__main__":
    main()