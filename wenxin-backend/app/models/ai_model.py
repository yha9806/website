from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base
from app.core.config import settings


class AIModel(Base):
    __tablename__ = "ai_models"
    
    # Use String for SQLite, UUID for PostgreSQL
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    organization = Column(String(100))
    version = Column(String(20))
    category = Column(String(50))  # text, multimodal, etc.
    description = Column(Text)
    api_endpoint = Column(String(500))
    api_key_encrypted = Column(Text)  # Encrypted API key if needed
    
    # Scores
    overall_score = Column(Float, default=0.0)
    metrics = Column(JSON, default={})  # Store all metrics as JSON
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    release_date = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional metadata
    tags = Column(JSON, default=[])
    avatar_url = Column(String(500))