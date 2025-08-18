#!/usr/bin/env python3
"""
Create an admin user for testing
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.models.user import User
from app.core.security import get_password_hash


async def create_admin():
    """Create an admin user"""
    engine = create_async_engine("sqlite+aiosqlite:///wenxin.db")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            # Update to ensure it's a superuser
            existing_admin.is_superuser = True
            existing_admin.is_active = True
            existing_admin.hashed_password = get_password_hash("admin123")
            await session.commit()
            print("Admin user updated successfully!")
            print("Username: admin")
            print("Password: admin123")
        else:
            # Create new admin user
            admin = User(
                username="admin",
                email="admin@wenxin.com",
                full_name="Administrator",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True
            )
            session.add(admin)
            await session.commit()
            print("Admin user created successfully!")
            print("Username: admin")
            print("Password: admin123")
        
        # Also ensure demo user exists but is not admin
        result = await session.execute(
            select(User).where(User.username == "demo")
        )
        demo_user = result.scalar_one_or_none()
        
        if not demo_user:
            demo = User(
                username="demo",
                email="demo@wenxin.com",
                full_name="Demo User",
                hashed_password=get_password_hash("demo123"),
                is_active=True,
                is_superuser=False
            )
            session.add(demo)
            await session.commit()
            print("\nDemo user also created:")
            print("Username: demo")
            print("Password: demo123")
            print("(Note: demo user does not have admin privileges)")


if __name__ == "__main__":
    asyncio.run(create_admin())