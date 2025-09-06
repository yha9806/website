from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from uuid import UUID
import json

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_superuser
from app.models.ai_model import AIModel
from app.models.user import User
from app.schemas.ai_model import (
    AIModelResponse as AIModelSchema,
    AIModelCreate,
    AIModelUpdate,
    AIModelWithStats
)
from app.services.cache_service import cache_service, CacheKeys, CacheTTL

router = APIRouter()


@router.get("/", response_model=List[AIModelSchema])
async def get_models(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    is_active: bool = True,
    include_vulca: bool = Query(False, description="Include VULCA evaluation data")
) -> Any:
    """Get list of AI models with optional VULCA data"""
    # 构建缓存键
    cache_key = f"{CacheKeys.MODELS_ALL}:{skip}:{limit}:{category}:{is_active}:{include_vulca}"
    
    # 尝试从缓存获取
    cached_data = cache_service.get(cache_key)
    if cached_data:
        return cached_data
    
    query = select(AIModel)
    
    if category:
        query = query.where(AIModel.category == category)
    if is_active is not None:
        query = query.where(AIModel.is_active.is_(is_active))
    
    query = query.order_by(AIModel.overall_score.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    models = result.scalars().all()
    
    # Convert database models to response format, handling NULL values
    result_models = []
    for model in models:
        # Parse JSON fields
        score_highlights = []
        score_weaknesses = []
        
        if model.score_highlights:
            try:
                score_highlights = json.loads(model.score_highlights) if isinstance(model.score_highlights, str) else model.score_highlights
            except:
                score_highlights = []
        
        if model.score_weaknesses:
            try:
                score_weaknesses = json.loads(model.score_weaknesses) if isinstance(model.score_weaknesses, str) else model.score_weaknesses
            except:
                score_weaknesses = []
        
        model_dict = {
            "id": str(model.id),
            "name": model.name,
            "organization": model.organization,
            "version": model.version,
            "category": model.category,
            "description": model.description,
            "release_date": model.release_date,
            "tags": model.tags if model.tags else [],
            "avatar_url": model.avatar_url,
            "overall_score": model.overall_score,
            "metrics": model.metrics if model.metrics else None,
            "score_highlights": score_highlights,
            "score_weaknesses": score_weaknesses,
            "is_active": model.is_active,
            "is_verified": model.is_verified,
            "created_at": model.created_at,
            "updated_at": model.updated_at
        }
        
        # Add VULCA data if requested
        if include_vulca:
            model_dict["vulca_scores_47d"] = model.vulca_scores_47d
            model_dict["vulca_cultural_perspectives"] = model.vulca_cultural_perspectives
            model_dict["vulca_evaluation_date"] = model.vulca_evaluation_date
            model_dict["vulca_sync_status"] = model.vulca_sync_status
            
            # Parse JSON strings to dictionaries for Pydantic validation
            if model_dict.get('vulca_scores_47d'):
                if isinstance(model_dict['vulca_scores_47d'], str):
                    try:
                        model_dict['vulca_scores_47d'] = json.loads(model_dict['vulca_scores_47d'])
                    except json.JSONDecodeError:
                        model_dict['vulca_scores_47d'] = None
                        
            if model_dict.get('vulca_cultural_perspectives'):
                if isinstance(model_dict['vulca_cultural_perspectives'], str):
                    try:
                        model_dict['vulca_cultural_perspectives'] = json.loads(model_dict['vulca_cultural_perspectives'])
                    except json.JSONDecodeError:
                        model_dict['vulca_cultural_perspectives'] = None
        
        result_models.append(AIModelSchema.model_validate(model_dict))
    
    # 缓存结果
    cache_service.set(cache_key, result_models, CacheTTL.MODELS)
    
    return result_models


@router.get("/{model_id}")
async def get_model(
    model_id: str,  # 改为str以支持SQLite
    db: AsyncSession = Depends(get_db),
    include_vulca: bool = Query(True, description="Include VULCA evaluation data")
) -> Any:
    """Get AI model by ID with statistics, benchmark results and VULCA data"""
    # 尝试从缓存获取
    cache_key = f"{CacheKeys.RANKINGS_MODEL.format(model_id=model_id)}:{include_vulca}"
    cached_data = cache_service.get(cache_key)
    if cached_data:
        return cached_data
    
    # Use simpler query without potentially missing columns
    query = text("""
        SELECT * FROM ai_models
        WHERE id = :model_id
    """)
    
    result = await db.execute(query, {"model_id": model_id})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Convert row to dict
    model_data = dict(row._mapping)
    
    # Build metrics dict from individual scores
    metrics = {
        "rhythm": model_data.get('rhythm_score', 0) or 0,
        "composition": model_data.get('composition_score', 0) or 0,
        "narrative": model_data.get('narrative_score', 0) or 0,
        "emotion": model_data.get('emotion_score', 0) or 0,
        "creativity": model_data.get('creativity_score', 0) or 0,
        "cultural": model_data.get('cultural_score', 0) or 0
    }
    
    # Parse JSON fields
    if model_data.get('tags'):
        try:
            model_data['tags'] = json.loads(model_data['tags']) if isinstance(model_data['tags'], str) else model_data['tags']
        except:
            model_data['tags'] = []
    
    if model_data.get('benchmark_metadata'):
        try:
            model_data['benchmark_metadata'] = json.loads(model_data['benchmark_metadata']) if isinstance(model_data['benchmark_metadata'], str) else model_data['benchmark_metadata']
        except:
            model_data['benchmark_metadata'] = {}
    
    # Parse additional JSON fields for benchmark data
    benchmark_responses = {}
    scoring_details = {}
    score_highlights = []
    score_weaknesses = []
    
    if model_data.get('benchmark_responses'):
        try:
            benchmark_responses = json.loads(model_data['benchmark_responses']) if isinstance(model_data['benchmark_responses'], str) else model_data['benchmark_responses']
        except:
            benchmark_responses = {}
    
    if model_data.get('scoring_details'):
        try:
            scoring_details = json.loads(model_data['scoring_details']) if isinstance(model_data['scoring_details'], str) else model_data['scoring_details']
        except:
            scoring_details = {}
    
    if model_data.get('score_highlights'):
        try:
            score_highlights = json.loads(model_data['score_highlights']) if isinstance(model_data['score_highlights'], str) else model_data['score_highlights']
        except:
            score_highlights = []
    
    if model_data.get('score_weaknesses'):
        try:
            score_weaknesses = json.loads(model_data['score_weaknesses']) if isinstance(model_data['score_weaknesses'], str) else model_data['score_weaknesses']
        except:
            score_weaknesses = []
    
    # Build response dictionary
    response_data = {
        **model_data,
        "metrics": metrics,
        "benchmark_responses": benchmark_responses,
        "scoring_details": scoring_details,
        "score_highlights": score_highlights,
        "score_weaknesses": score_weaknesses,
        "total_evaluations": 0,
        "total_battles": 0,
        "win_rate": 0.0,
        "recent_works": []
    }
    
    # Add VULCA data if requested and available
    if include_vulca:
        vulca_scores = model_data.get('vulca_scores_47d')
        vulca_perspectives = model_data.get('vulca_cultural_perspectives')
        
        # Parse JSON strings to dictionaries for proper response
        if vulca_scores and isinstance(vulca_scores, str):
            try:
                vulca_scores = json.loads(vulca_scores)
            except json.JSONDecodeError:
                vulca_scores = None
                
        if vulca_perspectives and isinstance(vulca_perspectives, str):
            try:
                vulca_perspectives = json.loads(vulca_perspectives)
            except json.JSONDecodeError:
                vulca_perspectives = None
        
        response_data["vulca_scores_47d"] = vulca_scores
        response_data["vulca_cultural_perspectives"] = vulca_perspectives
        response_data["vulca_evaluation_date"] = model_data.get('vulca_evaluation_date')
        response_data["vulca_sync_status"] = model_data.get('vulca_sync_status', 'pending')
    
    # 缓存结果
    cache_service.set(cache_key, response_data, CacheTTL.RANKINGS)
    
    return response_data


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
    model_id: str,  # 改为str以支持SQLite
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
    model_id: str,  # 改为str以支持SQLite
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