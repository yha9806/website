#!/bin/bash
# Cloud Shell script to import comprehensive_v2.json to production database

echo "============================================================"
echo "WenXin MoYun Production Data Import"
echo "============================================================"

# Set environment
export ENVIRONMENT=production
export DATABASE_URL="postgresql+asyncpg://postgres:Qnqwdn7800@/wenxin?host=/cloudsql/wenxin-moyun-prod-new:asia-east1:wenxin-postgres"

echo "[INFO] Environment: $ENVIRONMENT"
echo "[INFO] Starting data import..."

# Create Python script inline (in case files aren't synced)
cat > /tmp/production_import.py << 'EOF'
#!/usr/bin/env python
"""
Production data import script for WenXin MoYun
Imports comprehensive_v2.json data to production database
"""
import asyncio
import json
import os
import sys
import io
from datetime import datetime, timezone
from pathlib import Path
import uuid

# Set UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa

# Create engine directly
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Define minimal AIModel
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class AIModel(Base):
    __tablename__ = 'ai_models'
    
    id = Column(String, primary_key=True)
    name = Column(String)
    organization = Column(String)
    version = Column(String)
    category = Column(String)
    description = Column(Text)
    overall_score = Column(Float)
    rhythm_score = Column(Float)
    composition_score = Column(Float)
    narrative_score = Column(Float)
    emotion_score = Column(Float)
    creativity_score = Column(Float)
    cultural_score = Column(Float)
    metrics = Column(JSON)
    data_source = Column(String)
    benchmark_score = Column(Float)
    benchmark_metadata = Column(JSON)
    benchmark_responses = Column(JSON)
    scoring_details = Column(JSON)
    score_highlights = Column(JSON)
    score_weaknesses = Column(JSON)
    is_active = Column(Boolean)
    is_verified = Column(Boolean)
    verification_count = Column(Integer)
    confidence_level = Column(Float)
    release_date = Column(String)
    tags = Column(JSON)
    last_benchmark_at = Column(DateTime)


