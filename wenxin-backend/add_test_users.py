#!/usr/bin/env python3
"""
Add test users to the main wenxin.db database
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User
from app.core.security import get_password_hash

# Use main database
DATABASE_URL = "sqlite:///./wenxin.db"

def add_test_users():
    """Add test users to wenxin.db"""
    
    # Create engine
    engine = create_engine(DATABASE_URL, echo=False)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if demo user already exists
        existing_demo = db.query(User).filter(User.username == "demo").first()
        if not existing_demo:
            # Create demo user
            demo_user = User(
                username="demo",
                email="demo@test.com",
                full_name="Demo User",
                hashed_password=get_password_hash("demo123"),
                is_active=True,
                is_superuser=False
            )
            db.add(demo_user)
            print("Created demo user")
        else:
            print("Demo user already exists")
            
        # Check if test user already exists
        existing_test = db.query(User).filter(User.username == "test").first()
        if not existing_test:
            # Create test user
            test_user = User(
                username="test",
                email="test@test.com",
                full_name="Test User",
                hashed_password=get_password_hash("test123"),
                is_active=True,
                is_superuser=False
            )
            db.add(test_user)
            print("Created test user")
        else:
            print("Test user already exists")
        
        # Commit changes
        db.commit()
        print("Test users added successfully")
        
        # List all users
        all_users = db.query(User).all()
        print(f"Total users in database: {len(all_users)}")
        for user in all_users:
            print(f"  - {user.username} (admin: {user.is_superuser})")
        
    except Exception as e:
        print(f"Error adding test users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_users()