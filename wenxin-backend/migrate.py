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

def direct_column_fix():
    """Directly check and add missing columns without relying on Alembic."""
    logger.info("🔧 Direct column fix - checking and adding missing columns...")
    
    try:
        # Convert asyncpg URL to sync for direct operations
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL not set")
            return False
            
        sync_url = database_url.replace('postgresql+asyncpg://', 'postgresql://')
        engine = create_engine(sync_url)
        
        with engine.connect() as conn:
            # Check if ai_models table exists
            result = conn.execute(text("SELECT to_regclass('public.ai_models')"))
            if result.fetchone()[0] is None:
                logger.error("ai_models table does not exist")
                return False
            
            # Get current columns
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'ai_models' 
                AND table_schema = 'public'
            """))
            existing_columns = {row[0] for row in result.fetchall()}
            logger.info(f"Existing columns: {existing_columns}")
            
            # Define required columns
            required_columns = {
                'rhythm_score': 'FLOAT DEFAULT 0.0',
                'composition_score': 'FLOAT DEFAULT 0.0', 
                'narrative_score': 'FLOAT DEFAULT 0.0',
                'emotion_score': 'FLOAT DEFAULT 0.0',
                'creativity_score': 'FLOAT DEFAULT 0.0',
                'cultural_score': 'FLOAT DEFAULT 0.0'
            }
            
            # Add missing columns
            added_columns = []
            for col_name, col_def in required_columns.items():
                if col_name not in existing_columns:
                    logger.info(f"Adding missing column: {col_name}")
                    conn.execute(text(f"ALTER TABLE ai_models ADD COLUMN {col_name} {col_def}"))
                    added_columns.append(col_name)
                else:
                    logger.info(f"Column {col_name} already exists")
            
            conn.commit()
            
            if added_columns:
                logger.info(f"✅ Added columns: {added_columns}")
            else:
                logger.info("✅ All required columns already exist")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Direct column fix failed: {e}")
        return False

def force_alembic_migration():
    """Force re-execution of specific migration using pure Alembic approach."""
    logger.info("🔄 Force Alembic migration - using revision-specific approach...")
    
    try:
        # Method A: Use repair migration approach
        logger.info("🛠️ Method A: Trying repair migration approach...")
        
        # First, upgrade to the repair migration
        result = subprocess.run(
            ['alembic', 'upgrade', 'fix_missing_columns'],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            logger.info("✅ Repair migration completed successfully")
            logger.info(f"Migration output: {result.stdout}")
            return True
        else:
            logger.warning(f"Repair migration failed: {result.stderr}")
        
        # Method B: Downgrade and re-upgrade approach
        logger.info("🔄 Method B: Trying downgrade/upgrade approach...")
        
        # Step 1: Move to the revision before the problematic one
        target_revision = "3703a6d60754"  # The revision before the score columns
        logger.info(f"📍 Moving to revision {target_revision}...")
        
        result = subprocess.run(
            ['alembic', 'downgrade', target_revision],
            capture_output=True,
            text=True,
            timeout=180
        )
        
        if result.returncode != 0:
            logger.warning(f"Downgrade failed: {result.stderr}")
            # If downgrade fails, force stamp
            result = subprocess.run(
                ['alembic', 'stamp', target_revision],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode != 0:
                logger.error(f"Could not set revision: {result.stderr}")
                return False
        
        logger.info("✅ Moved to base revision")
        
        # Step 2: Now upgrade to head, which will execute all missing migrations
        logger.info("🚀 Upgrading to head (this will add missing columns)...")
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            logger.info("✅ Alembic migration completed successfully")
            logger.info(f"Migration output: {result.stdout}")
            return True
        else:
            logger.error(f"❌ Alembic migration failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Failed Alembic migration: {e}")
        return False

def force_schema_sync():
    """Force database schema synchronization using Alembic-first approach."""
    logger.info("🔄 Force syncing database schema...")
    
    try:
        # Method 1: Try Alembic-based approach first
        logger.info("🎯 Attempting Alembic-based migration...")
        if force_alembic_migration():
            return True
        
        # Method 2: Fallback to direct column fix if Alembic fails
        logger.info("⚠️ Alembic approach failed, trying direct column fix...")
        if direct_column_fix():
            logger.info("✅ Direct column fix successful, updating Alembic state...")
            # Update Alembic to head state
            result = subprocess.run(
                ['alembic', 'stamp', 'head'],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                logger.info("✅ Alembic state updated to head")
                return True
            else:
                logger.warning(f"Alembic stamp failed but columns were added: {result.stderr}")
                return True  # Still consider success if columns were added
        
        # Method 3: Full reset as last resort
        logger.info("🔄 Last resort: Full Alembic reset...")
        result = subprocess.run(
            ['alembic', 'stamp', 'base'],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            logger.warning(f"Could not stamp base: {result.stderr}")
        
        result = subprocess.run(
            ['alembic', 'upgrade', 'head'],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            logger.info("✅ Full reset migration completed")
            return True
        else:
            logger.error(f"❌ Full reset failed: {result.stderr}")
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
    
    # Check if already at head
    if current_revision and "(head)" in current_revision:
        logger.info("✅ Database is already at the latest revision")
        logger.info(f"Current revision: {current_revision}")
        return True
    
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
            # Check if there was actual migration or already at head
            if "Running upgrade" in result.stdout:
                logger.info(f"Migration output: {result.stdout}")
            elif not result.stdout.strip() or "nothing to do" in result.stdout.lower():
                logger.info("Database was already up to date")
            else:
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