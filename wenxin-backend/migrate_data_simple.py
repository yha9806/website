#!/usr/bin/env python3
"""
Migrate SQLite real OpenAI data to Cloud SQL PostgreSQL
"""

import os
import sqlite3
import asyncio
import asyncpg
from typing import List, Dict, Any

# Cloud SQL connection details
POSTGRES_CONFIG = {
    'host': '/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres',
    'database': 'wenxin_db',
    'user': 'wenxin',
    'password': 'WenXin2024ProdDbPass'
}

SQLITE_DB_PATH = 'wenxin.db'

async def connect_to_postgres():
    """Connect to Cloud SQL PostgreSQL"""
    try:
        conn = await asyncpg.connect(
            host=POSTGRES_CONFIG['host'],
            database=POSTGRES_CONFIG['database'],
            user=POSTGRES_CONFIG['user'],
            password=POSTGRES_CONFIG['password']
        )
        print("Successfully connected to Cloud SQL PostgreSQL")
        return conn
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        return None

def read_sqlite_openai_models():
    """Read real OpenAI model data from SQLite"""
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"SQLite database not found: {SQLITE_DB_PATH}")
        return []
    
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    # Read OpenAI model data
    cursor.execute("""
        SELECT name, organization, version, category, description, 
               overall_score, metrics, tags, avatar_url, data_source,
               model_type, model_tier, llm_rank, image_rank
        FROM ai_models 
        WHERE organization = 'OpenAI' AND data_source = 'benchmark'
        ORDER BY overall_score DESC NULLS LAST
    """)
    
    models = []
    for row in cursor.fetchall():
        model = {
            'name': row[0],
            'organization': row[1], 
            'version': row[2],
            'category': row[3],
            'description': row[4],
            'overall_score': row[5],
            'metrics': row[6],  # JSON string
            'tags': row[7],     # JSON string  
            'avatar_url': row[8],
            'data_source': row[9],
            'model_type': row[10],
            'model_tier': row[11],
            'llm_rank': row[12],
            'image_rank': row[13]
        }
        models.append(model)
    
    conn.close()
    print(f"Read {len(models)} OpenAI models from SQLite")
    return models

async def clear_mock_data_postgres(pg_conn):
    """Clear mock data from PostgreSQL"""
    try:
        result = await pg_conn.execute("""
            DELETE FROM ai_models WHERE data_source = 'mock'
        """)
        deleted_count = int(result.split()[-1])
        print(f"Deleted {deleted_count} mock models from PostgreSQL")
        return True
    except Exception as e:
        print(f"Failed to clear mock data: {e}")
        return False

async def insert_openai_models_postgres(pg_conn, models: List[Dict[str, Any]]):
    """Insert OpenAI model data into PostgreSQL"""
    try:
        inserted_count = 0
        for model in models:
            # Check if model already exists
            existing = await pg_conn.fetchval("""
                SELECT id FROM ai_models 
                WHERE name = $1 AND organization = $2
            """, model['name'], model['organization'])
            
            if existing:
                # Update existing model
                await pg_conn.execute("""
                    UPDATE ai_models SET
                        version = $3,
                        category = $4, 
                        description = $5,
                        overall_score = $6,
                        metrics = $7,
                        tags = $8,
                        avatar_url = $9,
                        data_source = $10,
                        model_type = $11,
                        model_tier = $12,
                        llm_rank = $13,
                        image_rank = $14,
                        updated_at = NOW()
                    WHERE name = $1 AND organization = $2
                """, 
                model['name'], model['organization'], model['version'],
                model['category'], model['description'], model['overall_score'],
                model['metrics'], model['tags'], model['avatar_url'],
                model['data_source'], model['model_type'], model['model_tier'],
                model['llm_rank'], model['image_rank'])
                print(f"Updated: {model['name']}")
            else:
                # Insert new model
                await pg_conn.execute("""
                    INSERT INTO ai_models (
                        name, organization, version, category, description,
                        overall_score, metrics, tags, avatar_url, data_source,
                        model_type, model_tier, llm_rank, image_rank,
                        is_active, is_verified, created_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                        $11, $12, $13, $14, TRUE, FALSE, NOW()
                    )
                """,
                model['name'], model['organization'], model['version'],
                model['category'], model['description'], model['overall_score'],
                model['metrics'], model['tags'], model['avatar_url'],
                model['data_source'], model['model_type'], model['model_tier'],
                model['llm_rank'], model['image_rank'])
                print(f"Inserted: {model['name']} (Score: {model['overall_score']})")
            
            inserted_count += 1
        
        print(f"Successfully processed {inserted_count} OpenAI models")
        return True
    except Exception as e:
        print(f"Failed to insert models: {e}")
        return False

async def verify_migration(pg_conn):
    """Verify migration results"""
    try:
        # Check OpenAI model count
        openai_count = await pg_conn.fetchval("""
            SELECT COUNT(*) FROM ai_models 
            WHERE organization = 'OpenAI' AND data_source = 'benchmark'
        """)
        
        # Check total model count
        total_count = await pg_conn.fetchval("SELECT COUNT(*) FROM ai_models")
        
        print(f"\nMigration Verification:")
        print(f"   OpenAI models (benchmark): {openai_count}")
        print(f"   Total models: {total_count}")
        
        # Show OpenAI model details
        openai_models = await pg_conn.fetch("""
            SELECT name, overall_score, data_source 
            FROM ai_models 
            WHERE organization = 'OpenAI' 
            ORDER BY overall_score DESC NULLS LAST
        """)
        
        print(f"\nOpenAI Models in PostgreSQL:")
        for model in openai_models:
            score = f"{model['overall_score']:.2f}" if model['overall_score'] is not None else "N/A"
            print(f"   {model['name']}: {score} (source: {model['data_source']})")
        
        return openai_count > 0
    except Exception as e:
        print(f"Verification failed: {e}")
        return False

async def main():
    """Main migration process"""
    print("Starting SQLite to PostgreSQL migration...")
    print("=" * 50)
    
    # 1. Read SQLite data
    sqlite_models = read_sqlite_openai_models()
    if not sqlite_models:
        print("No OpenAI models found in SQLite")
        return
    
    # 2. Connect to PostgreSQL
    pg_conn = await connect_to_postgres()
    if not pg_conn:
        return
    
    try:
        # 3. Clear mock data
        print("\nClearing mock data...")
        await clear_mock_data_postgres(pg_conn)
        
        # 4. Insert real data
        print("\nInserting real OpenAI data...")
        success = await insert_openai_models_postgres(pg_conn, sqlite_models)
        
        if success:
            # 5. Verify migration
            print("\nVerifying migration...")
            await verify_migration(pg_conn)
            print("\nMigration completed successfully!")
        else:
            print("\nMigration failed!")
            
    finally:
        await pg_conn.close()
        print("\nPostgreSQL connection closed")

if __name__ == "__main__":
    asyncio.run(main())