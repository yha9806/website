from pydantic import BaseModel, Field, ConfigDict
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
    tags: Optional[List[str]] = []
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
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: UUID
    overall_score: Optional[float] = None  # Allow NULL for image models
    metrics: Optional[ModelMetrics] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]


class AIModelResponse(AIModelBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: str
    overall_score: Optional[float] = None  # Allow NULL for image models
    metrics: Optional[ModelMetrics] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # New benchmark system fields
    data_source: str = "mock"  # mock, real, benchmark, not_applicable
    verification_count: int = 0
    benchmark_score: Optional[float] = None
    benchmark_metadata: Optional[Dict] = None  # Allow NULL for models without benchmark data
    confidence_level: float = 0.0
    last_benchmark_at: Optional[datetime] = None
    
    # New fields for model type separation
    model_type: Optional[str] = None  # llm, image, multimodal
    model_tier: Optional[str] = None  # flagship, professional, efficient, lightweight
    llm_rank: Optional[int] = None
    image_rank: Optional[int] = None
    
    # VULCA evaluation fields (optional, included when include_vulca=true)
    vulca_scores_47d: Optional[Dict] = None
    vulca_cultural_perspectives: Optional[Dict] = None
    vulca_evaluation_date: Optional[datetime] = None
    vulca_sync_status: Optional[str] = None


class AIModelWithStats(AIModel):
    total_evaluations: int = 0
    total_battles: int = 0
    win_rate: float = 0.0
    recent_works: List[Dict] = []
    
    # Individual metric scores for radar chart
    rhythm_score: Optional[float] = None
    composition_score: Optional[float] = None
    narrative_score: Optional[float] = None
    emotion_score: Optional[float] = None
    creativity_score: Optional[float] = None
    cultural_score: Optional[float] = None
    
    # Full benchmark results with response texts
    benchmark_results: Optional[str] = None  # JSON string of detailed test results
    
    # VULCA evaluation fields
    vulca_scores_47d: Optional[Dict] = None
    vulca_cultural_perspectives: Optional[Dict] = None
    vulca_evaluation_date: Optional[datetime] = None
    vulca_sync_status: Optional[str] = None
