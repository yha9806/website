"""
Fix non-OpenAI model scores to be NULL
修正非OpenAI模型的分数为NULL，只保留真实的OpenAI benchmark数据
"""
import sqlite3

def fix_non_openai_scores():
    print("=== 修正非OpenAI模型分数为NULL ===")
    
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    # 将所有非OpenAI模型的分数设置为NULL
    cursor.execute('''
        UPDATE ai_models 
        SET overall_score = NULL, benchmark_score = NULL
        WHERE organization != 'OpenAI' AND data_source != 'benchmark'
    ''')
    
    affected_rows = cursor.rowcount
    print(f"已将 {affected_rows} 个非OpenAI模型的分数设置为NULL")
    
    conn.commit()
    
    print("\n=== 验证修改结果 ===")
    cursor.execute('SELECT name, organization, overall_score, data_source FROM ai_models ORDER BY overall_score DESC NULLS LAST')
    
    print("Models with scores (only OpenAI benchmark data):")
    scored_count = 0
    null_count = 0
    
    for row in cursor.fetchall():
        name, org, score, source = row
        if score is not None:
            print(f"  {name:20} | {org:15} | Score: {score:8.3f} | Source: {source}")
            scored_count += 1
        else:
            null_count += 1
    
    print(f"\nModels with NULL scores (N/A): {null_count}")
    print(f"Models with real scores: {scored_count}")
    
    # 显示前几个NULL分数的模型
    print("\nFirst few models with NULL scores:")
    cursor.execute('SELECT name, organization FROM ai_models WHERE overall_score IS NULL LIMIT 5')
    for row in cursor.fetchall():
        name, org = row
        print(f"  {name:20} | {org:15} | Score: N/A")
    
    conn.close()
    print("\n[SUCCESS] 修正完成！现在只有OpenAI模型显示真实分数，其他模型显示N/A")

if __name__ == "__main__":
    fix_non_openai_scores()