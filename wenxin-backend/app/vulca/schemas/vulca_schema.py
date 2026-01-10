"""
VULCA Pydantic Schemas
Request and response models for VULCA API endpoints
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

class VULCAScore6D(BaseModel):
    """6-dimensional base scores"""
    creativity: float = Field(..., ge=0, le=100, description="Creativity score")
    technique: float = Field(..., ge=0, le=100, description="Technical skill score")
    emotion: float = Field(..., ge=0, le=100, description="Emotional expression score")
    context: float = Field(..., ge=0, le=100, description="Contextual awareness score")
    innovation: float = Field(..., ge=0, le=100, description="Innovation score")
    impact: float = Field(..., ge=0, le=100, description="Impact and influence score")
    
    model_config = ConfigDict(from_attributes=True)

class VULCAEvaluationRequest(BaseModel):
    """Request model for model evaluation"""
    model_id: Union[int, str] = Field(..., description="Unique model identifier (integer or UUID)")
    model_name: Optional[str] = Field(None, description="Model name")
    scores_6d: VULCAScore6D = Field(..., description="6-dimensional base scores")
    
    model_config = ConfigDict(from_attributes=True)

class VULCAEvaluationResponse(BaseModel):
    """Response model for model evaluation"""
    model_id: Union[int, str]
    model_name: str
    scores_6d: Dict[str, float]
    scores_47d: Dict[str, float]
    cultural_perspectives: Dict[str, float]
    evaluation_date: str
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)

class VULCAComparisonRequest(BaseModel):
    """Request model for model comparison"""
    model_ids: List[Union[int, str]] = Field(..., min_length=2, max_length=10, description="List of model IDs to compare (integer or UUID)")
    include_details: bool = Field(True, description="Include detailed scores in response")
    
    model_config = ConfigDict(from_attributes=True)

class VULCAModelSummary(BaseModel):
    """Summary of a model in comparison"""
    model_id: Union[int, str]
    model_name: str
    scores_47d: Optional[Dict[str, float]] = None
    cultural_scores: Optional[Dict[str, float]] = None
    
    model_config = ConfigDict(from_attributes=True)

class VULCAComparisonSummary(BaseModel):
    """Summary statistics for comparison"""
    most_similar: Dict[str, Any]
    most_different: Dict[str, Any]
    average_difference: float
    dimension_statistics: Optional[Dict[str, List[float]]] = None
    cultural_analysis: Optional[Dict[str, Dict[str, Any]]] = None
    
    model_config = ConfigDict(from_attributes=True)

class VULCAComparisonResponse(BaseModel):
    """Response model for model comparison"""
    models: List[Dict[str, Any]]
    difference_matrix: List[List[float]]
    summary: Dict[str, Any]
    comparison_date: str
    
    model_config = ConfigDict(from_attributes=True)

class VULCADimensionInfo(BaseModel):
    """Information about a single dimension"""
    id: str
    name: str
    category: str
    description: str
    weight: float
    
    model_config = ConfigDict(from_attributes=True)

class VULCACulturalPerspective(BaseModel):
    """Information about a cultural perspective"""
    id: str
    name: str
    description: str
    weight_range: str
    
    model_config = ConfigDict(from_attributes=True)

class VULCAHistoryItem(BaseModel):
    """Single evaluation history item"""
    evaluation_id: int
    model_id: int
    model_name: str
    scores_6d: Dict[str, float]
    scores_47d: Dict[str, float]
    cultural_perspectives: Dict[str, float]
    evaluation_date: str
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(from_attributes=True)

class VULCAHistoryResponse(BaseModel):
    """Response model for evaluation history"""
    model_id: int
    total_evaluations: int
    evaluations: List[VULCAHistoryItem]
    
    model_config = ConfigDict(from_attributes=True)