"""
更新OpenAI模型基准测试分数到数据库
基于2025-08-12的最新测试结果
"""
import asyncio
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# 最新的OpenAI模型测试分数（来自openai_model_scores.json）
OPENAI_SCORES = {
    "gpt-4": 0.856,
    "gpt-4-turbo": 0.877, 
    "gpt-4.5": 0.883,
    "gpt-4o": 0.877,
    "gpt-4o-mini": 0.888,
    "gpt-5": 0.704,
    "gpt-5-mini": 0.713,
    "gpt-5-nano": 0.759,
    "o1": 0.834,
    "o1-mini": 0.890,  # 新的第一名！
    "o3-mini": 0.879
}

# 模型显示名称映射
MODEL_DISPLAY_NAMES = {
    "gpt-4": "GPT-4",
    "gpt-4-turbo": "GPT-4 Turbo", 
    "gpt-4.5": "GPT-4.5",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-5": "GPT-5",
    "gpt-5-mini": "GPT-5 Mini",
    "gpt-5-nano": "GPT-5 Nano",
    "o1": "o1",
    "o1-mini": "o1-mini",
    "o3-mini": "o3-mini"
}

def update_scores():
    """更新数据库中的OpenAI模型分数"""
    
    # 创建数据库连接
    engine = create_engine(str(settings.DATABASE_URL).replace("sqlite+aiosqlite", "sqlite"))
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting OpenAI model score update...")
        
        # 首先查看当前的OpenAI模型
        result = session.execute(text("""
            SELECT id, name, overall_score, data_source, category
            FROM ai_models 
            WHERE organization = 'OpenAI' AND category != 'image'
            ORDER BY name
        """))
        
        current_models = result.fetchall()
        print(f"\nFound {len(current_models)} OpenAI text models:")
        
        for model in current_models:
            model_id, name, current_score, data_source, category = model
            print(f"  {name:<15} | Current: {current_score or 'NULL':<6} | Source: {data_source or 'NULL'}")
        
        print(f"\nPreparing to update scores...")
        
        # 更新每个模型的分数
        updated_count = 0
        for model_name, new_score in OPENAI_SCORES.items():
            
            # 查找模型 (尝试name字段匹配)
            result = session.execute(text("""
                SELECT id, name, overall_score 
                FROM ai_models 
                WHERE (name = :model_name OR name LIKE :model_pattern) 
                AND organization = 'OpenAI' 
                AND category != 'image'
                LIMIT 1
            """), {
                'model_name': model_name,
                'model_pattern': f'%{model_name}%'
            })
            
            model = result.fetchone()
            
            if model:
                model_id, db_name, current_score = model
                
                # 更新分数和数据源
                session.execute(text("""
                    UPDATE ai_models 
                    SET overall_score = :score,
                        data_source = 'benchmark',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :model_id
                """), {
                    'score': new_score,
                    'model_id': model_id
                })
                
                print(f"  [OK] {db_name:<15} | {current_score or 'NULL':<6} -> {new_score:.3f}")
                updated_count += 1
            else:
                print(f"  [SKIP] {model_name:<15} | Model not found")
        
        # 提交更改
        session.commit()
        print(f"\nSuccessfully updated {updated_count} model scores!")
        
        # 验证更新结果
        print(f"\nUpdated rankings:")
        result = session.execute(text("""
            SELECT name, overall_score, data_source
            FROM ai_models 
            WHERE organization = 'OpenAI' AND category != 'image'
            ORDER BY overall_score DESC NULLS LAST
        """))
        
        models = result.fetchall()
        for i, (name, score, data_source) in enumerate(models, 1):
            score_str = f"{score:.3f}" if score else "N/A"
            print(f"  {i:2}. {name:<15} | Score: {score_str} | Source: {data_source}")
            
    except Exception as e:
        print(f"Update failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def verify_ranking():
    """验证新的排名结果"""
    engine = create_engine(str(settings.DATABASE_URL).replace("sqlite+aiosqlite", "sqlite"))
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print(f"\nVerifying platform-wide model rankings (Top 15):")
        result = session.execute(text("""
            SELECT name, organization, overall_score, data_source, category
            FROM ai_models 
            ORDER BY overall_score DESC NULLS LAST
            LIMIT 15
        """))
        
        models = result.fetchall()
        for i, (name, org, score, data_source, category) in enumerate(models, 1):
            score_str = f"{score:.3f}" if score else "N/A"
            print(f"  {i:2}. {name:<20} ({org:<10}) | {score_str} | {data_source or 'N/A':<10} | {category}")
            
    finally:
        session.close()

if __name__ == "__main__":
    print("OpenAI Model Score Update Tool")
    print("=" * 50)
    
    update_scores()
    verify_ranking()
    
    print("\nUpdate completed! Database synced with latest benchmark results.")