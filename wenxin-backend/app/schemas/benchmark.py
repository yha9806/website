"""
Benchmark system Pydantic schemas
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.benchmark_suite import BenchmarkStatus


class BenchmarkSuiteBase(BaseModel):
    """Base benchmark suite schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    version: str = Field(default="1.0", max_length=20)
    task_type: str = Field(..., max_length=50)
    test_cases: List[Dict[str, Any]] = Field(..., min_items=1)
    evaluation_criteria: Dict[str, Any]
    difficulty_level: str = Field(default="medium", max_length=20)
    auto_run: bool = Field(default=False)
    run_frequency: str = Field(default="weekly", max_length=20)
    max_retries: int = Field(default=3, ge=1, le=10)
    timeout_seconds: int = Field(default=300, ge=30, le=3600)
    tags: List[str] = Field(default=[])
    is_active: bool = Field(default=True)
    is_public: bool = Field(default=True)


class BenchmarkSuiteCreate(BenchmarkSuiteBase):
    """Schema for creating benchmark suites"""
    pass


class BenchmarkSuiteResponse(BenchmarkSuiteBase):
    """Schema for benchmark suite responses"""
    id: str
    status: BenchmarkStatus
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    run_count: int = 0
    success_count: int = 0
    failure_count: int = 0
    latest_results: Dict[str, Any] = {}
    historical_scores: List[Dict[str, Any]] = []
    average_score: Optional[float] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BenchmarkRunBase(BaseModel):
    """Base benchmark run schema"""
    suite_id: str
    model_id: str
    notes: Optional[str] = None


class BenchmarkRunCreate(BenchmarkRunBase):
    """Schema for creating benchmark runs"""
    pass


class BenchmarkRunResponse(BenchmarkRunBase):
    """Schema for benchmark run responses"""
    id: str
    status: BenchmarkStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    test_results: List[Dict[str, Any]] = []
    scores_by_criteria: Dict[str, float] = {}
    overall_score: Optional[float] = None
    response_times: List[float] = []
    average_response_time: Optional[float] = None
    memory_usage: Optional[float] = None
    token_usage: Dict[str, Any] = {}
    error_count: int = 0
    error_details: List[Dict[str, Any]] = []
    rank_in_suite: Optional[int] = None
    percentile: Optional[float] = None
    environment_info: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class RealTimeRankingResponse(BaseModel):
    """Schema for real-time ranking responses"""
    model_id: str
    model_name: str
    organization: str
    category: Optional[str] = None
    rank: int
    total_score: float
    confidence_level: float
    data_sources: List[str]
    score_breakdown: Dict[str, float]
    confidence_breakdown: Dict[str, float]
    last_updated: str


class DataSourceStats(BaseModel):
    """Schema for data source statistics"""
    mock_models: int = 0
    real_models: int = 0
    benchmark_models: int = 0
    total_models: int = 0


class BenchmarkDashboardStats(BaseModel):
    """Schema for benchmark dashboard statistics"""
    total_suites: int
    active_suites: int
    total_runs: int
    completed_runs: int
    success_rate: float
    benchmark_verified_models: int
    data_source_stats: Optional[DataSourceStats] = None


class ModelConfidenceUpdate(BaseModel):
    """Schema for updating model confidence"""
    model_id: str
    data_source: str = Field(..., pattern="^(mock|real|benchmark)$")
    confidence_level: float = Field(..., ge=0.0, le=1.0)
    verification_count: int = Field(default=0, ge=0)
    benchmark_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    benchmark_metadata: Dict[str, Any] = Field(default={})