"""
Add missing metric columns to ai_models table
"""
import sqlite3

def add_columns():
    conn = sqlite3.connect("wenxin.db")
    cursor = conn.cursor()
    
    # List of columns to add
    columns = [
        ("rhythm_score", "REAL"),
        ("composition_score", "REAL"),
        ("narrative_score", "REAL"),
        ("emotion_score", "REAL"),
        ("creativity_score", "REAL"),
        ("cultural_score", "REAL"),
        ("benchmark_results", "TEXT"),
        ("tags", "TEXT")
    ]
    
    # Check which columns already exist
    cursor.execute("PRAGMA table_info(ai_models)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    # Add missing columns
    for column_name, column_type in columns:
        if column_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE ai_models ADD COLUMN {column_name} {column_type}")
                print(f"Added column: {column_name}")
            except sqlite3.OperationalError as e:
                print(f"Column {column_name} might already exist: {e}")
    
    conn.commit()
    
    # Verify columns
    cursor.execute("PRAGMA table_info(ai_models)")
    columns = cursor.fetchall()
    print("\nCurrent ai_models columns:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    conn.close()

if __name__ == "__main__":
    add_columns()