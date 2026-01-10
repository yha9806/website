"""
VULCA Sync Service
Handles real-time and batch synchronization between VULCA evaluations and ai_models
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_model import AIModel
from app.vulca.models.vulca_model import VULCAEvaluation
from app.core.database import AsyncSessionLocal
from app.services.cache_invalidation import cache_invalidator

logger = logging.getLogger(__name__)


class VULCASyncService:
    """Service for synchronizing VULCA evaluations with AI models"""
    
    def __init__(self, db: Optional[AsyncSession] = None):
        """Initialize sync service
        
        Args:
            db: Optional database session
        """
        self.db = db
        
    async def sync_evaluation_to_model(
        self,
        model_id: str,
        vulca_evaluation: Dict[str, Any],
        db: Optional[AsyncSession] = None
    ) -> bool:
        """Sync a single VULCA evaluation to ai_models table in real-time
        
        Args:
            model_id: Model ID to update
            vulca_evaluation: VULCA evaluation data containing scores_47d and cultural_perspectives
            db: Optional database session
            
        Returns:
            Success status
        """
        session = db or self.db
        if not session:
            logger.error("No database session available")
            return False
            
        try:
            # Find the AI model
            result = await session.execute(
                select(AIModel).where(AIModel.id == str(model_id))
            )
            ai_model = result.scalar_one_or_none()
            
            if not ai_model:
                logger.warning(f"Model {model_id} not found for sync")
                return False
            
            # Update model with VULCA data
            ai_model.vulca_scores_47d = vulca_evaluation.get("scores_47d")
            ai_model.vulca_cultural_perspectives = vulca_evaluation.get("cultural_perspectives")
            ai_model.vulca_evaluation_date = datetime.utcnow()
            ai_model.vulca_sync_status = "completed"
            
            # Update overall score if VULCA provides better data
            if vulca_evaluation.get("scores_6d"):
                scores = list(vulca_evaluation["scores_6d"].values())
                vulca_overall = sum(scores) / len(scores) if scores else 0
                
                # Update if current score is default or from mock data
                if ai_model.overall_score == 0 or ai_model.data_source == "mock":
                    ai_model.overall_score = vulca_overall
                    ai_model.data_source = "vulca"
            
            await session.commit()
            
            # 失效相关缓存
            await cache_invalidator.invalidate_model_cache(model_id)
            await cache_invalidator.invalidate_vulca_cache(model_id)
            
            logger.info(f"Successfully synced VULCA data for model {ai_model.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync model {model_id}: {str(e)}")
            await session.rollback()
            return False
    
    async def batch_sync_pending(self, limit: int = 50) -> Dict[str, Any]:
        """Batch sync all pending VULCA evaluations
        
        Args:
            limit: Maximum number of records to sync
            
        Returns:
            Sync summary
        """
        summary = {
            "total_synced": 0,
            "failed": 0,
            "models_updated": []
        }
        
        async with AsyncSessionLocal() as db:
            try:
                # Find models with pending VULCA sync
                result = await db.execute(
                    select(AIModel)
                    .where(AIModel.vulca_sync_status == "pending")
                    .limit(limit)
                )
                pending_models = result.scalars().all()
                
                logger.info(f"Found {len(pending_models)} models pending VULCA sync")
                
                for model in pending_models:
                    # Check if VULCA evaluation exists
                    eval_result = await db.execute(
                        select(VULCAEvaluation)
                        .where(VULCAEvaluation.model_id == int(model.id))
                        .order_by(VULCAEvaluation.evaluation_date.desc())
                        .limit(1)
                    )
                    evaluation = eval_result.scalar_one_or_none()
                    
                    if evaluation:
                        # Sync the evaluation
                        success = await self.sync_evaluation_to_model(
                            model_id=model.id,
                            vulca_evaluation={
                                "scores_47d": evaluation.extended_47d_scores,
                                "cultural_perspectives": evaluation.cultural_perspectives,
                                "scores_6d": evaluation.original_6d_scores
                            },
                            db=db
                        )
                        
                        if success:
                            summary["total_synced"] += 1
                            summary["models_updated"].append(model.name)
                        else:
                            summary["failed"] += 1
                    else:
                        # No evaluation found, mark as no data
                        model.vulca_sync_status = "no_data"
                
                await db.commit()
                logger.info(f"Batch sync completed: {summary['total_synced']} synced, {summary['failed']} failed")
                
            except Exception as e:
                logger.error(f"Batch sync failed: {str(e)}")
                await db.rollback()
                
        return summary
    
    async def check_sync_health(self) -> Dict[str, Any]:
        """Check the health of VULCA sync system
        
        Returns:
            Health report
        """
        async with AsyncSessionLocal() as db:
            try:
                # Count sync statuses
                result = await db.execute(
                    select(
                        AIModel.vulca_sync_status,
                        func.count(AIModel.id)
                    ).group_by(AIModel.vulca_sync_status)
                )
                status_counts = dict(result.fetchall())
                
                # Find stale syncs (older than 7 days)
                stale_date = datetime.utcnow() - timedelta(days=7)
                stale_result = await db.execute(
                    select(func.count(AIModel.id))
                    .where(AIModel.vulca_evaluation_date < stale_date)
                )
                stale_count = stale_result.scalar()
                
                # Find models never synced
                never_synced_result = await db.execute(
                    select(func.count(AIModel.id))
                    .where(AIModel.vulca_evaluation_date.is_(None))
                )
                never_synced = never_synced_result.scalar()
                
                return {
                    "status": "healthy",
                    "sync_status_counts": status_counts,
                    "stale_evaluations": stale_count,
                    "never_synced": never_synced,
                    "last_check": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Health check failed: {str(e)}")
                return {
                    "status": "error",
                    "error": str(e),
                    "last_check": datetime.utcnow().isoformat()
                }


# Background task for periodic sync
async def periodic_sync_task(interval_minutes: int = 30):
    """Background task to periodically sync VULCA evaluations
    
    Args:
        interval_minutes: Sync interval in minutes
    """
    service = VULCASyncService()
    
    while True:
        try:
            logger.info("Starting periodic VULCA sync")
            summary = await service.batch_sync_pending()
            logger.info(f"Periodic sync completed: {summary}")
            
            # Wait for next sync
            await asyncio.sleep(interval_minutes * 60)
            
        except Exception as e:
            logger.error(f"Periodic sync error: {str(e)}")
            await asyncio.sleep(60)  # Retry after 1 minute on error


# Import for fixing circular dependency
from sqlalchemy import func