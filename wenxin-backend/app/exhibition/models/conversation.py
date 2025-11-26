"""
Conversation data model for LanceDB
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class ConversationCreate(BaseModel):
    """Input model for creating conversation"""
    artwork_id: int
    persona_id: str  # 'basic' or persona name like 'su_shi'
    persona_name: str
    text_segments: List[str] = Field(default_factory=list)
    structured_analysis: Dict[str, Any] = Field(default_factory=dict)
    image_analyzed: bool = False  # Whether image was analyzed during generation
    model_used: str = ""  # Claude model used for generation


class Conversation(ConversationCreate):
    """Full conversation model with vector embedding"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vector: List[float] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-string",
                "artwork_id": 1759494368418,
                "persona_id": "su_shi",
                "persona_name": "Su Shi",
                "text_segments": [
                    "TEXT: This sound composition resonates...",
                    "TEXT: The artist's use of spatial audio..."
                ],
                "structured_analysis": {
                    "artwork_identifier": "The Whistled Valley",
                    "evaluative_stance": {},
                    "core_focal_points": []
                },
                "vector": [0.1, 0.2, ...],
                "model_used": "claude-sonnet-4-5-20250929",
                "image_analyzed": True
            }
        }
