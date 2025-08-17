"""
修正OpenAI模型分数 - 最终版本
确保所有真实分数正确显示在数据库中
"""
import json
import sqlite3
from collections import defaultdict

def load_real_scores():
    """加载真实分数数据"""
    with open('openai_model_scores_backup.json', 'r') as f:
        return json.load(f)

def update_model_scores():
    """更新数据库中的模型分数"""
    scores = load_real_scores()
    
    # 模型名称映射
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
    
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    print("=== 更新OpenAI模型分数 ===")
    
    for model_id, data in scores.items():
        # 转换为0-100分制，0.0也是有效分数
        overall_score = round(data['average_score'] * 100, 2)
        db_model_name = model_mapping.get(model_id, model_id)
        
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
            print(f"  更新 {model_id} -> {db_model_name}: {overall_score:.2f}分")
        else:
            print(f"  未找到: {model_id} -> {db_model_name}")
    
    conn.commit()
    
    # 验证结果
    print("\n=== 验证更新结果 ===")
    cursor.execute("""
        SELECT name, organization, overall_score, verification_count, confidence_level 
        FROM ai_models 
        WHERE organization = 'OpenAI' 
        ORDER BY overall_score DESC NULLS LAST
    """)
    
    for row in cursor.fetchall():
        name, org, score, tests, confidence = row
        score_str = f"{score:.2f}" if score is not None else "N/A"
        tests_str = tests if tests is not None else 0
        conf_str = f"{confidence:.2%}" if confidence is not None else "N/A"
        print(f"  {name:<15} | {score_str:>8} | Tests:{tests_str:>2} | Conf:{conf_str}")
    
    conn.close()
    print("\n完成! 所有OpenAI模型分数已更新")

if __name__ == "__main__":
    update_model_scores()