from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskType(str, Enum):
    POEM = "poem"
    STORY = "story"
    PAINTING = "painting"
    MUSIC = "music"


class EvaluationTaskBase(BaseModel):
    model_id: str
    task_type: TaskType
    prompt: str
    parameters: Optional[Dict[str, Any]] = {}


class EvaluationTaskCreate(EvaluationTaskBase):
    pass


class EvaluationTaskUpdate(BaseModel):
    human_score: Optional[float] = None
    evaluation_notes: Optional[str] = None


class EvaluationTaskInDB(EvaluationTaskBase):
    id: str
    status: TaskStatus
    progress: Optional[float] = 0.0
    current_stage: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    auto_score: Optional[float] = None
    human_score: Optional[float] = None
    final_score: Optional[float] = None
    evaluation_metrics: Optional[Dict[str, Any]] = None
    evaluation_notes: Optional[str] = None
    user_id: Optional[str] = None
    guest_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class EvaluationTaskResponse(EvaluationTaskInDB):
    model_name: Optional[str] = None
    model_organization: Optional[str] = None