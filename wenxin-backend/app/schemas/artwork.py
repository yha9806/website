from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ArtworkType(str, Enum):
    poem = "poem"
    painting = "painting"
    story = "story"
    music = "music"


class ArtworkCreate(BaseModel):
    model_id: str
    type: ArtworkType
    title: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    prompt: Optional[str] = None
    score: float = 0.0
    extra_metadata: Optional[Dict[str, Any]] = None


class ArtworkUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    prompt: Optional[str] = None
    score: Optional[float] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class ArtworkResponse(BaseModel):
    id: str
    model_id: str
    type: ArtworkType
    title: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    prompt: Optional[str] = None
    score: float
    likes: int = 0
    views: int = 0
    extra_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ArtworkListResponse(BaseModel):
    artworks: list[ArtworkResponse]
    total: int
    page: int = 1
    page_size: int = 20