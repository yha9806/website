from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime


class ModelMetrics(BaseModel):
    rhythm: float = Field(0, ge=0, le=100)
    composition: float = Field(0, ge=0, le=100)
    narrative: float = Field(0, ge=0, le=100)
    emotion: float = Field(0, ge=0, le=100)
    creativity: float = Field(0, ge=0, le=100)
    cultural: float = Field(0, ge=0, le=100)


class AIModelBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    organization: Optional[str] = None
    version: Optional[str] = None
    category: str = Field(..., description="Model category: text, multimodal, etc.")
    description: Optional[str] = None
    release_date: Optional[str] = None
    tags: List[str] = []
    avatar_url: Optional[str] = None


class AIModelCreate(AIModelBase):
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None


class AIModelUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    version: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    release_date: Optional[str] = None
    tags: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class AIModel(AIModelBase):
    id: UUID
    overall_score: float
    metrics: ModelMetrics
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AIModelResponse(AIModelBase):
    id: str
    overall_score: float
    metrics: ModelMetrics
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class AIModelWithStats(AIModel):
    total_evaluations: int = 0
    total_battles: int = 0
    win_rate: float = 0.0
    recent_works: List[Dict] = []