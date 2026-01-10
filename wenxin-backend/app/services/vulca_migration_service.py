"""
VULCA Migration Service
Handles migration of VULCA evaluation data to ai_models table
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models.ai_model import AIModel
from app.vulca.models.vulca_model import VULCAEvaluation

logger = logging.getLogger(__name__)


class VULCAMigrationService:
    """Service for migrating VULCA data to unified model"""
    
    def __init__(self, db: AsyncSession):
        """Initialize migration service
        
        Args:
            db: Database session
        """
        self.db = db
        
    async def migrate_vulca_data(self, batch_size: int = 10) -> Dict[str, Any]:
        """Migrate VULCA evaluations to ai_models table
        
        Args:
            batch_size: Number of records to process at once
            
        Returns:
            Migration summary with success/failure counts
        """
        logger.info("Starting VULCA data migration")
        
        summary = {
            "total_evaluations": 0,
            "successful": 0,
            "failed": 0,
            "errors": [],
            "migrated_models": []
        }
        
        try:
            # Get all VULCA evaluations
            result = await self.db.execute(
                select(VULCAEvaluation).order_by(VULCAEvaluation.evaluation_date.desc())
            )
            evaluations = result.scalars().all()
            summary["total_evaluations"] = len(evaluations)
            
            # Group evaluations by model_id (keep latest only)
            latest_evaluations = {}
            for eval in evaluations:
                if eval.model_id not in latest_evaluations:
                    latest_evaluations[eval.model_id] = eval
            
            # Process each model
            for model_id, evaluation in latest_evaluations.items():
                try:
                    # Find corresponding AI model
                    result = await self.db.execute(
                        select(AIModel).where(AIModel.id == str(model_id))
                    )
                    ai_model = result.scalar_one_or_none()
                    
                    if not ai_model:
                        logger.warning(f"AI model not found for ID: {model_id}")
                        summary["failed"] += 1
                        summary["errors"].append(f"Model {model_id} not found")
                        continue
                    
                    # Update AI model with VULCA data
                    ai_model.vulca_scores_47d = evaluation.extended_47d_scores
                    ai_model.vulca_cultural_perspectives = evaluation.cultural_perspectives
                    ai_model.vulca_evaluation_date = evaluation.evaluation_date
                    ai_model.vulca_sync_status = "completed"
                    
                    # Also update overall score if VULCA has better data
                    if evaluation.original_6d_scores:
                        # Calculate average of 6D scores as new overall score
                        scores = list(evaluation.original_6d_scores.values())
                        new_overall = sum(scores) / len(scores) if scores else 0
                        
                        # Only update if VULCA score is higher quality
                        if ai_model.overall_score == 0 or ai_model.data_source == "mock":
                            ai_model.overall_score = new_overall
                            ai_model.data_source = "vulca"
                    
                    summary["successful"] += 1
                    summary["migrated_models"].append({
                        "id": str(model_id),
                        "name": ai_model.name,
                        "vulca_date": evaluation.evaluation_date.isoformat() if evaluation.evaluation_date else None
                    })
                    
                    logger.info(f"Successfully migrated VULCA data for model: {ai_model.name}")
                    
                except Exception as e:
                    logger.error(f"Error migrating model {model_id}: {str(e)}")
                    summary["failed"] += 1
                    summary["errors"].append(f"Model {model_id}: {str(e)}")
            
            # Commit all changes
            await self.db.commit()
            logger.info(f"Migration completed. Success: {summary['successful']}, Failed: {summary['failed']}")
            
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            await self.db.rollback()
            summary["errors"].append(f"Fatal error: {str(e)}")
            
        return summary
    
    async def sync_single_evaluation(
        self, 
        model_id: int, 
        evaluation: Dict[str, Any]
    ) -> bool:
        """Sync a single VULCA evaluation to ai_models
        
        Args:
            model_id: Model ID to update
            evaluation: VULCA evaluation data
            
        Returns:
            Success status
        """
        try:
            # Find AI model
            result = await self.db.execute(
                select(AIModel).where(AIModel.id == str(model_id))
            )
            ai_model = result.scalar_one_or_none()
            
            if not ai_model:
                logger.error(f"Model {model_id} not found for sync")
                return False
            
            # Update with VULCA data
            ai_model.vulca_scores_47d = evaluation.get("scores_47d")
            ai_model.vulca_cultural_perspectives = evaluation.get("cultural_perspectives")
            ai_model.vulca_evaluation_date = datetime.utcnow()
            ai_model.vulca_sync_status = "completed"
            
            await self.db.commit()
            logger.info(f"Successfully synced VULCA data for model {ai_model.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync model {model_id}: {str(e)}")
            await self.db.rollback()
            return False
    
    async def verify_migration(self) -> Dict[str, Any]:
        """Verify migration integrity
        
        Returns:
            Verification report
        """
        report = {
            "total_models": 0,
            "models_with_vulca": 0,
            "models_without_vulca": 0,
            "sync_status_counts": {},
            "missing_models": []
        }
        
        try:
            # Get all AI models
            result = await self.db.execute(select(AIModel))
            models = result.scalars().all()
            report["total_models"] = len(models)
            
            # Check each model
            for model in models:
                if model.vulca_scores_47d:
                    report["models_with_vulca"] += 1
                else:
                    report["models_without_vulca"] += 1
                    report["missing_models"].append({
                        "id": str(model.id),
                        "name": model.name
                    })
                
                # Count sync statuses
                status = model.vulca_sync_status or "unknown"
                report["sync_status_counts"][status] = report["sync_status_counts"].get(status, 0) + 1
            
            logger.info(f"Verification complete: {report['models_with_vulca']}/{report['total_models']} models have VULCA data")
            
        except Exception as e:
            logger.error(f"Verification failed: {str(e)}")
            report["error"] = str(e)
            
        return report
    
    async def rollback_migration(self) -> bool:
        """Rollback VULCA migration by clearing VULCA fields
        
        Returns:
            Success status
        """
        try:
            logger.warning("Starting VULCA migration rollback")
            
            # Clear VULCA fields from all models
            result = await self.db.execute(
                update(AIModel).values(
                    vulca_scores_47d=None,
                    vulca_cultural_perspectives=None,
                    vulca_evaluation_date=None,
                    vulca_sync_status="pending"
                )
            )
            
            await self.db.commit()
            logger.info(f"Rollback completed. Cleared VULCA data from {result.rowcount} models")
            return True
            
        except Exception as e:
            logger.error(f"Rollback failed: {str(e)}")
            await self.db.rollback()
            return False


async def run_migration(db: AsyncSession) -> Dict[str, Any]:
    """Convenience function to run migration
    
    Args:
        db: Database session
        
    Returns:
        Migration summary
    """
    service = VULCAMigrationService(db)
    return await service.migrate_vulca_data()