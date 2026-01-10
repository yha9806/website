from typing import Any, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from datetime import datetime
import json

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
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user_or_guest: Union[User, Any] = Depends(get_current_user_or_guest)
) -> Any:
    """Create a new evaluation task"""
    
    # Check if guest user has reached daily limit
    if is_guest_user(current_user_or_guest):
        guest_session = current_user_or_guest
        
        # Add guest session info to response headers
        response.headers["X-Guest-Session"] = json.dumps(guest_session.to_dict())
        
        # Check daily limit
        if guest_session.remaining_uses <= 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Daily limit reached for guest users. Please login to continue.",
                headers={"X-Guest-Session": json.dumps(guest_session.to_dict())}
            )
        
        # Increment usage count for next request (in real app, this would be in Redis/DB)
        guest_session.usage_count += 1
        guest_session.remaining_uses -= 1
    
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
    response: Response,
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    model_id: Optional[str] = None,
    task_type: Optional[TaskType] = None,
    status: Optional[TaskStatus] = None,
    current_user_or_guest: Union[User, Any] = Depends(get_current_user_or_guest)
) -> Any:
    """Get list of evaluation tasks - supports both authenticated and guest users"""
    
    # Add guest session info to response headers if guest
    if is_guest_user(current_user_or_guest):
        response.headers["X-Guest-Session"] = json.dumps(current_user_or_guest.to_dict())
    
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
        # For guests, show their own tasks plus some public examples
        from sqlalchemy import or_
        query = query.where(
            or_(
                EvaluationTask.guest_id == guest_session.guest_id,
                EvaluationTask.status == TaskStatus.COMPLETED  # Show completed tasks as examples
            )
        )
    elif current_user_or_guest and hasattr(current_user_or_guest, 'id'):
        # Authenticated user - show their tasks
        query = query.where(EvaluationTask.user_id == current_user_or_guest.id)
    else:
        # Anonymous access - show only completed public examples
        query = query.where(EvaluationTask.status == TaskStatus.COMPLETED)
    
    query = query.order_by(EvaluationTask.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    # Convert to response model with model info
    tasks_response = []
    for task in tasks:
        task_dict = task.__dict__
        if task.model:
            task_dict['model_name'] = task.model.name
            task_dict['model_organization'] = task.model.organization
        tasks_response.append(EvaluationTaskResponse(**task_dict))

    return tasks_response


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


@router.get("/{task_id}/progress", response_model=dict)
async def get_evaluation_progress(
    task_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get current progress of an evaluation task"""
    
    result = await db.execute(
        select(EvaluationTask).where(EvaluationTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation task not found"
        )
    
    # Return progress information
    return {
        "task_id": task.id,
        "status": task.status.value if task.status else "pending",
        "progress": task.progress if hasattr(task, 'progress') else 0,
        "current_stage": task.current_stage if hasattr(task, 'current_stage') else None,
        "started_at": task.started_at.isoformat() if task.started_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "error_message": task.error_message
    }


@router.get("/{task_id}/scoring-advice", response_model=dict)
async def get_scoring_advice(
    task_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get AI scoring advice based on similar evaluations"""
    
    # Get the evaluation task
    result = await db.execute(
        select(EvaluationTask).where(EvaluationTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation task not found"
        )
    
    # Get similar completed tasks for reference
    similar_tasks_query = select(EvaluationTask).where(
        EvaluationTask.task_type == task.task_type,
        EvaluationTask.status == TaskStatus.COMPLETED,
        EvaluationTask.auto_score.isnot(None)
    ).limit(20)
    
    result = await db.execute(similar_tasks_query)
    similar_tasks = result.scalars().all()
    
    # Calculate statistics
    if similar_tasks:
        scores = [t.auto_score for t in similar_tasks if t.auto_score]
        if scores:
            import statistics
            mean_score = statistics.mean(scores)
            std_dev = statistics.stdev(scores) if len(scores) > 1 else 0
            
            # Task-specific scoring ranges
            task_ranges = {
                "poem": {"creativity": (85, 95), "rhythm": (80, 90), "imagery": (82, 92)},
                "story": {"plot": (75, 90), "characters": (78, 88), "narrative": (80, 92)},
                "painting": {"composition": (82, 93), "aesthetics": (85, 95), "technique": (80, 90)},
                "music": {"melody": (78, 88), "harmony": (75, 85), "arrangement": (80, 90)}
            }
            
            advice = {
                "reference_score": round(mean_score, 1),
                "score_range": {
                    "min": max(0, round(mean_score - std_dev, 1)),
                    "max": min(100, round(mean_score + std_dev, 1))
                },
                "confidence": "high" if len(scores) >= 10 else "medium" if len(scores) >= 5 else "low",
                "sample_size": len(scores),
                "task_specific_ranges": task_ranges.get(task.task_type, {}),
                "suggestion": f"基于{len(scores)}个同类作品分析，建议评分范围为{round(mean_score - std_dev/2, 0)}-{round(mean_score + std_dev/2, 0)}分"
            }
        else:
            advice = {
                "reference_score": 85,
                "score_range": {"min": 75, "max": 95},
                "confidence": "low",
                "sample_size": 0,
                "task_specific_ranges": {},
                "suggestion": "暂无足够的历史数据，建议参考默认评分标准"
            }
    else:
        advice = {
            "reference_score": 85,
            "score_range": {"min": 75, "max": 95},
            "confidence": "low", 
            "sample_size": 0,
            "task_specific_ranges": {},
            "suggestion": "暂无历史数据，建议参考默认评分标准"
        }
    
    return advice


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