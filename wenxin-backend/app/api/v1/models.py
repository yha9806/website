from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_superuser
from app.models.ai_model import AIModel
from app.models.user import User
from app.schemas.ai_model import (
    AIModel as AIModelSchema,
    AIModelCreate,
    AIModelUpdate,
    AIModelWithStats
)

router = APIRouter()


@router.get("/", response_model=List[AIModelSchema])
async def get_models(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    is_active: bool = True
) -> Any:
    """Get list of AI models"""
    query = select(AIModel)
    
    if category:
        query = query.where(AIModel.category == category)
    if is_active is not None:
        query = query.where(AIModel.is_active == is_active)
    
    query = query.order_by(AIModel.overall_score.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    models = result.scalars().all()
    
    return models


@router.get("/{model_id}", response_model=AIModelWithStats)
async def get_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get AI model by ID with statistics"""
    result = await db.execute(
        select(AIModel).where(AIModel.id == model_id)
    )
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Get statistics (simplified for now)
    model_dict = {
        **model.__dict__,
        "total_evaluations": 0,
        "total_battles": 0,
        "win_rate": 0.0,
        "recent_works": []
    }
    
    return model_dict


@router.post("/", response_model=AIModelSchema)
async def create_model(
    model_in: AIModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """Create new AI model (admin only)"""
    # Check if model exists
    result = await db.execute(
        select(AIModel).where(AIModel.name == model_in.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model with this name already exists"
        )
    
    # Create model
    model = AIModel(
        **model_in.model_dump(exclude={"api_key"}),
        metrics={
            "rhythm": 0,
            "composition": 0,
            "narrative": 0,
            "emotion": 0,
            "creativity": 0,
            "cultural": 0
        }
    )
    
    # Encrypt API key if provided
    if model_in.api_key:
        # TODO: Implement proper encryption
        model.api_key_encrypted = model_in.api_key
    
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    return model


@router.put("/{model_id}", response_model=AIModelSchema)
async def update_model(
    model_id: UUID,
    model_in: AIModelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """Update AI model (admin only)"""
    result = await db.execute(
        select(AIModel).where(AIModel.id == model_id)
    )
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Update model
    update_data = model_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(model, field, value)
    
    await db.commit()
    await db.refresh(model)
    
    return model


@router.delete("/{model_id}")
async def delete_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """Delete AI model (admin only)"""
    result = await db.execute(
        select(AIModel).where(AIModel.id == model_id)
    )
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    await db.delete(model)
    await db.commit()
    
    return {"message": "Model deleted successfully"}