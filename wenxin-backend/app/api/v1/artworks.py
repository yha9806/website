from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.models.artwork import Artwork, ArtworkType
from app.models.ai_model import AIModel
from app.schemas.artwork import (
    ArtworkCreate,
    ArtworkUpdate,
    ArtworkResponse,
    ArtworkListResponse
)
from app.api.deps import get_current_admin
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=ArtworkListResponse)
async def get_artworks(
    db: AsyncSession = Depends(get_db),
    model_id: Optional[str] = None,
    type: Optional[ArtworkType] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """Get list of artworks with optional filters"""
    query = select(Artwork)
    
    if model_id:
        query = query.where(Artwork.model_id == model_id)
    
    if type:
        query = query.where(Artwork.type == type)
    
    query = query.order_by(Artwork.created_at.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(Artwork)
    if model_id:
        count_query = count_query.where(Artwork.model_id == model_id)
    if type:
        count_query = count_query.where(Artwork.type == type)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    artworks = result.scalars().all()
    
    return ArtworkListResponse(
        artworks=[ArtworkResponse.model_validate(artwork) for artwork in artworks],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{artwork_id}", response_model=ArtworkResponse)
async def get_artwork(artwork_id: str, db: AsyncSession = Depends(get_db)):
    """Get artwork details by ID"""
    query = select(Artwork).where(Artwork.id == artwork_id)
    result = await db.execute(query)
    artwork = result.scalar_one_or_none()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    return ArtworkResponse.model_validate(artwork)


@router.post("/", response_model=ArtworkResponse)
async def create_artwork(
    artwork_data: ArtworkCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Create a new artwork (admin only)"""
    # Verify model exists
    model_query = select(AIModel).where(AIModel.id == artwork_data.model_id)
    model_result = await db.execute(model_query)
    model = model_result.scalar_one_or_none()
    
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    artwork = Artwork(
        model_id=artwork_data.model_id,
        type=artwork_data.type,
        title=artwork_data.title,
        content=artwork_data.content,
        image_url=artwork_data.image_url,
        prompt=artwork_data.prompt,
        score=artwork_data.score,
        extra_metadata=artwork_data.extra_metadata
    )
    
    db.add(artwork)
    await db.commit()
    await db.refresh(artwork)
    
    return ArtworkResponse.model_validate(artwork)


@router.put("/{artwork_id}", response_model=ArtworkResponse)
async def update_artwork(
    artwork_id: str,
    artwork_update: ArtworkUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Update an artwork (admin only)"""
    query = select(Artwork).where(Artwork.id == artwork_id)
    result = await db.execute(query)
    artwork = result.scalar_one_or_none()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    update_data = artwork_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(artwork, field, value)
    
    await db.commit()
    await db.refresh(artwork)
    
    return ArtworkResponse.model_validate(artwork)


@router.delete("/{artwork_id}")
async def delete_artwork(
    artwork_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Delete an artwork (admin only)"""
    query = select(Artwork).where(Artwork.id == artwork_id)
    result = await db.execute(query)
    artwork = result.scalar_one_or_none()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    await db.delete(artwork)
    await db.commit()
    
    return {"message": "Artwork deleted successfully"}


@router.post("/{artwork_id}/like")
async def like_artwork(artwork_id: str, db: AsyncSession = Depends(get_db)):
    """Like an artwork (increment likes count)"""
    # Find artwork by ID
    query = select(Artwork).where(Artwork.id == artwork_id)
    result = await db.execute(query)
    artwork = result.scalar_one_or_none()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    # Increment likes
    artwork.likes += 1
    await db.commit()
    
    return {
        "message": "Artwork liked successfully",
        "artwork_id": artwork_id,
        "new_likes": artwork.likes
    }


@router.post("/{artwork_id}/view")
async def view_artwork(artwork_id: str, db: AsyncSession = Depends(get_db)):
    """Record a view for an artwork (increment views count)"""
    query = select(Artwork).where(Artwork.id == artwork_id)
    result = await db.execute(query)
    artwork = result.scalar_one_or_none()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    # Increment views
    artwork.views += 1
    await db.commit()
    
    return {
        "message": "View recorded successfully",
        "artwork_id": artwork_id,
        "new_views": artwork.views
    }


@router.post("/{artwork_id}/share")
async def share_artwork(artwork_id: str, db: AsyncSession = Depends(get_db)):
    """Share an artwork (for future analytics)"""
    query = select(Artwork).where(Artwork.id == artwork_id)
    result = await db.execute(query)
    artwork = result.scalar_one_or_none()
    
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    
    # For now, just return success. Could add share tracking in future
    return {
        "message": "Artwork shared successfully",
        "artwork_id": artwork_id,
        "title": artwork.title
    }