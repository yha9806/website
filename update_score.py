#!/usr/bin/env python3
import sqlite3

# Connect to database
conn = sqlite3.connect('wenxin-backend/wenxin.db')
cursor = conn.cursor()

# Update Claude 3.5 Sonnet score to 100
cursor.execute('UPDATE ai_models SET overall_score = 100.0 WHERE name = "Claude 3.5 Sonnet"')
conn.commit()
print('Updated Claude 3.5 Sonnet score to 100.0')

# Get top 5 models
cursor.execute('SELECT name, overall_score FROM ai_models ORDER BY overall_score DESC NULLS LAST LIMIT 5')
results = cursor.fetchall()

print('\nTop 5 models after update:')
for name, score in results:
    print(f'{name}: {score if score is not None else "N/A"}')

conn.close()