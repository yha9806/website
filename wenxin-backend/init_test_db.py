#!/usr/bin/env python3
"""
Initialize test database with required data for E2E tests
This includes test users and AI models
"""

import asyncio
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, AIModel
from app.core.security import get_password_hash
import json
from datetime import datetime
import uuid

# Use test database
TEST_DATABASE_URL = "sqlite:///./test.db"

def init_test_database():
    """Initialize test database with schema and test data"""
    
    # Remove existing test database if it exists
    if os.path.exists("test.db"):
        os.remove("test.db")
        print("Removed existing test database")
    
    # Create engine and tables
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create test users
        test_users = [
            {
                "username": "demo",
                "email": "demo@test.com",
                "full_name": "Demo User",
                "hashed_password": get_password_hash("demo123"),
                "is_active": True,
                "is_superuser": False
            },
            {
                "username": "admin",
                "email": "admin@test.com", 
                "full_name": "Admin User",
                "hashed_password": get_password_hash("admin123"),
                "is_active": True,
                "is_superuser": True
            },
            {
                "username": "test",
                "email": "test@test.com",
                "full_name": "Test User",
                "hashed_password": get_password_hash("test123"),
                "is_active": True,
                "is_superuser": False
            }
        ]
        
        for user_data in test_users:
            user = User(**user_data)
            db.add(user)
        
        print(f"Created {len(test_users)} test users")
        
        # Create test AI models
        test_models = [
            {
                "id": str(uuid.uuid4()),
                "name": "GPT-4o",
                "organization": "OpenAI",
                "version": "4.0",
                "category": "multimodal",
                "description": "Test model for E2E testing",
                "overall_score": 94.2,
                "metrics": json.dumps({
                    "rhythm": 92,
                    "composition": 95,
                    "narrative": 96,
                    "emotion": 93,
                    "creativity": 95,
                    "cultural": 91
                }),
                "tags": json.dumps(["Test", "E2E", "Multimodal"]),
                "avatar_url": "https://picsum.photos/seed/gpt4o/200/200",
                "is_active": True,
                "is_verified": False,
                "data_source": "test"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Claude 3.5 Sonnet",
                "organization": "Anthropic",
                "version": "3.5",
                "category": "text",
                "description": "Test model for E2E testing",
                "overall_score": 93.8,
                "metrics": json.dumps({
                    "rhythm": 91,
                    "composition": 94,
                    "narrative": 96,
                    "emotion": 94,
                    "creativity": 95,
                    "cultural": 90
                }),
                "tags": json.dumps(["Test", "E2E", "Text"]),
                "avatar_url": "https://picsum.photos/seed/claude35/200/200",
                "is_active": True,
                "is_verified": False,
                "data_source": "test"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "DALL-E 3",
                "organization": "OpenAI",
                "version": "3.0",
                "category": "image",
                "description": "Test image model for E2E testing",
                "overall_score": None,  # Image models have no overall score
                "metrics": json.dumps({
                    "rhythm": 0,
                    "composition": 95,
                    "narrative": 85,
                    "emotion": 90,
                    "creativity": 96,
                    "cultural": 86
                }),
                "tags": json.dumps(["Test", "E2E", "Image"]),
                "avatar_url": "https://picsum.photos/seed/dalle3/200/200",
                "is_active": True,
                "is_verified": False,
                "data_source": "test"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Gemini Pro",
                "organization": "Google",
                "version": "1.0",
                "category": "text",
                "description": "Test model for E2E testing",
                "overall_score": 88.9,
                "metrics": json.dumps({
                    "rhythm": 85,
                    "composition": 89,
                    "narrative": 90,
                    "emotion": 88,
                    "creativity": 90,
                    "cultural": 85
                }),
                "tags": json.dumps(["Test", "E2E", "Text"]),
                "avatar_url": "https://picsum.photos/seed/gemini/200/200",
                "is_active": True,
                "is_verified": False,
                "data_source": "test"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Llama 3.1",
                "organization": "Meta",
                "version": "3.1",
                "category": "text",
                "description": "Test model for E2E testing",
                "overall_score": 93.1,
                "metrics": json.dumps({
                    "rhythm": 89,
                    "composition": 92,
                    "narrative": 94,
                    "emotion": 91,
                    "creativity": 93,
                    "cultural": 87
                }),
                "tags": json.dumps(["Test", "E2E", "Open Source"]),
                "avatar_url": "https://picsum.photos/seed/llama/200/200",
                "is_active": True,
                "is_verified": False,
                "data_source": "test"
            }
        ]
        
        for model_data in test_models:
            model = AIModel(**model_data)
            db.add(model)
        
        print(f"Created {len(test_models)} test AI models")
        
        # Commit all changes
        db.commit()
        print("✅ Test database initialized successfully")
        
        # Verify data
        user_count = db.query(User).count()
        model_count = db.query(AIModel).count()
        print(f"Database contains: {user_count} users, {model_count} AI models")
        
    except Exception as e:
        print(f"❌ Error initializing test database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_test_database()