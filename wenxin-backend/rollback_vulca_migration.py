#!/usr/bin/env python
"""
Rollback script for VULCA migration
Removes VULCA fields from database and restores to pre-migration state
"""

import sys
import asyncio
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def rollback_database():
    """Rollback database changes"""
    logger.info("Starting VULCA migration rollback")
    
    try:
        # 1. Clear VULCA data from ORM models
        from app.core.database import AsyncSessionLocal
        from app.services.vulca_migration_service import VULCAMigrationService
        
        async with AsyncSessionLocal() as db:
            service = VULCAMigrationService(db)
            success = await service.rollback_migration()
            
            if success:
                logger.info("✓ Successfully cleared VULCA data from models")
            else:
                logger.error("✗ Failed to clear VULCA data")
                return False
        
        # 2. Rollback Alembic migration
        import subprocess
        result = subprocess.run(
            ["python", "-m", "alembic", "downgrade", "-1"],
            cwd="I:/website/wenxin-backend",
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info("✓ Successfully rolled back database schema")
        else:
            logger.error(f"✗ Failed to rollback schema: {result.stderr}")
            return False
            
        # 3. Restore backup if needed
        backup_name = f"wenxin_backup_{datetime.now().strftime('%Y%m%d')}_*.db"
        logger.info(f"Backup files available: {backup_name}")
        logger.info("To restore from backup, run:")
        logger.info("  cp wenxin_backup_YYYYMMDD_HHMMSS.db wenxin.db")
        
        return True
        
    except Exception as e:
        logger.error(f"Rollback failed: {str(e)}")
        return False


def main():
    """Main rollback function"""
    print("=" * 60)
    print("VULCA MIGRATION ROLLBACK SCRIPT")
    print("=" * 60)
    print("\nThis will:")
    print("1. Clear all VULCA data from ai_models table")
    print("2. Remove VULCA columns from database schema")
    print("3. Show available backup files")
    print("\nWARNING: This will permanently remove VULCA integration!")
    
    confirm = input("\nProceed with rollback? (yes/no): ")
    
    if confirm.lower() != "yes":
        print("Rollback cancelled.")
        return
    
    # Run rollback
    success = asyncio.run(rollback_database())
    
    if success:
        print("\n✅ ROLLBACK COMPLETED SUCCESSFULLY")
        print("\nNext steps:")
        print("1. Verify application still works")
        print("2. Remove VULCA fields from ai_model.py")
        print("3. Delete migration files if permanent rollback")
    else:
        print("\n❌ ROLLBACK FAILED - Check logs for details")
        sys.exit(1)


if __name__ == "__main__":
    main()