# Import comprehensive_v2.json data
comprehensive_data = {
  "report_date": "2025-08-20T11:10:44.642425",
  "summary": {
    "total_providers": 4,
    "total_models": 28,
    "total_tests": 70,
    "average_score": 82.5
  },
  "global_rankings": [
    {"rank": 1, "model_id": "gpt-5", "display_name": "gpt-5", "provider": "OpenAI", "average_score": 88.5, "tests_completed": 2, "test_coverage": ["code_fibonacci", "poem_moon"], "average_dimensions": {"rhythm": 85.0, "composition": 92.5, "narrative": 77.5, "emotion": 77.5, "creativity": 82.5, "cultural": 92.5}},
    {"rank": 2, "model_id": "o1", "display_name": "o1", "provider": "OpenAI", "average_score": 88.33333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 85.0, "composition": 91.66666666666667, "narrative": 82.33333333333333, "emotion": 77.33333333333333, "creativity": 84.66666666666667, "cultural": 93.33333333333333}},
    {"rank": 3, "model_id": "gpt-4o", "display_name": "gpt-4o", "provider": "OpenAI", "average_score": 87.27666666666666, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 86.66666666666667, "composition": 88.33333333333333, "narrative": 85.0, "emotion": 85.0, "creativity": 85.66666666666667, "cultural": 93.33333333333333}},
    {"rank": 4, "model_id": "gpt-4.5", "display_name": "gpt-4.5", "provider": "OpenAI", "average_score": 86.33333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 88.33333333333333, "narrative": 80.0, "emotion": 76.66666666666667, "creativity": 87.66666666666667, "cultural": 86.66666666666667}},
    {"rank": 5, "model_id": "gpt-4o-mini", "display_name": "gpt-4o-mini", "provider": "OpenAI", "average_score": 86.0, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 88.33333333333333, "narrative": 80.0, "emotion": 78.33333333333333, "creativity": 83.33333333333333, "cultural": 86.66666666666667}},
    {"rank": 6, "model_id": "gpt-4-turbo", "display_name": "gpt-4-turbo", "provider": "OpenAI", "average_score": 86.0, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 88.33333333333333, "narrative": 80.0, "emotion": 76.66666666666667, "creativity": 81.66666666666667, "cultural": 90.0}},
    {"rank": 7, "model_id": "o3-mini", "display_name": "o3-mini", "provider": "OpenAI", "average_score": 85.27666666666666, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 86.66666666666667, "composition": 88.33333333333333, "narrative": 85.0, "emotion": 85.0, "creativity": 85.66666666666667, "cultural": 81.0}},
    {"rank": 8, "model_id": "qwen-plus", "display_name": "Qwen-Plus", "provider": "Qwen", "average_score": 85.0, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 85.0, "composition": 86.66666666666667, "narrative": 81.66666666666667, "emotion": 80.0, "creativity": 85.0, "cultural": 91.66666666666667}},
    {"rank": 9, "model_id": "qwen3-8b", "display_name": "Qwen3-8B", "provider": "Qwen", "average_score": 84.83333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 90.0, "narrative": 79.33333333333333, "emotion": 80.0, "creativity": 84.66666666666667, "cultural": 91.66666666666667}},
    {"rank": 10, "model_id": "gpt-4", "display_name": "gpt-4", "provider": "OpenAI", "average_score": 84.0, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 80.0, "composition": 88.33333333333333, "narrative": 77.66666666666667, "emotion": 74.33333333333333, "creativity": 83.33333333333333, "cultural": 86.66666666666667}},
    {"rank": 11, "model_id": "o1-mini", "display_name": "o1-mini", "provider": "OpenAI", "average_score": 83.61, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 86.66666666666667, "composition": 88.33333333333333, "narrative": 85.0, "emotion": 79.33333333333333, "creativity": 85.66666666666667, "cultural": 80.0}},
    {"rank": 12, "model_id": "qwen3-coder-plus", "display_name": "Qwen3-Coder-Plus", "provider": "Qwen", "average_score": 83.33, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 88.33333333333333, "narrative": 78.33333333333333, "emotion": 76.0, "creativity": 85.66666666666667, "cultural": 91.66666666666667}},
    {"rank": 13, "model_id": "claude-opus-4-0", "display_name": "Claude Opus 4 (alias)", "provider": "Anthropic", "average_score": 82.77666666666666, "tests_completed": 6, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 86.66666666666667, "narrative": 80.0, "emotion": 71.0, "creativity": 87.33333333333333, "cultural": 88.33333333333333}},
    {"rank": 14, "model_id": "qwen3-32b", "display_name": "Qwen3-32B", "provider": "Qwen", "average_score": 82.77666666666666, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 86.66666666666667, "narrative": 80.0, "emotion": 78.66666666666667, "creativity": 86.33333333333333, "cultural": 88.33333333333333}},
    {"rank": 15, "model_id": "claude-opus-4-20250514", "display_name": "Claude Opus 4", "provider": "Anthropic", "average_score": 82.66666666666667, "tests_completed": 6, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 85.0, "narrative": 80.0, "emotion": 71.0, "creativity": 85.0, "cultural": 91.66666666666667}},
    {"rank": 16, "model_id": "claude-sonnet-4-0", "display_name": "Claude Sonnet 4 (alias)", "provider": "Anthropic", "average_score": 82.5, "tests_completed": 6, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 86.66666666666667, "narrative": 80.0, "emotion": 71.0, "creativity": 87.33333333333333, "cultural": 86.66666666666667}},
    {"rank": 17, "model_id": "claude-3-5-haiku-20241022", "display_name": "Claude 3.5 Haiku", "provider": "Anthropic", "average_score": 82.11333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 85.0, "narrative": 80.0, "emotion": 74.33333333333333, "creativity": 81.66666666666667, "cultural": 91.66666666666667}},
    {"rank": 18, "model_id": "qwen-flash", "display_name": "Qwen-Flash", "provider": "Qwen", "average_score": 81.94333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 85.0, "narrative": 78.33333333333333, "emotion": 78.33333333333333, "creativity": 88.33333333333333, "cultural": 88.33333333333333}},
    {"rank": 19, "model_id": "claude-3-5-sonnet-20241022", "display_name": "Claude 3.5 Sonnet", "provider": "Anthropic", "average_score": 80.55333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 83.33333333333333, "composition": 85.0, "narrative": 76.66666666666667, "emotion": 66.66666666666667, "creativity": 79.33333333333333, "cultural": 86.66666666666667}},
    {"rank": 20, "model_id": "claude-sonnet-4-20250514", "display_name": "Claude Sonnet 4", "provider": "Anthropic", "average_score": 80.27666666666666, "tests_completed": 6, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 81.66666666666667, "composition": 85.0, "narrative": 76.66666666666667, "emotion": 71.0, "creativity": 85.66666666666667, "cultural": 88.33333333333333}},
    {"rank": 21, "model_id": "claude-opus-4-1-20250805", "display_name": "Claude Opus 4.1 (2025-08-05)", "provider": "Anthropic", "average_score": 80.27666666666666, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 80.0, "composition": 85.0, "narrative": 76.66666666666667, "emotion": 71.0, "creativity": 87.33333333333333, "cultural": 85.0}},
    {"rank": 22, "model_id": "qwen-max-2025-01-25", "display_name": "Qwen2.5-Max (2025-01-25)", "provider": "Qwen", "average_score": 79.72, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 81.66666666666667, "composition": 85.0, "narrative": 76.66666666666667, "emotion": 71.0, "creativity": 82.33333333333333, "cultural": 88.33333333333333}},
    {"rank": 23, "model_id": "claude-3-haiku-20240307", "display_name": "Claude 3 Haiku", "provider": "Anthropic", "average_score": 78.94333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 78.33333333333333, "composition": 85.0, "narrative": 73.33333333333333, "emotion": 66.66666666666667, "creativity": 82.33333333333333, "cultural": 90.0}},
    {"rank": 24, "model_id": "claude-3-opus-20240229", "display_name": "Claude 3 Opus", "provider": "Anthropic", "average_score": 78.5, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 80.0, "composition": 83.33333333333333, "narrative": 73.33333333333333, "emotion": 66.66666666666667, "creativity": 81.66666666666667, "cultural": 88.33333333333333}},
    {"rank": 25, "model_id": "deepseek-v3", "display_name": "deepseek-v3", "provider": "DeepSeek", "average_score": 76.94333333333333, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 81.66666666666667, "composition": 81.66666666666667, "narrative": 76.66666666666667, "emotion": 71.66666666666667, "creativity": 82.66666666666667, "cultural": 84.0}},
    {"rank": 26, "model_id": "gpt-3.5-turbo", "display_name": "gpt-3.5-turbo", "provider": "OpenAI", "average_score": 76.0, "tests_completed": 3, "test_coverage": ["code_fibonacci", "poem_moon", "story_robot"], "average_dimensions": {"rhythm": 73.33333333333333, "composition": 81.66666666666667, "narrative": 71.66666666666667, "emotion": 65.0, "creativity": 76.66666666666667, "cultural": 81.66666666666667}},
    {"rank": 27, "model_id": "deepseek-r1", "display_name": "deepseek-r1", "provider": "DeepSeek", "average_score": 0.0, "tests_completed": 0, "test_coverage": [], "average_dimensions": {"rhythm": 0, "composition": 0, "narrative": 0, "emotion": 0, "creativity": 0, "cultural": 0}},
    {"rank": 28, "model_id": "deepseek-r1-distill", "display_name": "deepseek-r1-distill", "provider": "DeepSeek", "average_score": 0.0, "tests_completed": 0, "test_coverage": [], "average_dimensions": {"rhythm": 0, "composition": 0, "narrative": 0, "emotion": 0, "creativity": 0, "cultural": 0}}
  ]
}

