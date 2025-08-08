from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.config import settings


class Work(Base):
    __tablename__ = "works"
    
    # Use String for SQLite, UUID for PostgreSQL
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        model_id = Column(String, ForeignKey("ai_models.id"), nullable=False)
        task_id = Column(String, ForeignKey("evaluation_tasks.id"))
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"), nullable=False)
        task_id = Column(UUID(as_uuid=True), ForeignKey("evaluation_tasks.id"))
    
    type = Column(String(50), nullable=False)  # poem, painting, story, music
    title = Column(String(200))
    content = Column(Text, nullable=False)
    
    # For multimodal works
    file_url = Column(String(500))  # URL to image/audio file
    thumbnail_url = Column(String(500))
    
    # Metadata
    work_metadata = Column(JSON, default={})  # Renamed to avoid SQLAlchemy conflict
    vector_id = Column(String(100))  # ID in vector database
    
    # Stats
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    model = relationship("AIModel", backref="works")
    task = relationship("EvaluationTask", backref="works")