import sqlite3

conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()

# Get total count
cursor.execute('SELECT COUNT(*) FROM ai_models')
total = cursor.fetchone()[0]
print(f'Total models: {total}')

# Get top models
cursor.execute('SELECT id, name, organization, overall_score FROM ai_models ORDER BY overall_score DESC LIMIT 10')
print('\nTop 10 models:')
for row in cursor.fetchall():
    model_id = row[0][:8] if len(row[0]) > 8 else row[0]
    print(f'  ID: {model_id}... | {row[1]} ({row[2]}) - Score: {row[3]}')

# Get all models grouped by organization
cursor.execute('SELECT organization, COUNT(*) as count FROM ai_models GROUP BY organization ORDER BY count DESC')
print('\nModels by organization:')
for row in cursor.fetchall():
    print(f'  {row[0]}: {row[1]} models')

conn.close()