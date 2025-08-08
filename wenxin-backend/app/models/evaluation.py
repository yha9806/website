from sqlalchemy import Column, String, DateTime, Text, Float, JSON, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.config import settings


class EvaluationTask(Base):
    __tablename__ = "evaluation_tasks"
    
    # Use String for SQLite, UUID for PostgreSQL
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        model_id = Column(String, ForeignKey("ai_models.id"), nullable=False)
        user_id = Column(String, ForeignKey("users.id"))
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"), nullable=False)
        user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    task_type = Column(String(50), nullable=False)  # poem, painting, narrative
    prompt = Column(Text, nullable=False)
    category = Column(String(50))
    difficulty = Column(String(20))  # easy, medium, hard
    
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Results
    result = Column(JSON)
    error_message = Column(Text)
    
    # Relationships
    model = relationship("AIModel", backref="evaluation_tasks")
    user = relationship("User", backref="evaluation_tasks")


class EvaluationDimension(Base):
    __tablename__ = "evaluation_dimensions"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    category = Column(String(50))
    weight = Column(Float, default=1.0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    
    # Use String for SQLite, UUID for PostgreSQL
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        task_id = Column(String, ForeignKey("evaluation_tasks.id"), nullable=False)
        work_id = Column(String, ForeignKey("works.id"))
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        task_id = Column(UUID(as_uuid=True), ForeignKey("evaluation_tasks.id"), nullable=False)
        work_id = Column(UUID(as_uuid=True), ForeignKey("works.id"))
    dimension_id = Column(Integer, ForeignKey("evaluation_dimensions.id"))
    
    score = Column(Float, nullable=False)
    ai_feedback = Column(Text)
    expert_feedback = Column(Text)
    user_votes = Column(Integer, default=0)
    
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())
    evaluator_type = Column(String(20))  # ai, expert, user
    
    # Relationships
    task = relationship("EvaluationTask", backref="results")
    dimension = relationship("EvaluationDimension", backref="results")