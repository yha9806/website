"""
Pydantic Schemas for Exhibition API
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# ==================== Pagination ====================

class PaginationParams(BaseModel):
    """Pagination parameters"""
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


# ==================== Search ====================

class SearchQuery(BaseModel):
    """Search query parameters"""
    q: str = Field(..., min_length=1, description="Search query text")
    limit: int = Field(default=10, ge=1, le=50)


# ==================== Artwork ====================

class ArtworkResponse(BaseModel):
    """Artwork response schema"""
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
    # Computed fields
    thumbnail_url: str = ""
    preview_url: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1759494368418,
                "title": "The Whistled Valley",
                "description": "A 20-minute Ambisonic sound composition...",
                "chapter_name": "Cultural Transmission & Regeneration",
                "image_urls": ["https://..."],
                "thumbnail_url": "https://...?x-oss-process=image/resize/w_300",
                "artist_id": 1759487975031
            }
        }


class ArtworkListResponse(BaseModel):
    """Artwork list response"""
    items: List[ArtworkResponse]
    total: int
    limit: int
    offset: int


# ==================== Artist ====================

class ArtistResponse(BaseModel):
    """Artist response schema"""
    id: int
    first_name: str
    last_name: str
    full_name: str = ""
    nickname: str = ""
    school: str = ""
    major: str = ""
    graduation_year: str = ""
    profile: str = ""
    bio: str = ""
    email: str = ""
    avatar_url: str = ""

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1759487975031,
                "first_name": "Jiaye",
                "last_name": "Wang",
                "full_name": "Jiaye Wang",
                "school": "UCL",
                "major": "Designing Audio Experience"
            }
        }


class ArtistListResponse(BaseModel):
    """Artist list response"""
    items: List[ArtistResponse]
    total: int


# ==================== Conversation ====================

class ConversationResponse(BaseModel):
    """Conversation response schema"""
    id: str
    artwork_id: int
    persona_id: str
    persona_name: str
    text_segments: List[str]
    structured_analysis: Dict[str, Any]
    created_at: Optional[datetime] = None
    model_used: str = ""
    image_analyzed: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid-string",
                "artwork_id": 1759494368418,
                "persona_id": "su_shi",
                "persona_name": "Su Shi",
                "text_segments": [
                    "This sound composition resonates deeply with the principles of 神韵...",
                    "The artist's approach to capturing intangible heritage..."
                ],
                "structured_analysis": {
                    "artwork_identifier": "The Whistled Valley",
                    "evaluative_stance": {
                        "overall_assessment": "positive"
                    }
                }
            }
        }


class ConversationListResponse(BaseModel):
    """Conversation list response"""
    items: List[ConversationResponse]
    total: int
    artwork_id: int


# ==================== Persona ====================

class PersonaResponse(BaseModel):
    """Persona response schema"""
    id: str
    name: str
    name_cn: str = ""
    type: str
    era: str = ""
    region: str = ""
    description: str
    style: str
    attributes: Dict[str, float] = Field(default_factory=dict)
    sample_phrases: List[str] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "su_shi",
                "name": "Su Shi",
                "name_cn": "苏轼",
                "type": "real",
                "era": "Northern Song Dynasty",
                "description": "Renowned Chinese poet, writer, and painter",
                "style": "Values spiritual resonance over physical likeness"
            }
        }


# ==================== Chapter ====================

class ChapterResponse(BaseModel):
    """Chapter response schema"""
    id: int
    name: str
    count: int

    class Config:
        json_schema_extra = {
            "example": {
                "id": 10001,
                "name": "Cultural Transmission & Regeneration",
                "count": 26
            }
        }


# ==================== Stats ====================

class ExhibitionStatsResponse(BaseModel):
    """Exhibition statistics response"""
    artworks_count: int
    artists_count: int
    conversations_count: int
    chapters: List[ChapterResponse]
    personas_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "artworks_count": 87,
                "artists_count": 85,
                "conversations_count": 783,
                "chapters": [
                    {"id": 10001, "name": "Cultural Transmission", "count": 26}
                ],
                "personas_count": 9
            }
        }


# ==================== Multi-Agent Dialogue ====================

class DialogueTurnResponse(BaseModel):
    """Single dialogue turn response"""
    turn_number: int
    speaker_id: str
    speaker_name: str
    content: str
    language: str = "en"
    response_type: str = "elaborate"
    timestamp: Optional[str] = None


class VisualTagsResponse(BaseModel):
    """Visual analysis tags"""
    composition: str = ""
    color_palette: str = ""
    technique: str = ""
    mood: str = ""
    subject: str = ""


class PerturbationConfigResponse(BaseModel):
    """Input perturbation configuration"""
    temperature: float = 1.0
    input_variation: int = 0
    conflict_injected: bool = False


class DialogueResponse(BaseModel):
    """Multi-agent dialogue response schema"""
    id: str
    artwork_id: int
    artwork_url: str = ""
    artwork_title: str = ""
    image_url: str = ""
    participants: List[str] = Field(default_factory=list)
    participant_names: List[str] = Field(default_factory=list)
    topic: str = ""
    turns: List[DialogueTurnResponse] = Field(default_factory=list)
    total_turns: int = 0
    languages_used: List[str] = Field(default_factory=list)
    conflict_moments: int = 0
    model_used: str = ""
    temperature: float = 1.0
    created_at: Optional[str] = None
    # Multimodal fields
    image_analyzed: bool = False
    visual_analysis: str = ""
    visual_tags: Optional[VisualTagsResponse] = None
    image_refs: List[str] = Field(default_factory=list)
    perturbation_config: Optional[PerturbationConfigResponse] = None


class DialogueListResponse(BaseModel):
    """Dialogue list response"""
    items: List[DialogueResponse]
    total: int


class DialogueExportResponse(BaseModel):
    """Dialogue export response"""
    format: str
    count: int
    exported_at: str
    data: List[Dict[str, Any]]


# ==================== Quality Report ====================

class LanguageStats(BaseModel):
    """Language usage statistics"""
    language: str
    count: int
    percentage: float


class ParticipantStats(BaseModel):
    """Participant usage statistics"""
    name: str
    count: int
    percentage: float


class DialogueQualityReport(BaseModel):
    """Dialogue quality and statistics report"""
    total_dialogues: int
    multimodal_dialogues: int
    multimodal_percentage: float
    total_turns: int
    avg_turns_per_dialogue: float
    total_conflict_moments: int
    avg_conflicts_per_dialogue: float
    languages: List[LanguageStats]
    participants: List[ParticipantStats]
    artworks_with_dialogues: int
    artworks_without_dialogues: int
    coverage_percentage: float
    generated_at: str
