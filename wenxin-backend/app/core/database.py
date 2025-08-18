import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
from .config import settings

# Determine database URL based on environment
def get_database_url():
    """Get database URL based on environment"""
    # In production, use environment variable if set
    env_database_url = os.getenv("DATABASE_URL")
    if env_database_url:
        print(f"Using DATABASE_URL from environment: {env_database_url[:30]}...")
        return env_database_url
    
    # Check if we're using Cloud SQL
    if settings.USE_CLOUD_SQL or os.getenv("USE_CLOUD_SQL") == "true":
        # Build Cloud SQL connection string
        cloud_sql_instance = os.getenv("CLOUD_SQL_INSTANCE", settings.CLOUD_SQL_INSTANCE)
        db_user = os.getenv("POSTGRES_USER", settings.POSTGRES_USER)
        db_pass = os.getenv("DB_PASSWORD", settings.POSTGRES_PASSWORD)
        db_name = os.getenv("POSTGRES_DB", settings.POSTGRES_DB)
        
        if cloud_sql_instance:
            # Use Unix socket for Cloud SQL
            db_url = f"postgresql+asyncpg://{db_user}:{db_pass}@/{db_name}?host=/cloudsql/{cloud_sql_instance}"
            print(f"Using Cloud SQL connection: {cloud_sql_instance}")
            return db_url
        else:
            # Fall back to TCP connection
            db_host = os.getenv("POSTGRES_HOST", settings.POSTGRES_HOST)
            db_port = os.getenv("POSTGRES_PORT", str(settings.POSTGRES_PORT))
            db_url = f"postgresql+asyncpg://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
            print(f"Using PostgreSQL TCP connection: {db_host}:{db_port}")
            return db_url
    
    # Default to settings DATABASE_URL (SQLite for development)
    print(f"Using default DATABASE_URL from settings: {settings.DATABASE_URL}")
    return settings.DATABASE_URL

# Get the actual database URL
database_url = get_database_url()

# Create async engine with appropriate settings
if database_url.startswith("sqlite"):
    # SQLite specific settings
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL settings
    connect_args = {}
    
    # Add SSL configuration for Cloud SQL if needed
    if os.getenv("USE_CLOUD_SQL") == "true" and "/cloudsql/" not in database_url:
        connect_args["ssl"] = "require"
    
    engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        future=True,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        connect_args=connect_args if connect_args else None,
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