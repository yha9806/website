from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum
from .ai_model import AIModelResponse


class BattleStatus(str, Enum):
    active = "active"
    completed = "completed"


class TaskType(str, Enum):
    poem = "poem"
    painting = "painting"
    story = "story"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class VoteChoice(str, Enum):
    model_a = "model_a"
    model_b = "model_b"


class BattleCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    model_a_id: str
    model_b_id: str
    task_type: TaskType
    task_prompt: str
    task_category: str
    difficulty: Difficulty


class BattleVoteRequest(BaseModel):
    vote_for: VoteChoice


class BattleVoteResponse(BaseModel):
    success: bool
    message: str
    votes_a: int
    votes_b: int


class BattleResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    id: str
    model_a: AIModelResponse
    model_b: AIModelResponse
    task_type: TaskType
    task_prompt: str
    task_category: str
    difficulty: Difficulty
    votes_a: int
    votes_b: int
    status: BattleStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class BattleListResponse(BaseModel):
    battles: list[BattleResponse]
    total: int
    page: int = 1
    page_size: int = 20