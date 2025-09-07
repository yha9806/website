#!/usr/bin/env python3
"""
Sync VULCA evaluation data to AI models table
Updates vulca_scores_47d and vulca_cultural_perspectives fields
"""

import asyncio
import json
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.ai_model import AIModel
from app.vulca.models.vulca_model import VULCAEvaluation

async def sync_vulca_data():
    """Sync VULCA evaluations to AI models"""
    
    async with AsyncSessionLocal() as session:
        # Get all VULCA evaluations
        result = await session.execute(select(VULCAEvaluation))
        evaluations = result.scalars().all()
        
        print(f"Found {len(evaluations)} VULCA evaluations to sync")
        
        synced_count = 0
        for evaluation in evaluations:
            try:
                # Parse JSON strings
                scores_47d = json.loads(evaluation.extended_47d_scores.strip('"'))
                cultural = json.loads(evaluation.cultural_perspectives.strip('"'))
                
                # Update AI model
                stmt = (
                    update(AIModel)
                    .where(AIModel.id == evaluation.model_id)
                    .values(
                        vulca_scores_47d=scores_47d,
                        vulca_cultural_perspectives=cultural,
                        vulca_evaluation_date=evaluation.evaluation_date,
                        vulca_sync_status='synced'
                    )
                )
                
                await session.execute(stmt)
                synced_count += 1
                print(f"  [OK] Synced {evaluation.model_name}")
                
            except Exception as e:
                print(f"  [ERROR] Failed to sync {evaluation.model_name}: {e}")
        
        await session.commit()
        print(f"\n[SUCCESS] Successfully synced {synced_count}/{len(evaluations)} evaluations")

if __name__ == "__main__":
    asyncio.run(sync_vulca_data())