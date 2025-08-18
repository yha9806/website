#!/usr/bin/env python3
"""
Database migration script for production deployment.
Runs Alembic migrations safely with proper error handling.
"""
import os
import sys
import subprocess
import asyncio
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_database_connection():
    """Check if database is accessible before running migrations."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        return False
    
    try:
        # Convert asyncpg URL to sync for connection test
        sync_url = database_url.replace('postgresql+asyncpg://', 'postgresql://')
        engine = create_engine(sync_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
    except SQLAlchemyError as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error testing database: {e}")
        return False

def run_migrations():
    """Run Alembic migrations with proper error handling."""
    logger.info("🔄 Starting Alembic migrations...")
    
    try:
        # Run alembic upgrade head
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            check=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        logger.info("✅ Migrations completed successfully")
        logger.info(f"Migration output: {result.stdout}")
        return True
        
    except subprocess.TimeoutExpired:
        logger.error("❌ Migration timeout - took longer than 5 minutes")
        return False
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Migration failed with exit code {e.returncode}")
        logger.error(f"STDOUT: {e.stdout}")
        logger.error(f"STDERR: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during migration: {e}")
        return False

def main():
    """Main migration function."""
    logger.info("🚀 Starting database migration process...")
    
    # Check database connection first
    if not check_database_connection():
        logger.error("❌ Cannot connect to database - aborting migrations")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        logger.error("❌ Migration failed - check logs above")
        sys.exit(1)
    
    logger.info("🎉 All migrations completed successfully!")

if __name__ == '__main__':
    main()