from sqlalchemy import Column, String, Float, Text, DateTime, Enum, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.core.config import settings
import uuid
import enum


class ArtworkType(str, enum.Enum):
    poem = "poem"
    painting = "painting"
    story = "story"
    music = "music"


class Artwork(Base):
    __tablename__ = "artworks"
    
    # Dynamic ID type based on database
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        model_id = Column(String, ForeignKey("ai_models.id"), nullable=False)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        model_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"), nullable=False)
    
    type = Column(Enum(ArtworkType), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)  # For poems and stories
    image_url = Column(String, nullable=True)  # For paintings
    prompt = Column(String, nullable=True)
    score = Column(Float, default=0.0, nullable=False)
    extra_metadata = Column(JSON, nullable=True)  # Additional information
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    model = relationship("AIModel", backref="artworks")