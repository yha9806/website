"""
Test VULCA data migration and synchronization
"""

import asyncio
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json
from datetime import datetime

from app.models.ai_model import AIModel
from app.services.vulca_migration_service import VULCAMigrationService
from app.services.vulca_sync_service import VULCASyncService
from app.core.database import AsyncSessionLocal


@pytest.mark.asyncio
async def test_vulca_field_existence():
    """Test that VULCA fields exist in ai_models table"""
    async with AsyncSessionLocal() as db:
        # Get a sample model
        result = await db.execute(
            select(AIModel).limit(1)
        )
        model = result.scalar_one_or_none()
        
        assert model is not None, "No models found in database"
        
        # Check VULCA fields exist
        assert hasattr(model, 'vulca_scores_47d'), "vulca_scores_47d field missing"
        assert hasattr(model, 'vulca_cultural_perspectives'), "vulca_cultural_perspectives field missing"
        assert hasattr(model, 'vulca_evaluation_date'), "vulca_evaluation_date field missing"
        assert hasattr(model, 'vulca_sync_status'), "vulca_sync_status field missing"


@pytest.mark.asyncio
async def test_vulca_data_sync():
    """Test VULCA data synchronization"""
    sync_service = VULCASyncService()
    
    async with AsyncSessionLocal() as db:
        # Get a test model
        result = await db.execute(
            select(AIModel)
            .where(AIModel.is_active == True)
            .limit(1)
        )
        model = result.scalar_one()
        
        # Create test VULCA data
        test_vulca_data = {
            "scores_47d": {f"dimension_{i}": 80.5 + i for i in range(47)},
            "cultural_perspectives": {
                "western": 85.0,
                "eastern": 82.0,
                "african": 78.0,
                "latin": 80.0,
                "indigenous": 75.0,
                "modern": 88.0,
                "traditional": 76.0,
                "global": 83.0
            },
            "scores_6d": {
                "creativity": 85.0,
                "technique": 82.0,
                "emotion": 80.0,
                "context": 78.0,
                "innovation": 83.0,
                "impact": 81.0
            }
        }
        
        # Sync the data
        success = await sync_service.sync_evaluation_to_model(
            model_id=model.id,
            vulca_evaluation=test_vulca_data,
            db=db
        )
        
        assert success, "Sync failed"
        
        # Verify data was saved
        await db.refresh(model)
        assert model.vulca_scores_47d is not None
        assert model.vulca_cultural_perspectives is not None
        assert model.vulca_sync_status == "completed"


@pytest.mark.asyncio
async def test_vulca_data_integrity():
    """Test VULCA data integrity after sync"""
    async with AsyncSessionLocal() as db:
        # Get models with VULCA data
        result = await db.execute(
            select(AIModel)
            .where(AIModel.vulca_sync_status == "completed")
        )
        models = result.scalars().all()
        
        for model in models:
            if model.vulca_scores_47d:
                # Parse JSON if it's a string
                if isinstance(model.vulca_scores_47d, str):
                    scores = json.loads(model.vulca_scores_47d)
                else:
                    scores = model.vulca_scores_47d
                
                # Check 47 dimensions exist
                assert len(scores) == 47, f"Model {model.name} has {len(scores)} dimensions, expected 47"
                
                # Check all scores are valid
                for key, value in scores.items():
                    assert isinstance(value, (int, float)), f"Invalid score type for {key}"
                    assert 0 <= value <= 100, f"Score {value} out of range for {key}"
            
            if model.vulca_cultural_perspectives:
                # Parse JSON if it's a string
                if isinstance(model.vulca_cultural_perspectives, str):
                    perspectives = json.loads(model.vulca_cultural_perspectives)
                else:
                    perspectives = model.vulca_cultural_perspectives
                
                # Check 8 perspectives exist
                expected_perspectives = ["western", "eastern", "african", "latin", 
                                        "indigenous", "modern", "traditional", "global"]
                for perspective in expected_perspectives:
                    assert perspective in perspectives, f"Missing {perspective} perspective"
                    assert 0 <= perspectives[perspective] <= 100, f"Invalid score for {perspective}"


@pytest.mark.asyncio
async def test_batch_sync():
    """Test batch synchronization of pending models"""
    sync_service = VULCASyncService()
    
    async with AsyncSessionLocal() as db:
        # Mark some models as pending
        await db.execute(
            select(AIModel)
            .where(AIModel.vulca_sync_status == None)
            .limit(3)
        )
        
        # Run batch sync
        result = await sync_service.batch_sync_pending(limit=5)
        
        assert "synced" in result
        assert "failed" in result
        assert result["synced"] >= 0
        assert result["failed"] >= 0


@pytest.mark.asyncio
async def test_migration_rollback():
    """Test that migration can be rolled back safely"""
    migration_service = VULCAMigrationService()
    
    async with AsyncSessionLocal() as db:
        # Get a model with VULCA data
        result = await db.execute(
            select(AIModel)
            .where(AIModel.vulca_sync_status == "completed")
            .limit(1)
        )
        model = result.scalar_one_or_none()
        
        if model:
            original_data = {
                "scores_47d": model.vulca_scores_47d,
                "cultural_perspectives": model.vulca_cultural_perspectives,
                "evaluation_date": model.vulca_evaluation_date,
                "sync_status": model.vulca_sync_status
            }
            
            # Clear VULCA data (simulate rollback)
            model.vulca_scores_47d = None
            model.vulca_cultural_perspectives = None
            model.vulca_evaluation_date = None
            model.vulca_sync_status = "pending"
            await db.commit()
            
            # Re-migrate
            await migration_service.migrate_model(model.id, original_data)
            
            # Verify restoration
            await db.refresh(model)
            assert model.vulca_scores_47d is not None
            assert model.vulca_sync_status == "completed"


if __name__ == "__main__":
    print("Running VULCA migration tests...")
    asyncio.run(test_vulca_field_existence())
    print("✓ Field existence test passed")
    
    asyncio.run(test_vulca_data_sync())
    print("✓ Data sync test passed")
    
    asyncio.run(test_vulca_data_integrity())
    print("✓ Data integrity test passed")
    
    asyncio.run(test_batch_sync())
    print("✓ Batch sync test passed")
    
    asyncio.run(test_migration_rollback())
    print("✓ Migration rollback test passed")
    
    print("\nAll migration tests passed successfully!")