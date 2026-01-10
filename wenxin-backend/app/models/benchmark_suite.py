from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, Integer, Float, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base
from app.core.config import settings


class BenchmarkStatus(str, enum.Enum):
    """Benchmark test status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BenchmarkSuite(Base):
    __tablename__ = "benchmark_suites"
    
    # Use String for SQLite, UUID for PostgreSQL
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    version = Column(String(20), default="1.0")
    
    # Test configuration
    task_type = Column(String(50), nullable=False)  # poem, story, painting, music
    test_cases = Column(JSON, nullable=False)  # List of test prompts and expected outputs
    evaluation_criteria = Column(JSON, nullable=False)  # Scoring rubrics
    difficulty_level = Column(String(20), default="medium")  # easy, medium, hard, expert
    
    # Execution settings
    auto_run = Column(Boolean, default=False)  # Whether to run automatically
    run_frequency = Column(String(20), default="weekly")  # daily, weekly, monthly
    max_retries = Column(Integer, default=3)
    timeout_seconds = Column(Integer, default=300)
    
    # Status tracking
    status = Column(SQLEnum(BenchmarkStatus), default=BenchmarkStatus.PENDING)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    run_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    
    # Results
    latest_results = Column(JSON, default={})  # Most recent test results
    historical_scores = Column(JSON, default=[])  # Array of past scores with timestamps
    average_score = Column(Float, nullable=True)
    
    # Metadata
    tags = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)  # Whether results are publicly visible
    created_by = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    from sqlalchemy.orm import relationship
    benchmark_runs = relationship("BenchmarkRun", back_populates="suite", cascade="all, delete-orphan")


class BenchmarkRun(Base):
    """Individual benchmark test run"""
    __tablename__ = "benchmark_runs"
    
    # Use String for SQLite, UUID for PostgreSQL  
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        suite_id = Column(String, ForeignKey('benchmark_suites.id', ondelete='CASCADE'), nullable=False, index=True)
        model_id = Column(String, ForeignKey('ai_models.id', ondelete='CASCADE'), nullable=False, index=True)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        suite_id = Column(UUID(as_uuid=True), ForeignKey('benchmark_suites.id', ondelete='CASCADE'), nullable=False, index=True)
        model_id = Column(UUID(as_uuid=True), ForeignKey('ai_models.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Execution details
    status = Column(SQLEnum(BenchmarkStatus), default=BenchmarkStatus.PENDING)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    
    # Test results
    test_results = Column(JSON, default=[])  # Array of individual test case results
    scores_by_criteria = Column(JSON, default={})  # Scores for each evaluation criterion
    overall_score = Column(Float, nullable=True)
    
    # Performance metrics
    response_times = Column(JSON, default=[])  # Array of response times for each test
    average_response_time = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)  # In MB
    token_usage = Column(JSON, default={})  # Input/output token counts
    
    # Error tracking
    error_count = Column(Integer, default=0)
    error_details = Column(JSON, default=[])
    
    # Comparison data
    rank_in_suite = Column(Integer, nullable=True)  # Rank among all models for this suite
    percentile = Column(Float, nullable=True)  # Percentile score (0-100)
    
    # Metadata
    environment_info = Column(JSON, default={})  # System info, versions, etc.
    notes = Column(Text, nullable=True)
    
    # Relationships
    from sqlalchemy.orm import relationship
    
    suite = relationship("BenchmarkSuite", back_populates="benchmark_runs")
    model = relationship("AIModel", backref="benchmark_runs")