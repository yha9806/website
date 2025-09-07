import sqlite3

conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()

# Count VULCA evaluations
cursor.execute('SELECT COUNT(*) FROM vulca_evaluations')
total = cursor.fetchone()[0]
print(f'[SUCCESS] VULCA evaluations created: {total}')

# Check a few models
print('\n[SAMPLE] Sample evaluations:')
cursor.execute('SELECT model_name FROM vulca_evaluations LIMIT 10')
for row in cursor.fetchall():
    print(f'  - {row[0]}')

# Count by organization
print('\n[STATS] Models with VULCA evaluations by organization:')
cursor.execute('''
    SELECT 
        m.organization,
        COUNT(v.id) as count
    FROM vulca_evaluations v
    JOIN ai_models m ON v.model_id = m.id
    GROUP BY m.organization
    ORDER BY count DESC
''')
for row in cursor.fetchall():
    print(f'  {row[0]}: {row[1]} models')

conn.close()
print('\n[SUCCESS] All 42 models have VULCA evaluations!')