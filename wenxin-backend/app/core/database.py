from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
from .config import settings

# Create async engine with SQLite support
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite specific settings
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL settings
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        future=True,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables and data"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Import here to avoid circular imports
    from app.models import AIModel
    from sqlalchemy import select
    
    # Check if data already exists
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AIModel).limit(1))
        existing_models = result.scalars().first()
        
        if not existing_models:
            print("No models found in database, initializing with seed data...")
            from app.core.seed_data import seed_database
            await seed_database(session)
            print("Database initialized successfully!")