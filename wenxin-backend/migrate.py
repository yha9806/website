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

def get_current_revision():
    """Get current Alembic revision from database."""
    try:
        result = subprocess.run(
            ['alembic', 'current'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            current = result.stdout.strip()
            logger.info(f"Current revision: {current}")
            return current
        else:
            logger.warning(f"Could not get current revision: {result.stderr}")
            return None
    except Exception as e:
        logger.warning(f"Failed to get current revision: {e}")
        return None

def force_schema_sync():
    """Force database schema synchronization by running migrations from base."""
    logger.info("🔄 Force syncing database schema...")
    
    try:
        # First, drop the alembic_version table to start fresh
        logger.info("📍 Clearing Alembic version table...")
        result = subprocess.run(
            ['alembic', 'stamp', 'base'],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            logger.warning(f"Could not stamp base (table might not exist): {result.stderr}")
        
        # Now run all migrations from the beginning
        logger.info("🚀 Running all migrations from base...")
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            logger.info("✅ Schema sync completed successfully")
            logger.info(f"Migration output: {result.stdout}")
            return True
        else:
            logger.error(f"❌ Schema sync failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed to sync schema: {e}")
        return False

def reset_alembic_state():
    """Reset Alembic state by stamping current head revision - DEPRECATED."""
    logger.warning("⚠️  Using deprecated stamp method - prefer force_schema_sync")
    
    try:
        # Get the head revision
        result = subprocess.run(
            ['alembic', 'heads'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            logger.error(f"Failed to get head revision: {result.stderr}")
            return False
            
        head_revision = result.stdout.strip().split()[0]
        logger.info(f"Head revision: {head_revision}")
        
        # Stamp the database with the head revision
        result = subprocess.run(
            ['alembic', 'stamp', head_revision],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            logger.info("✅ Alembic state reset successfully")
            return True
        else:
            logger.error(f"❌ Failed to stamp revision: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed to reset Alembic state: {e}")
        return False

def run_migrations():
    """Run Alembic migrations with proper error handling and transaction recovery."""
    logger.info("🔄 Starting Alembic migrations...")
    
    # First, try to get current revision
    current_revision = get_current_revision()
    
    try:
        # Try normal migration first
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            logger.info("✅ Migrations completed successfully")
            logger.info(f"Migration output: {result.stdout}")
            return True
        else:
            logger.warning("⚠️ Migration failed, attempting recovery...")
            logger.warning(f"STDERR: {result.stderr}")
            
            # If migration failed due to transaction issues or schema mismatch, force sync
            if ("InFailedSqlTransaction" in result.stderr or 
                "transaction is aborted" in result.stderr or
                "does not exist" in result.stderr or
                "UndefinedColumnError" in result.stderr):
                logger.info("🔄 Schema/transaction error detected, forcing schema sync...")
                
                if force_schema_sync():
                    logger.info("✅ Migration completed successfully after schema sync")
                    return True
                else:
                    logger.error("❌ Failed to sync schema")
                    return False
            else:
                logger.error(f"❌ Migration failed with unknown error: {result.stderr}")
                return False
        
    except subprocess.TimeoutExpired:
        logger.error("❌ Migration timeout - took longer than 5 minutes")
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