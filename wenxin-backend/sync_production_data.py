#!/usr/bin/env python3
"""
同步本地真实OpenAI数据到生产环境
将本地SQLite数据库中的真实OpenAI评测数据复制到新的生产数据库文件
"""

import sqlite3
import shutil
import os
from datetime import datetime

def backup_current_db():
    """备份当前生产数据库"""
    if os.path.exists('wenxin_production.db'):
        backup_name = f'wenxin_production_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
        shutil.copy2('wenxin_production.db', backup_name)
        print(f"已备份当前生产数据库为: {backup_name}")

def copy_local_to_production():
    """复制本地数据库到生产环境"""
    local_db = 'wenxin.db'
    production_db = 'wenxin_production.db'
    
    if not os.path.exists(local_db):
        print(f"错误: 本地数据库 {local_db} 不存在")
        return False
    
    # 备份现有生产数据库
    backup_current_db()
    
    # 复制本地数据库
    shutil.copy2(local_db, production_db)
    print(f"已复制 {local_db} 到 {production_db}")
    
    # 验证复制的数据
    conn = sqlite3.connect(production_db)
    cursor = conn.cursor()
    
    # 检查模型数量
    cursor.execute('SELECT COUNT(*) FROM ai_models')
    model_count = cursor.fetchone()[0]
    print(f"生产数据库包含 {model_count} 个模型")
    
    # 检查OpenAI模型的真实分数
    cursor.execute('''
        SELECT name, organization, overall_score, data_source 
        FROM ai_models 
        WHERE organization = 'OpenAI' 
        ORDER BY overall_score DESC NULLS LAST
    ''')
    
    print("\n=== OpenAI模型验证 ===")
    for row in cursor.fetchall():
        name, org, score, source = row
        score_str = f"{score:.2f}" if score is not None else "N/A"
        print(f"  {name}: {score_str} (来源: {source})")
    
    # 检查非OpenAI模型
    cursor.execute('''
        SELECT name, organization, overall_score 
        FROM ai_models 
        WHERE organization != 'OpenAI' 
        ORDER BY name
    ''')
    
    print("\n=== 非OpenAI模型验证 ===")
    for row in cursor.fetchall():
        name, org, score = row
        score_str = f"{score:.2f}" if score is not None else "N/A"
        print(f"  {name} ({org}): {score_str}")
    
    conn.close()
    return True

def main():
    print("=== WenXin MoYun 生产数据同步 ===")
    print("将本地真实OpenAI评测数据同步到生产环境")
    print()
    
    if copy_local_to_production():
        print("\n✅ 数据同步完成!")
        print("生产数据库现在包含真实的OpenAI评测数据")
        print()
        print("注意: 需要将 wenxin_production.db 部署到生产环境")
        print("并确保生产环境使用正确的数据库文件")
    else:
        print("\n❌ 数据同步失败")

if __name__ == "__main__":
    main()