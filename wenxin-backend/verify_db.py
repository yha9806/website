#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('wenxin.db')
cursor = conn.cursor()

# Count total models
cursor.execute('SELECT COUNT(*) FROM ai_models')
total = cursor.fetchone()[0]
print(f'Total models: {total}')

# Get top 5 models
cursor.execute('SELECT name, organization, overall_score FROM ai_models WHERE overall_score IS NOT NULL ORDER BY overall_score DESC LIMIT 5')
print('\nTop 5 models:')
for name, org, score in cursor.fetchall():
    print(f'  {name} ({org}): {score}')

# Count by organization
cursor.execute('SELECT organization, COUNT(*) FROM ai_models GROUP BY organization ORDER BY COUNT(*) DESC')
print('\nModels by organization:')
for org, count in cursor.fetchall():
    print(f'  {org}: {count} models')

conn.close()