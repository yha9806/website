import sqlite3
import json

conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()

# Count VULCA evaluations
cursor.execute('SELECT COUNT(*) FROM vulca_evaluations')
total = cursor.fetchone()[0]
print(f'[SUCCESS] VULCA evaluations created: {total}')

# Sample evaluations
print('\n[SAMPLE] Sample evaluations:')
cursor.execute('SELECT model_name, original_6d_scores FROM vulca_evaluations LIMIT 5')
for row in cursor.fetchall():
    # Check if scores is a string and parse it
    if isinstance(row[1], str):
        # Remove extra quotes if present
        scores_str = row[1].strip('"')
        scores = json.loads(scores_str)
    else:
        scores = row[1]
    avg_score = sum(scores.values()) / 6
    print(f'  {row[0]}: Average 6D score = {avg_score:.2f}')
    
# Score distribution
print('\n[STATS] Score distribution by organization:')
cursor.execute('''
    SELECT 
        m.organization,
        COUNT(v.id) as count,
        AVG(CAST(json_extract(v.original_6d_scores, '$.creativity') AS REAL) +
            CAST(json_extract(v.original_6d_scores, '$.technique') AS REAL) +
            CAST(json_extract(v.original_6d_scores, '$.emotion') AS REAL) +
            CAST(json_extract(v.original_6d_scores, '$.context') AS REAL) +
            CAST(json_extract(v.original_6d_scores, '$.innovation') AS REAL) +
            CAST(json_extract(v.original_6d_scores, '$.impact') AS REAL)) / 6.0 as avg_score
    FROM vulca_evaluations v
    JOIN ai_models m ON v.model_id = m.id
    GROUP BY m.organization
    ORDER BY avg_score DESC
    LIMIT 5
''')
for row in cursor.fetchall():
    print(f'  {row[0]}: {row[1]} models, avg score = {row[2]:.2f}')

conn.close()
print('\n[SUCCESS] VULCA data seed script executed successfully!')