# Simple highlights data
highlights_data = {
    "openai": ["Strong emotional expression", "Well-structured code", "Creative imagery", "Engaging narrative"],
    "anthropic": ["Clear and concise examples", "Strong metaphorical language", "Well-structured stanzas"],
    "deepseek": ["Strong imagery and descriptions", "Engaging exploration", "Clear documentation"],
    "qwen": ["Strong rhythmic flow", "Creative premise", "Well-documented functions"]
}

weaknesses_data = {
    "openai": ["Lacks emotional engagement in some areas", "Narrative could be more developed"],
    "anthropic": ["Limited emotional depth", "Narrative could be more specific"],
    "deepseek": ["Emotional depth could be enhanced", "Lacks storytelling elements"],
    "qwen": ["Limited emotional engagement", "Ending feels abrupt"]
}

async def import_data():
    """Import comprehensive data to production database"""
    print("="*60)
    print("PRODUCTION DATA IMPORT")
    print("="*60)
    
    async with AsyncSessionLocal() as session:
        # Clean existing data
        print("\nPhase 1: Cleaning database...")
        result = await session.execute(select(func.count(AIModel.id)))
        count = result.scalar()
        print(f"Found {count} existing models")
        
        if count > 0:
            await session.execute(delete(AIModel))
            await session.commit()
            print(f"Deleted {count} models")
        
        # Import new data
        print("\nPhase 2: Importing models...")
        imported = 0
        
        for model_info in comprehensive_data['global_rankings']:
            if model_info.get('average_score', 0) == 0:
                continue  # Skip models with 0 score
                
            provider = model_info['provider'].lower()
            
            model = AIModel(
                id=str(uuid.uuid4()),
                name=model_info['display_name'],
                organization=model_info['provider'],
                version='1.0',
                category='text',
                description=f"{model_info['provider']} {model_info['display_name']} - Advanced AI Model",
                overall_score=model_info['average_score'],
                rhythm_score=model_info['average_dimensions']['rhythm'],
                composition_score=model_info['average_dimensions']['composition'],
                narrative_score=model_info['average_dimensions']['narrative'],
                emotion_score=model_info['average_dimensions']['emotion'],
                creativity_score=model_info['average_dimensions']['creativity'],
                cultural_score=model_info['average_dimensions']['cultural'],
                metrics=model_info['average_dimensions'],
                data_source='benchmark',
                benchmark_score=model_info['average_score'],
                benchmark_metadata={
                    'rank': model_info['rank'],
                    'tests_completed': model_info['tests_completed'],
                    'test_coverage': model_info['test_coverage']
                },
                benchmark_responses={},  # Would need actual response data
                scoring_details={
                    'dimensions': model_info['average_dimensions'],
                    'total_score': model_info['average_score']
                },
                score_highlights=highlights_data.get(provider, [])[:5],
                score_weaknesses=weaknesses_data.get(provider, [])[:3],
                is_active=True,
                is_verified=True,
                verification_count=model_info['tests_completed'],
                confidence_level=0.95 if model_info['tests_completed'] >= 3 else 0.7,
                release_date='2024-01',
                tags=[provider, 'benchmark', 'tested'],
                last_benchmark_at=datetime.now(timezone.utc)
            )
            
            session.add(model)
            imported += 1
            print(f"  [{imported}] {model.name}: {model.overall_score:.1f}")
            
            if imported % 5 == 0:
                await session.commit()
        
        await session.commit()
        
        # Verify
        print(f"\nPhase 3: Verification")
        result = await session.execute(select(func.count(AIModel.id)))
        final_count = result.scalar()
        print(f"Total models in database: {final_count}")
        
        print("\n" + "="*60)
        print(f"✅ IMPORT COMPLETED!")
        print(f"   Imported {imported} models")
        print("="*60)

# Run import
asyncio.run(import_data())
EOF

# Run the import script
python3 /tmp/production_import.py

echo ""
echo "============================================================"
echo "Import completed! Please verify at:"
echo "https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/"
echo "============================================================"