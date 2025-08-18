"""
Model repository for unified data access
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_, func
from sqlalchemy.orm import selectinload

from app.models import AIModel


class ModelRepository:
    """Repository for AI Model data access"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, model_id: str) -> Optional[AIModel]:
        """Get model by ID"""
        result = await self.session.get(AIModel, model_id)
        return self._normalize_model(result) if result else None
    
    async def get_by_name(self, name: str) -> Optional[AIModel]:
        """Get model by name"""
        result = await self.session.execute(
            select(AIModel).where(AIModel.name == name)
        )
        model = result.scalar_one_or_none()
        return self._normalize_model(model) if model else None
    
    async def get_all(self, 
                      skip: int = 0, 
                      limit: int = 100,
                      include_inactive: bool = False) -> List[AIModel]:
        """Get all models with pagination"""
        query = select(AIModel)
        
        if not include_inactive:
            query = query.where(AIModel.is_active == True)
        
        query = query.offset(skip).limit(limit)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._normalize_model(m) for m in models]
    
    async def get_leaderboard(self, 
                             category: Optional[str] = None,
                             limit: int = 100) -> List[AIModel]:
        """
        Get leaderboard with proper NULL handling
        Models with NULL scores are placed at the end
        """
        query = select(AIModel).where(AIModel.is_active == True)
        
        if category:
            query = query.where(AIModel.category == category)
        
        # Order by overall_score DESC NULLS LAST
        query = query.order_by(
            AIModel.overall_score.desc().nullslast()
        ).limit(limit)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._normalize_model(m) for m in models]
    
    async def search(self, 
                    search_term: str,
                    filters: Optional[Dict[str, Any]] = None) -> List[AIModel]:
        """Search models by name, organization, or tags"""
        query = select(AIModel).where(
            or_(
                AIModel.name.ilike(f"%{search_term}%"),
                AIModel.organization.ilike(f"%{search_term}%"),
                AIModel.description.ilike(f"%{search_term}%")
            )
        )
        
        if filters:
            if "category" in filters:
                query = query.where(AIModel.category == filters["category"])
            if "organization" in filters:
                query = query.where(AIModel.organization == filters["organization"])
            if "min_score" in filters:
                query = query.where(AIModel.overall_score >= filters["min_score"])
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        return [self._normalize_model(m) for m in models]
    
    async def create(self, model_data: Dict[str, Any]) -> AIModel:
        """Create a new model"""
        # Normalize data before creation
        normalized_data = self._prepare_model_data(model_data)
        
        model = AIModel(**normalized_data)
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._normalize_model(model)
    
    async def update(self, 
                    model_id: str, 
                    update_data: Dict[str, Any]) -> Optional[AIModel]:
        """Update a model"""
        model = await self.get_by_id(model_id)
        if not model:
            return None
        
        # Normalize update data
        normalized_data = self._prepare_model_data(update_data)
        
        for key, value in normalized_data.items():
            setattr(model, key, value)
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._normalize_model(model)
    
    async def delete(self, model_id: str) -> bool:
        """Delete a model"""
        result = await self.session.execute(
            delete(AIModel).where(AIModel.id == model_id)
        )
        await self.session.commit()
        return result.rowcount > 0
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get model statistics"""
        # Total count
        total_count = await self.session.scalar(
            select(func.count(AIModel.id))
        )
        
        # Count by category
        category_counts = await self.session.execute(
            select(
                AIModel.category,
                func.count(AIModel.id)
            ).group_by(AIModel.category)
        )
        
        # Count by organization
        org_counts = await self.session.execute(
            select(
                AIModel.organization,
                func.count(AIModel.id)
            ).group_by(AIModel.organization)
        )
        
        # Average scores
        avg_score = await self.session.scalar(
            select(func.avg(AIModel.overall_score))
            .where(AIModel.overall_score.isnot(None))
        )
        
        return {
            "total_models": total_count,
            "categories": dict(category_counts),
            "organizations": dict(org_counts),
            "average_score": float(avg_score) if avg_score else 0
        }
    
    def _normalize_model(self, model: AIModel) -> AIModel:
        """
        Normalize model data for backward compatibility
        Ensures both individual score columns and metrics JSON are populated
        """
        if not model:
            return model
        
        # If individual scores exist but metrics is empty, populate metrics
        if model.rhythm_score is not None and not model.metrics:
            model.metrics = {
                "rhythm": model.rhythm_score or 0,
                "composition": model.composition_score or 0,
                "narrative": model.narrative_score or 0,
                "emotion": model.emotion_score or 0,
                "creativity": model.creativity_score or 0,
                "cultural": model.cultural_score or 0
            }
        
        # If metrics exist but individual scores are empty, populate scores
        elif model.metrics and model.rhythm_score is None:
            model.rhythm_score = model.metrics.get("rhythm", 0)
            model.composition_score = model.metrics.get("composition", 0)
            model.narrative_score = model.metrics.get("narrative", 0)
            model.emotion_score = model.metrics.get("emotion", 0)
            model.creativity_score = model.metrics.get("creativity", 0)
            model.cultural_score = model.metrics.get("cultural", 0)
        
        return model
    
    def _prepare_model_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare model data for creation/update
        Ensures both formats are supported
        """
        prepared = data.copy()
        
        # If metrics provided, extract to individual columns
        if "metrics" in prepared and prepared["metrics"]:
            metrics = prepared["metrics"]
            prepared["rhythm_score"] = metrics.get("rhythm", 0)
            prepared["composition_score"] = metrics.get("composition", 0)
            prepared["narrative_score"] = metrics.get("narrative", 0)
            prepared["emotion_score"] = metrics.get("emotion", 0)
            prepared["creativity_score"] = metrics.get("creativity", 0)
            prepared["cultural_score"] = metrics.get("cultural", 0)
        
        # If individual scores provided, create metrics
        elif any(k in prepared for k in ["rhythm_score", "composition_score"]):
            prepared["metrics"] = {
                "rhythm": prepared.get("rhythm_score", 0),
                "composition": prepared.get("composition_score", 0),
                "narrative": prepared.get("narrative_score", 0),
                "emotion": prepared.get("emotion_score", 0),
                "creativity": prepared.get("creativity_score", 0),
                "cultural": prepared.get("cultural_score", 0)
            }
        
        return prepared