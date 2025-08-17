"""
重新计算真实的OpenAI模型分数
基于 openai_benchmark_results_backup.json 中的完整评测数据
"""
import json
import sqlite3
from collections import defaultdict

def load_detailed_benchmark_data():
    """加载详细的评测结果数据"""
    try:
        with open('openai_benchmark_results_backup.json', 'r') as f:
            results = json.load(f)
        print(f"加载了 {len(results)} 条详细评测结果")
        return results
    except FileNotFoundError:
        print("Error: openai_benchmark_results_backup.json not found")
        return []

def calculate_model_scores(results):
    """基于详细评测数据计算每个模型的真实平均分"""
    model_data = defaultdict(lambda: {
        'scores': [],
        'total_tests': 0,
        'successful_tests': 0,
        'total_duration': 0,
        'total_tokens': 0
    })
    
    # 聚合每个模型的测试结果
    for result in results:
        model_id = result['model_id']
        model_info = model_data[model_id]
        
        model_info['total_tests'] += 1
        model_info['total_duration'] += result.get('duration', 0)
        
        if result.get('success', False):
            model_info['successful_tests'] += 1
            model_info['total_tokens'] += result.get('tokens_used', 0)
            
            # 获取overall_score
            overall_score = result.get('overall_score', 0)
            if overall_score is not None:
                model_info['scores'].append(overall_score)
                print(f"  {model_id}: test {result.get('test_id', 'unknown')} -> score: {overall_score}")
    
    # 计算最终统计数据
    final_scores = {}
    for model_id, data in model_data.items():
        if data['scores']:
            average_score = sum(data['scores']) / len(data['scores'])
        else:
            average_score = 0.0
        
        success_rate = data['successful_tests'] / data['total_tests'] if data['total_tests'] > 0 else 0
        avg_duration = data['total_duration'] / data['total_tests'] if data['total_tests'] > 0 else 0
        avg_tokens = data['total_tokens'] / data['successful_tests'] if data['successful_tests'] > 0 else 0
        
        final_scores[model_id] = {
            'average_score': average_score,
            'average_duration': avg_duration,
            'average_tokens': avg_tokens,
            'success_rate': success_rate,
            'total_tests': data['total_tests'],
            'successful_tests': data['successful_tests'],
            'score_count': len(data['scores'])
        }
        
        print(f"\n{model_id} 最终统计:")
        print(f"  平均分: {average_score:.6f}")
        print(f"  成功测试: {data['successful_tests']}/{data['total_tests']}")
        print(f"  有效分数: {len(data['scores'])} 个")
        print(f"  成功率: {success_rate:.2%}")
    
    return final_scores

def update_database_with_real_scores(scores):
    """使用重新计算的真实分数更新数据库"""
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    print("\n=== 更新数据库中的真实分数 ===")
    
    # 模型名称映射 - 匹配数据库中的确切名称
    model_mapping = {
        'gpt-4': 'GPT-4',
        'gpt-4-turbo': 'GPT-4 Turbo', 
        'gpt-4.5': 'GPT-4.5',
        'gpt-4o': 'GPT-4o',
        'gpt-4o-mini': 'GPT-4o Mini',
        'gpt-5': 'GPT-5',
        'gpt-5-mini': 'GPT-5 Mini',
        'gpt-5-nano': 'GPT-5 Nano',
        'o1': 'O1',
        'o1-mini': 'O1 Mini',
        'o3-mini': 'O3 Mini'
    }
    
    for model_id, data in scores.items():
        # 转换为0-100分制 - 关键修正：0.0也是有效分数
        overall_score = round(data['average_score'] * 100, 2)
        
        # 获取数据库中的模型名称
        db_model_name = model_mapping.get(model_id, model_id)
        
        # 更新模型分数
        cursor.execute("""
            UPDATE ai_models 
            SET overall_score = ?, benchmark_score = ?, 
                verification_count = ?, confidence_level = ?,
                data_source = 'benchmark'
            WHERE name = ? AND organization = 'OpenAI'
        """, (
            overall_score,
            overall_score,
            data['total_tests'],
            data['success_rate'],
            db_model_name
        ))
        
        if cursor.rowcount > 0:
            score_display = f"{overall_score:.2f}" if overall_score > 0 else "0.00"
            print(f"  ✅ 更新 {model_id} -> {db_model_name}: {score_display}分 (基于{data['score_count']}个有效测试)")
        else:
            print(f"  ❌ 未找到匹配的模型: {model_id} -> {db_model_name}")
    
    conn.commit()
    
    # 验证更新结果
    print("\n=== 验证更新结果 ===")
    cursor.execute("""
        SELECT name, organization, overall_score, verification_count, confidence_level 
        FROM ai_models 
        WHERE organization = 'OpenAI' 
        ORDER BY overall_score DESC NULLS LAST
    """)
    
    results = cursor.fetchall()
    for row in results:
        name, org, score, tests, confidence = row
        score_str = f"{score:.2f}" if score is not None else "N/A"
        tests_str = tests if tests is not None else 0
        conf_str = f"{confidence:.2%}" if confidence is not None else "N/A"
        print(f"  {name:15} | {org:10} | {score_str:8} | 测试:{tests_str:2} | 信心:{conf_str}")
    
    conn.close()

def main():
    print("=== 基于真实评测数据重新计算OpenAI模型分数 ===")
    
    # 1. 加载详细评测数据
    results = load_detailed_benchmark_data()
    if not results:
        return
    
    # 2. 重新计算模型分数
    scores = calculate_model_scores(results)
    
    # 3. 更新数据库
    update_database_with_real_scores(scores)
    
    print("\n[完成] 真实分数重新计算和更新完毕！")

if __name__ == "__main__":
    main()