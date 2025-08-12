import uuid
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.config import settings
from app.core.database import Base


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class EvaluationTask(Base):
    __tablename__ = "evaluation_tasks"
    
    # Dynamic ID type based on database
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        model_id = Column(String, ForeignKey("ai_models.id"))
        user_id = Column(String, ForeignKey("users.id"), nullable=True)
        guest_id = Column(String, nullable=True)  # For guest users
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"))
        user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
        guest_id = Column(String, nullable=True)  # For guest users
    
    # Task details
    task_type = Column(String, nullable=False)  # poem, story, painting, music
    prompt = Column(Text, nullable=False)
    language = Column(String, default="zh")  # zh, en, both
    parameters = Column(JSON, default={})  # Additional parameters for generation
    
    # Status and timing
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    progress = Column(Float, default=0.0)  # Progress percentage (0-100)
    current_stage = Column(String, nullable=True)  # Current processing stage description
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Results
    result = Column(JSON, nullable=True)  # Generated content
    raw_response = Column(JSON, nullable=True)  # Full API response
    error_message = Column(Text, nullable=True)
    
    # Evaluation scores
    auto_score = Column(Float, nullable=True)  # Automatic evaluation score (0-100)
    human_score = Column(Float, nullable=True)  # Human evaluation score (0-100)
    final_score = Column(Float, nullable=True)  # Combined final score
    
    # Evaluation details
    evaluation_metrics = Column(JSON, nullable=True)  # Detailed metrics
    evaluation_notes = Column(Text, nullable=True)  # Human notes
    
    # Relationships
    model = relationship("AIModel", back_populates="evaluation_tasks")
    user = relationship("User", back_populates="evaluation_tasks")