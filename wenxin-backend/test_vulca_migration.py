"""
Test script for VULCA data migration
"""

import asyncio
import logging
from app.core.database import AsyncSessionLocal
from app.services.vulca_migration_service import VULCAMigrationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_migration():
    """Test the VULCA migration process"""
    async with AsyncSessionLocal() as db:
        try:
            service = VULCAMigrationService(db)
            
            # 1. First check current state
            logger.info("=== Checking initial state ===")
            initial_report = await service.verify_migration()
            logger.info(f"Initial state: {initial_report}")
            
            # 2. Run migration
            logger.info("\n=== Running migration ===")
            migration_result = await service.migrate_vulca_data()
            logger.info(f"Migration result: {migration_result}")
            
            # 3. Verify migration
            logger.info("\n=== Verifying migration ===")
            final_report = await service.verify_migration()
            logger.info(f"Final state: {final_report}")
            
            # 4. Test single model query
            logger.info("\n=== Testing model query ===")
            from sqlalchemy import select
            from app.models.ai_model import AIModel
            
            result = await db.execute(
                select(AIModel).limit(1)
            )
            model = result.scalar_one_or_none()
            
            if model:
                logger.info(f"Sample model: {model.name}")
                logger.info(f"  - VULCA 47D scores: {'Yes' if model.vulca_scores_47d else 'No'}")
                logger.info(f"  - Cultural perspectives: {'Yes' if model.vulca_cultural_perspectives else 'No'}")
                logger.info(f"  - Sync status: {model.vulca_sync_status}")
                logger.info(f"  - Evaluation date: {model.vulca_evaluation_date}")
            
            return migration_result
            
        except Exception as e:
            logger.error(f"Test failed: {str(e)}")
            raise


async def test_rollback():
    """Test the rollback functionality"""
    async with AsyncSessionLocal() as db:
        try:
            service = VULCAMigrationService(db)
            
            logger.info("=== Testing rollback ===")
            success = await service.rollback_migration()
            
            if success:
                logger.info("Rollback successful")
                
                # Verify rollback
                report = await service.verify_migration()
                logger.info(f"After rollback: {report}")
            else:
                logger.error("Rollback failed")
                
        except Exception as e:
            logger.error(f"Rollback test failed: {str(e)}")
            raise


if __name__ == "__main__":
    # Test migration
    asyncio.run(test_migration())
    
    # Uncomment to test rollback
    # asyncio.run(test_rollback())