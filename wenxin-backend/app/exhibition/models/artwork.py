"""
Artwork data model for LanceDB
"""
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, timezone


class ArtworkCreate(BaseModel):
    """Input model for creating artwork"""
    id: int
    title: str
    description: str
    chapter_id: int
    chapter_name: str
    categories: str = ""
    medium: str = ""
    material: str = ""
    size: str = ""
    create_year: str = ""
    image_urls: List[str] = Field(default_factory=list)
    custom_url: str = ""
    artist_id: int


class Artwork(ArtworkCreate):
    """Full artwork model with vector embedding"""
    vector: List[float] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": 1759494368418,
            "title": "The Whistled Valley",
            "description": "A 20-minute Ambisonic sound composition...",
            "chapter_id": 10001,
            "chapter_name": "Cultural Transmission & Regeneration",
            "categories": "sound,sound art",
            "medium": "Sound art",
            "material": "sound",
            "size": "20 min",
            "image_urls": ["https://..."],
            "custom_url": "https://youtu.be/...",
            "artist_id": 1759487975031,
            "vector": [0.1, 0.2, ...]
        }
    })
