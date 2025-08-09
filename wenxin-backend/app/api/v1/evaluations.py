from typing import Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user_optional, get_current_user_or_guest, is_guest_user
from app.models.evaluation_task import EvaluationTask, TaskStatus
from app.models.ai_model import AIModel
from app.models.user import User
from app.schemas.evaluation_task import (
    EvaluationTaskCreate,
    EvaluationTaskUpdate,
    EvaluationTaskResponse,
    TaskType
)
from app.services.evaluation_engine import EvaluationEngine

router = APIRouter()


@router.post("/", response_model=EvaluationTaskResponse)
async def create_evaluation(
    task_in: EvaluationTaskCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user_or_guest: Union[User, Any] = Depends(get_current_user_or_guest)
) -> Any:
    """Create a new evaluation task"""
    
    # Check if guest user has reached daily limit
    if is_guest_user(current_user_or_guest):
        # In real implementation, you'd check Redis/cache for daily count
        # For now, we'll allow guest users with a simple check
        guest_session = current_user_or_guest
        # TODO: Implement proper daily limit checking with Redis/database
    
    # Verify model exists
    result = await db.execute(
        select(AIModel).where(AIModel.id == task_in.model_id)
    )
    model = result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    
    # Create evaluation task
    user_id = None
    guest_id = None
    
    if is_guest_user(current_user_or_guest):
        guest_id = current_user_or_guest.guest_id
    else:
        user_id = current_user_or_guest.id if current_user_or_guest else None
    
    task = EvaluationTask(
        model_id=task_in.model_id,
        task_type=task_in.task_type.value,
        prompt=task_in.prompt,
        parameters=task_in.parameters,
        status=TaskStatus.PENDING,
        user_id=user_id,
        guest_id=guest_id
    )
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    # Start evaluation in background
    engine = EvaluationEngine(db)
    background_tasks.add_task(engine.execute_evaluation, task.id)
    
    # Return task with model info
    return EvaluationTaskResponse(
        **task.__dict__,
        model_name=model.name,
        model_organization=model.organization
    )


@router.get("/", response_model=List[EvaluationTaskResponse])
async def get_evaluations(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    model_id: Optional[str] = None,
    task_type: Optional[TaskType] = None,
    status: Optional[TaskStatus] = None,
    current_user_or_guest: Union[User, Any] = Depends(get_current_user_or_guest)
) -> Any:
    """Get list of evaluation tasks"""
    
    query = select(EvaluationTask).options(
        selectinload(EvaluationTask.model)
    )
    
    # Apply filters
    if model_id:
        query = query.where(EvaluationTask.model_id == model_id)
    if task_type:
        query = query.where(EvaluationTask.task_type == task_type.value)
    if status:
        query = query.where(EvaluationTask.status == status)
    
    # Filter by user or guest
    if is_guest_user(current_user_or_guest):
        guest_session = current_user_or_guest
        query = query.where(EvaluationTask.guest_id == guest_session.guest_id)
    elif current_user_or_guest:
        query = query.where(EvaluationTask.user_id == current_user_or_guest.id)
    else:
        # No filter for anonymous access - show all public tasks or handle as needed
        pass
    
    query = query.order_by(EvaluationTask.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    # Convert to response model with model info
    response = []
    for task in tasks:
        task_dict = task.__dict__
        if task.model:
            task_dict['model_name'] = task.model.name
            task_dict['model_organization'] = task.model.organization
        response.append(EvaluationTaskResponse(**task_dict))
    
    return response


@router.get("/{task_id}", response_model=EvaluationTaskResponse)
async def get_evaluation(
    task_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get evaluation task by ID"""
    
    result = await db.execute(
        select(EvaluationTask).options(
            selectinload(EvaluationTask.model)
        ).where(EvaluationTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation task not found"
        )
    
    task_dict = task.__dict__
    if task.model:
        task_dict['model_name'] = task.model.name
        task_dict['model_organization'] = task.model.organization
    
    return EvaluationTaskResponse(**task_dict)


@router.post("/{task_id}/score", response_model=EvaluationTaskResponse)
async def score_evaluation(
    task_id: str,
    score_in: EvaluationTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Any:
    """Add human score to evaluation"""
    
    result = await db.execute(
        select(EvaluationTask).options(
            selectinload(EvaluationTask.model)
        ).where(EvaluationTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation task not found"
        )
    
    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only score completed evaluations"
        )
    
    # Update scores
    if score_in.human_score is not None:
        if not 0 <= score_in.human_score <= 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Score must be between 0 and 100"
            )
        task.human_score = score_in.human_score
        
        # Calculate final score (weighted average)
        if task.auto_score:
            task.final_score = (task.auto_score * 0.6 + task.human_score * 0.4)
        else:
            task.final_score = task.human_score
    
    if score_in.evaluation_notes:
        task.evaluation_notes = score_in.evaluation_notes
    
    await db.commit()
    await db.refresh(task)
    
    task_dict = task.__dict__
    if task.model:
        task_dict['model_name'] = task.model.name
        task_dict['model_organization'] = task.model.organization
    
    return EvaluationTaskResponse(**task_dict)


@router.delete("/{task_id}")
async def delete_evaluation(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
) -> Any:
    """Delete evaluation task"""
    
    result = await db.execute(
        select(EvaluationTask).where(EvaluationTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation task not found"
        )
    
    # Only allow deletion by task creator or admin
    if current_user:
        if task.user_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this evaluation"
            )
    
    await db.delete(task)
    await db.commit()
    
    return {"message": "Evaluation deleted successfully"}