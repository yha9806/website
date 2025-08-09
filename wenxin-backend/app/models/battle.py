from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.core.config import settings
import uuid
import enum


class BattleStatus(str, enum.Enum):
    active = "active"
    completed = "completed"


class TaskType(str, enum.Enum):
    poem = "poem"
    painting = "painting"
    story = "story"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class VoteChoice(str, enum.Enum):
    model_a = "model_a"
    model_b = "model_b"


class Battle(Base):
    __tablename__ = "battles"

    # Dynamic ID type based on database
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        model_a_id = Column(String, ForeignKey("ai_models.id"), nullable=False)
        model_b_id = Column(String, ForeignKey("ai_models.id"), nullable=False)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        model_a_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"), nullable=False)
        model_b_id = Column(UUID(as_uuid=True), ForeignKey("ai_models.id"), nullable=False)
    
    task_type = Column(Enum(TaskType), nullable=False)
    task_prompt = Column(String, nullable=False)
    task_category = Column(String, nullable=False)
    difficulty = Column(Enum(Difficulty), nullable=False)
    votes_a = Column(Integer, default=0, nullable=False)
    votes_b = Column(Integer, default=0, nullable=False)
    status = Column(Enum(BattleStatus), default=BattleStatus.active, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    model_a = relationship("AIModel", foreign_keys=[model_a_id], backref="battles_as_a")
    model_b = relationship("AIModel", foreign_keys=[model_b_id], backref="battles_as_b")
    votes = relationship("BattleVote", back_populates="battle", cascade="all, delete-orphan")


class BattleVote(Base):
    __tablename__ = "battle_votes"
    
    # Dynamic ID type based on database
    if settings.DATABASE_URL.startswith("sqlite"):
        id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
        battle_id = Column(String, ForeignKey("battles.id", ondelete="CASCADE"), nullable=False)
        user_id = Column(String, ForeignKey("users.id"), nullable=True)
    else:
        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        battle_id = Column(UUID(as_uuid=True), ForeignKey("battles.id", ondelete="CASCADE"), nullable=False)
        user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    voter_ip = Column(String, nullable=False)
    vote_for = Column(Enum(VoteChoice), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Relationships
    battle = relationship("Battle", back_populates="votes")
    user = relationship("User", backref="battle_votes")