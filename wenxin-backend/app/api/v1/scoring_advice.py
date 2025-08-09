from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user_optional, get_current_user_or_guest, is_guest_user
from app.models.evaluation_task import EvaluationTask
from app.models.user import User
from app.services.scoring_advisor import ScoringAdvice, TaskType

router = APIRouter()
advisor = ScoringAdvice()


@router.get("/task-type/{task_type}")
async def get_task_type_advice(
    task_type: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get scoring advice for a specific task type"""
    
    try:
        task_enum = TaskType(task_type.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported task type: {task_type}"
        )
    
    advice = advisor.get_task_advice(task_enum)
    return advice


@router.get("/dimension/{task_type}/{dimension}")
async def get_dimension_guidance(
    task_type: str,
    dimension: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get scoring guidance for a specific dimension of a task type"""
    
    try:
        task_enum = TaskType(task_type.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported task type: {task_type}"
        )
    
    guidance = advisor.get_dimension_guidance(task_enum, dimension)
    
    if not guidance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No guidance found for dimension '{dimension}' in task type '{task_type}'"
        )
    
    return guidance


@router.get("/user-pattern")
async def get_user_scoring_pattern(
    db: AsyncSession = Depends(get_db),
    current_user_or_guest = Depends(get_current_user_or_guest),
    limit: int = Query(50, ge=1, le=100)
) -> Any:
    """Get user's scoring pattern analysis"""
    
    # Only provide pattern analysis for authenticated users
    if is_guest_user(current_user_or_guest):
        return {
            'message': 'User scoring pattern analysis is only available for registered users',
            'suggestion': 'Please register to access personalized scoring insights'
        }
    
    user = current_user_or_guest
    
    # Get user's evaluation history
    result = await db.execute(
        select(EvaluationTask)
        .where(EvaluationTask.user_id == user.id)
        .where(EvaluationTask.human_score.isnot(None))
        .order_by(EvaluationTask.completed_at.desc())
        .limit(limit)
    )
    
    user_evaluations = result.scalars().all()
    
    # Convert to format expected by advisor
    user_scores = []
    for eval_task in user_evaluations:
        score_record = {
            'human_score': eval_task.human_score,
            'evaluation_metrics': eval_task.evaluation_metrics,
            'task_type': eval_task.task_type,
            'completed_at': eval_task.completed_at
        }
        user_scores.append(score_record)
    
    analysis = advisor.analyze_user_scoring_pattern(user_scores)
    return analysis


@router.get("/quick-tips/{task_type}")
async def get_quick_tips(
    task_type: str,
    user_level: str = Query('beginner', regex='^(beginner|intermediate|advanced)$'),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get quick scoring tips based on task type and user level"""
    
    try:
        task_enum = TaskType(task_type.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported task type: {task_type}"
        )
    
    base_advice = advisor.get_task_advice(task_enum)
    
    # Customize tips based on user level
    if user_level == 'beginner':
        tips = base_advice['evaluation_tips'][:3]  # Show fewer tips for beginners
        additional_guidance = [
            '初次评分时，可以先关注整体印象',
            '不确定时，可以参考评分范围的中间值',
            '多看其他优秀作品可以提高评判标准'
        ]
    elif user_level == 'intermediate':
        tips = base_advice['evaluation_tips'][:5]
        additional_guidance = [
            '尝试从多个维度进行深入分析',
            '可以关注作品的技术细节和创新之处',
            '建议记录评分理由，便于后续参考'
        ]
    else:  # advanced
        tips = base_advice['evaluation_tips']
        additional_guidance = [
            '可以考虑作品在同类型中的相对水平',
            '注意平衡主观感受与客观标准',
            '建议提供具体的改进建议'
        ]
    
    return {
        'task_type': task_type,
        'user_level': user_level,
        'quick_tips': tips,
        'additional_guidance': additional_guidance,
        'typical_score_ranges': base_advice['typical_score_ranges']
    }


@router.get("/comparison/{task_type}")
async def get_task_comparison_data(
    task_type: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get comparison data for evaluating similar works"""
    
    try:
        task_enum = TaskType(task_type.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported task type: {task_type}"
        )
    
    # Get recent evaluations for this task type (for statistical comparison)
    result = await db.execute(
        select(EvaluationTask)
        .where(EvaluationTask.task_type == task_type.lower())
        .where(EvaluationTask.human_score.isnot(None))
        .order_by(EvaluationTask.completed_at.desc())
        .limit(100)
    )
    
    recent_evaluations = result.scalars().all()
    
    # Calculate statistics
    if recent_evaluations:
        scores = [eval_task.human_score for eval_task in recent_evaluations if eval_task.human_score]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        # Calculate dimension averages if available
        dimension_stats = {}
        for eval_task in recent_evaluations:
            if eval_task.evaluation_metrics:
                for dim, score in eval_task.evaluation_metrics.items():
                    if isinstance(score, (int, float)):
                        if dim not in dimension_stats:
                            dimension_stats[dim] = []
                        dimension_stats[dim].append(score * 100)
        
        # Calculate averages for each dimension
        dimension_averages = {}
        for dim, scores_list in dimension_stats.items():
            if scores_list:
                dimension_averages[dim] = sum(scores_list) / len(scores_list)
    else:
        avg_score = 0
        dimension_averages = {}
    
    advice = advisor.get_task_advice(task_enum)
    
    return {
        'task_type': task_type,
        'recent_evaluations_count': len(recent_evaluations),
        'community_average_score': round(avg_score, 1) if avg_score else None,
        'community_dimension_averages': dimension_averages,
        'expected_ranges': advice['typical_score_ranges'],
        'comparison_context': f'基于最近 {len(recent_evaluations)} 个评测的统计数据' if recent_evaluations else '暂无足够的对比数据'
    }