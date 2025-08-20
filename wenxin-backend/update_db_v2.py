"""
直接更新SQLite数据库，添加新字段
"""
import sqlite3
import json
import sys
import io

# 设置UTF-8编码
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def update_database():
    """添加增强版基准测试所需的新字段"""
    conn = sqlite3.connect('wenxin.db')
    cursor = conn.cursor()
    
    # 获取现有列
    cursor.execute("PRAGMA table_info(ai_models)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    
    # 需要添加的新列
    new_columns = [
        ("benchmark_responses", "TEXT", "'{}'"),
        ("scoring_details", "TEXT", "'{}'"),
        ("score_highlights", "TEXT", "'[]'"),
        ("score_weaknesses", "TEXT", "'[]'"),
        ("improvement_suggestions", "TEXT", "NULL"),
    ]
    
    # 添加新列
    for col_name, col_type, default_value in new_columns:
        if col_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE ai_models ADD COLUMN {col_name} {col_type} DEFAULT {default_value}")
                print(f"[OK] Added column: {col_name}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" not in str(e):
                    print(f"[ERROR] Error adding column {col_name}: {e}")
        else:
            print(f"[INFO] Column {col_name} already exists")
    
    conn.commit()
    
    # 显示更新后的表结构
    cursor.execute("PRAGMA table_info(ai_models)")
    columns = cursor.fetchall()
    print("\n[TABLE STRUCTURE] Updated table structure:")
    print("ID | Name | Type")
    print("-" * 40)
    for col in columns:
        print(f"{col[0]:3} | {col[1]:30} | {col[2]}")
    
    conn.close()
    print("\n[SUCCESS] Database update completed!")

if __name__ == "__main__":
    update_database()