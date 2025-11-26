"""
Artist data model for LanceDB
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ArtistCreate(BaseModel):
    """Input model for creating artist"""
    id: int
    first_name: str
    last_name: str
    nickname: str = ""
    school: str = ""
    major: str = ""
    graduation_year: str = ""
    profile: str = ""
    bio: str = ""
    email: str = ""
    avatar_url: str = ""


class Artist(ArtistCreate):
    """Full artist model with vector embedding"""
    vector: List[float] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1759487975031,
                "first_name": "Jiaye",
                "last_name": "Wang",
                "nickname": "MauVMZmOQP",
                "school": "UCL",
                "major": "Designing Audio Experience",
                "graduation_year": "2025",
                "profile": "sound artist and musician",
                "bio": "Jiaye Wang (*2003) is a sound artist...",
                "email": "jiaye.wang@gmail.com",
                "avatar_url": "",
                "vector": [0.1, 0.2, ...]
            }
        }
