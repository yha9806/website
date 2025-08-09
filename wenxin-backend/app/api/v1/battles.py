from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timedelta
import random

from app.core.database import get_db
from app.models.battle import Battle, BattleVote, BattleStatus, VoteChoice
from app.models.ai_model import AIModel
from app.schemas.battle import (
    BattleCreate,
    BattleResponse,
    BattleVoteRequest,
    BattleVoteResponse,
    BattleListResponse
)
from app.schemas.ai_model import AIModelResponse
from app.api.deps import get_current_user_optional, get_current_admin
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=BattleListResponse)
async def get_battles(
    db: AsyncSession = Depends(get_db),
    status: Optional[BattleStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """Get list of battles with optional status filter"""
    query = select(Battle).options(
        selectinload(Battle.model_a),
        selectinload(Battle.model_b)
    )
    
    if status:
        query = query.where(Battle.status == status)
    
    query = query.order_by(Battle.created_at.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(Battle)
    if status:
        count_query = count_query.where(Battle.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    battles = result.scalars().all()
    
    # Manually build response to avoid async context issues
    battle_responses = []
    for battle in battles:
        battle_responses.append(BattleResponse(
            id=str(battle.id),
            model_a=AIModelResponse.model_validate(battle.model_a),
            model_b=AIModelResponse.model_validate(battle.model_b),
            task_type=battle.task_type,
            task_prompt=battle.task_prompt,
            task_category=battle.task_category,
            difficulty=battle.difficulty,
            votes_a=battle.votes_a,
            votes_b=battle.votes_b,
            status=battle.status,
            created_at=battle.created_at,
            completed_at=battle.completed_at
        ))
    
    return BattleListResponse(
        battles=battle_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/random", response_model=BattleResponse)
async def get_random_battle(db: AsyncSession = Depends(get_db)):
    """Get a random active battle"""
    query = select(Battle).options(
        selectinload(Battle.model_a),
        selectinload(Battle.model_b)
    ).where(Battle.status == BattleStatus.active)
    result = await db.execute(query)
    active_battles = result.scalars().all()
    
    if not active_battles:
        raise HTTPException(status_code=404, detail="No active battles found")
    
    battle = random.choice(active_battles)
    return BattleResponse(
        id=str(battle.id),
        model_a=AIModelResponse.model_validate(battle.model_a),
        model_b=AIModelResponse.model_validate(battle.model_b),
        task_type=battle.task_type,
        task_prompt=battle.task_prompt,
        task_category=battle.task_category,
        difficulty=battle.difficulty,
        votes_a=battle.votes_a,
        votes_b=battle.votes_b,
        status=battle.status,
        created_at=battle.created_at,
        completed_at=battle.completed_at
    )


@router.get("/{battle_id}", response_model=BattleResponse)
async def get_battle(battle_id: str, db: AsyncSession = Depends(get_db)):
    """Get battle details by ID"""
    query = select(Battle).options(
        selectinload(Battle.model_a),
        selectinload(Battle.model_b)
    ).where(Battle.id == battle_id)
    result = await db.execute(query)
    battle = result.scalar_one_or_none()
    
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    return BattleResponse(
        id=str(battle.id),
        model_a=AIModelResponse.model_validate(battle.model_a),
        model_b=AIModelResponse.model_validate(battle.model_b),
        task_type=battle.task_type,
        task_prompt=battle.task_prompt,
        task_category=battle.task_category,
        difficulty=battle.difficulty,
        votes_a=battle.votes_a,
        votes_b=battle.votes_b,
        status=battle.status,
        created_at=battle.created_at,
        completed_at=battle.completed_at
    )


@router.post("/", response_model=BattleResponse)
async def create_battle(
    battle_data: BattleCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Create a new battle (admin only)"""
    # Verify both models exist
    model_a_query = select(AIModel).where(AIModel.id == battle_data.model_a_id)
    model_b_query = select(AIModel).where(AIModel.id == battle_data.model_b_id)
    
    model_a_result = await db.execute(model_a_query)
    model_b_result = await db.execute(model_b_query)
    
    model_a = model_a_result.scalar_one_or_none()
    model_b = model_b_result.scalar_one_or_none()
    
    if not model_a or not model_b:
        raise HTTPException(status_code=404, detail="One or both models not found")
    
    battle = Battle(
        model_a_id=battle_data.model_a_id,
        model_b_id=battle_data.model_b_id,
        task_type=battle_data.task_type,
        task_prompt=battle_data.task_prompt,
        task_category=battle_data.task_category,
        difficulty=battle_data.difficulty
    )
    
    db.add(battle)
    await db.commit()
    await db.refresh(battle)
    
    # Reload with relationships
    query = select(Battle).options(
        selectinload(Battle.model_a),
        selectinload(Battle.model_b)
    ).where(Battle.id == battle.id)
    result = await db.execute(query)
    battle = result.scalar_one()
    
    return BattleResponse(
        id=str(battle.id),
        model_a=AIModelResponse.model_validate(battle.model_a),
        model_b=AIModelResponse.model_validate(battle.model_b),
        task_type=battle.task_type,
        task_prompt=battle.task_prompt,
        task_category=battle.task_category,
        difficulty=battle.difficulty,
        votes_a=battle.votes_a,
        votes_b=battle.votes_b,
        status=battle.status,
        created_at=battle.created_at,
        completed_at=battle.completed_at
    )


@router.post("/{battle_id}/vote", response_model=BattleVoteResponse)
async def vote_for_battle(
    battle_id: str,
    vote_data: BattleVoteRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Vote in a battle"""
    # Get battle
    query = select(Battle).where(Battle.id == battle_id)
    result = await db.execute(query)
    battle = result.scalar_one_or_none()
    
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    if battle.status != BattleStatus.active:
        raise HTTPException(status_code=400, detail="Battle is not active")
    
    # Get voter IP
    voter_ip = request.client.host
    
    # Check if already voted (by IP or user)
    existing_vote_query = select(BattleVote).where(
        and_(
            BattleVote.battle_id == battle_id,
            BattleVote.voter_ip == voter_ip
        )
    )
    
    if current_user:
        existing_vote_query = existing_vote_query.where(
            BattleVote.user_id == current_user.id
        )
    
    existing_vote_result = await db.execute(existing_vote_query)
    existing_vote = existing_vote_result.scalar_one_or_none()
    
    if existing_vote:
        return BattleVoteResponse(
            success=False,
            message="You have already voted in this battle",
            votes_a=battle.votes_a,
            votes_b=battle.votes_b
        )
    
    # Create vote record
    vote = BattleVote(
        battle_id=battle_id,
        voter_ip=voter_ip,
        user_id=current_user.id if current_user else None,
        vote_for=vote_data.vote_for
    )
    
    # Update vote counts
    if vote_data.vote_for == VoteChoice.model_a:
        battle.votes_a += 1
    else:
        battle.votes_b += 1
    
    db.add(vote)
    await db.commit()
    await db.refresh(battle)
    
    return BattleVoteResponse(
        success=True,
        message="Vote recorded successfully",
        votes_a=battle.votes_a,
        votes_b=battle.votes_b
    )


@router.patch("/{battle_id}/complete", response_model=BattleResponse)
async def complete_battle(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Mark a battle as completed (admin only)"""
    query = select(Battle).where(Battle.id == battle_id)
    result = await db.execute(query)
    battle = result.scalar_one_or_none()
    
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    if battle.status == BattleStatus.completed:
        raise HTTPException(status_code=400, detail="Battle already completed")
    
    battle.status = BattleStatus.completed
    battle.completed_at = datetime.now()
    
    await db.commit()
    await db.refresh(battle)
    
    # Reload with relationships
    query = select(Battle).options(
        selectinload(Battle.model_a),
        selectinload(Battle.model_b)
    ).where(Battle.id == battle_id)
    result = await db.execute(query)
    battle = result.scalar_one()
    
    return BattleResponse(
        id=str(battle.id),
        model_a=AIModelResponse.model_validate(battle.model_a),
        model_b=AIModelResponse.model_validate(battle.model_b),
        task_type=battle.task_type,
        task_prompt=battle.task_prompt,
        task_category=battle.task_category,
        difficulty=battle.difficulty,
        votes_a=battle.votes_a,
        votes_b=battle.votes_b,
        status=battle.status,
        created_at=battle.created_at,
        completed_at=battle.completed_at
    )

