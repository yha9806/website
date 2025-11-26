"""
FastAPI Routes for Exhibition API
"""
import os
import logging
from datetime import datetime
from typing import List, Optional
from collections import Counter
from fastapi import APIRouter, HTTPException, Depends, Query, Security
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse

from ..services.lancedb_service import LanceDBService
from ..services.image_processor import ImageProcessor
from ..models.persona import get_all_personas, get_persona
from ..schemas import (
    ArtworkResponse,
    ArtworkListResponse,
    ArtistResponse,
    ArtistListResponse,
    ConversationResponse,
    ConversationListResponse,
    PersonaResponse,
    ChapterResponse,
    ExhibitionStatsResponse,
    SearchQuery,
    # Dialogue schemas
    DialogueTurnResponse,
    DialogueResponse,
    DialogueListResponse,
    DialogueExportResponse,
    DialogueQualityReport,
    LanguageStats,
    ParticipantStats
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/exhibition", tags=["Exhibition"])

# API Key authentication
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# Valid API keys (in production, store in database or secret manager)
VALID_API_KEYS = set(os.getenv("EXHIBITION_API_KEYS", "demo-key-12345").split(","))


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    """Verify API key for protected endpoints"""
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Include X-API-Key header."
        )
    if api_key not in VALID_API_KEYS:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key"
        )
    return api_key


def get_lancedb_service() -> LanceDBService:
    """Dependency for LanceDB service"""
    db_path = os.getenv("EXHIBITION_DB_PATH", "data/exhibition")
    return LanceDBService(db_path=db_path)


def _transform_artwork(artwork: dict) -> ArtworkResponse:
    """Transform LanceDB artwork to response schema"""
    image_urls = artwork.get("image_urls", [])
    if isinstance(image_urls, str):
        image_urls = ImageProcessor.parse_image_urls(image_urls)

    thumbnail_url = ""
    preview_url = ""
    if image_urls:
        thumbnail_url = ImageProcessor.get_thumbnail_url(image_urls[0], 300)
        preview_url = ImageProcessor.get_preview_url(image_urls[0], 800)

    return ArtworkResponse(
        id=artwork["id"],
        title=artwork.get("title", ""),
        description=artwork.get("description", ""),
        chapter_id=artwork.get("chapter_id", 0),
        chapter_name=artwork.get("chapter_name", ""),
        categories=artwork.get("categories", ""),
        medium=artwork.get("medium", ""),
        material=artwork.get("material", ""),
        size=artwork.get("size", ""),
        create_year=artwork.get("create_year", ""),
        image_urls=image_urls,
        custom_url=artwork.get("custom_url", ""),
        artist_id=artwork.get("artist_id", 0),
        thumbnail_url=thumbnail_url,
        preview_url=preview_url
    )


def _transform_artist(artist: dict) -> ArtistResponse:
    """Transform LanceDB artist to response schema"""
    return ArtistResponse(
        id=artist["id"],
        first_name=artist.get("first_name", ""),
        last_name=artist.get("last_name", ""),
        full_name=f"{artist.get('first_name', '')} {artist.get('last_name', '')}".strip(),
        nickname=artist.get("nickname", ""),
        school=artist.get("school", ""),
        major=artist.get("major", ""),
        graduation_year=artist.get("graduation_year", ""),
        profile=artist.get("profile", ""),
        bio=artist.get("bio", ""),
        email=artist.get("email", ""),
        avatar_url=artist.get("avatar_url", "")
    )


def _transform_conversation(conv: dict) -> ConversationResponse:
    """Transform LanceDB conversation to response schema"""
    return ConversationResponse(
        id=conv.get("id", ""),
        artwork_id=conv.get("artwork_id", 0),
        persona_id=conv.get("persona_id", ""),
        persona_name=conv.get("persona_name", ""),
        text_segments=conv.get("text_segments", []),
        structured_analysis=conv.get("structured_analysis", {}),
        created_at=conv.get("created_at"),
        model_used=conv.get("model_used", ""),
        image_analyzed=conv.get("image_analyzed", False)
    )


# ==================== Public Endpoints ====================

@router.get("/stats", response_model=ExhibitionStatsResponse)
async def get_stats(
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get exhibition statistics (public)"""
    stats = service.get_stats()
    chapters = service.get_chapters()
    personas = get_all_personas()

    return ExhibitionStatsResponse(
        artworks_count=stats["artworks_count"],
        artists_count=stats["artists_count"],
        conversations_count=stats["conversations_count"],
        chapters=[ChapterResponse(**ch) for ch in chapters],
        personas_count=len(personas)
    )


@router.get("/chapters", response_model=List[ChapterResponse])
async def get_chapters(
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get all chapters (public)"""
    chapters = service.get_chapters()
    return [ChapterResponse(**ch) for ch in chapters]


@router.get("/personas", response_model=List[PersonaResponse])
async def get_personas():
    """Get all available personas (public)"""
    personas = get_all_personas()
    return [
        PersonaResponse(
            id=p.id,
            name=p.name,
            name_cn=p.name_cn,
            type=p.type,
            era=p.era,
            region=p.region,
            description=p.description,
            style=p.style,
            attributes=p.attributes,
            sample_phrases=p.sample_phrases
        )
        for p in personas
    ]


@router.get("/personas/{persona_id}", response_model=PersonaResponse)
async def get_persona_detail(persona_id: str):
    """Get persona by ID (public)"""
    try:
        p = get_persona(persona_id)
        return PersonaResponse(
            id=p.id,
            name=p.name,
            name_cn=p.name_cn,
            type=p.type,
            era=p.era,
            region=p.region,
            description=p.description,
            style=p.style,
            attributes=p.attributes,
            sample_phrases=p.sample_phrases
        )
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Persona not found: {persona_id}")


# ==================== Protected Endpoints (require API Key) ====================

@router.get("/artworks", response_model=ArtworkListResponse)
async def get_artworks(
    chapter_name: Optional[str] = Query(None, description="Filter by chapter"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get artworks list with pagination and filtering"""
    artworks = service.get_artworks(
        chapter_name=chapter_name,
        limit=limit,
        offset=offset
    )

    # Get total count (simplified)
    all_artworks = service.get_artworks(chapter_name=chapter_name, limit=10000)
    total = len(all_artworks)

    return ArtworkListResponse(
        items=[_transform_artwork(a) for a in artworks],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/artworks/search")
async def search_artworks(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Semantic search for artworks"""
    results = service.search_artworks(query=q, limit=limit)
    return {
        "query": q,
        "results": [_transform_artwork(r) for r in results],
        "count": len(results)
    }


@router.get("/artworks/{artwork_id}", response_model=ArtworkResponse)
async def get_artwork(
    artwork_id: int,
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get artwork by ID"""
    artwork = service.get_artwork(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail=f"Artwork not found: {artwork_id}")
    return _transform_artwork(artwork)


@router.get("/artworks/{artwork_id}/conversations", response_model=ConversationListResponse)
async def get_artwork_conversations(
    artwork_id: int,
    persona_id: Optional[str] = Query(None, description="Filter by persona"),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get all conversations for an artwork"""
    # Verify artwork exists
    artwork = service.get_artwork(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail=f"Artwork not found: {artwork_id}")

    conversations = service.get_conversations_for_artwork(
        artwork_id=artwork_id,
        persona_id=persona_id
    )

    return ConversationListResponse(
        items=[_transform_conversation(c) for c in conversations],
        total=len(conversations),
        artwork_id=artwork_id
    )


@router.get("/conversations/search")
async def search_conversations(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Semantic search for conversations"""
    results = service.search_conversations(query=q, limit=limit)
    return {
        "query": q,
        "results": [_transform_conversation(r) for r in results],
        "count": len(results)
    }


@router.get("/artists", response_model=ArtistListResponse)
async def get_artists(
    limit: int = Query(100, ge=1, le=500),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get all artists"""
    artists = service.get_artists(limit=limit)
    return ArtistListResponse(
        items=[_transform_artist(a) for a in artists],
        total=len(artists)
    )


@router.get("/artists/{artist_id}", response_model=ArtistResponse)
async def get_artist(
    artist_id: int,
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get artist by ID"""
    artist = service.get_artist(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail=f"Artist not found: {artist_id}")
    return _transform_artist(artist)


@router.get("/artists/{artist_id}/artworks")
async def get_artist_artworks(
    artist_id: int,
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get artworks by artist"""
    # Verify artist exists
    artist = service.get_artist(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail=f"Artist not found: {artist_id}")

    # Get all artworks and filter by artist_id
    all_artworks = service.get_artworks(limit=1000)
    artist_artworks = [a for a in all_artworks if a.get("artist_id") == artist_id]

    return {
        "artist": _transform_artist(artist),
        "artworks": [_transform_artwork(a) for a in artist_artworks],
        "count": len(artist_artworks)
    }


# ==================== Multi-Agent Dialogue Endpoints ====================

@router.get("/artworks/{artwork_id}/dialogues")
async def get_artwork_dialogues(
    artwork_id: int,
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get all multi-agent dialogues for an artwork"""
    artwork = service.get_artwork(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail=f"Artwork not found: {artwork_id}")

    dialogues = service.get_dialogues_for_artwork(artwork_id)

    return {
        "artwork_id": artwork_id,
        "artwork_title": artwork.get("title", ""),
        "dialogues": dialogues,
        "count": len(dialogues)
    }


@router.get("/dialogues")
async def get_all_dialogues(
    limit: int = Query(100, ge=1, le=500),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get all multi-agent dialogues"""
    dialogues = service.get_all_dialogues(limit=limit)
    return {
        "dialogues": dialogues,
        "count": len(dialogues)
    }


@router.get("/dialogues/search")
async def search_dialogues(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Semantic search for dialogues"""
    results = service.search_dialogues(query=q, limit=limit)
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


@router.get("/dialogues/{dialogue_id}")
async def get_dialogue(
    dialogue_id: str,
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get a single dialogue by ID"""
    dialogue = service.get_dialogue(dialogue_id)
    if not dialogue:
        raise HTTPException(status_code=404, detail=f"Dialogue not found: {dialogue_id}")
    return dialogue


@router.get("/dialogues/{dialogue_id}/turns")
async def get_dialogue_turns(
    dialogue_id: str,
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get all turns from a dialogue"""
    dialogue = service.get_dialogue(dialogue_id)
    if not dialogue:
        raise HTTPException(status_code=404, detail=f"Dialogue not found: {dialogue_id}")

    return {
        "dialogue_id": dialogue_id,
        "artwork_title": dialogue.get("artwork_title", ""),
        "participants": dialogue.get("participant_names", []),
        "turns": dialogue.get("turns", []),
        "total_turns": dialogue.get("total_turns", 0)
    }


# ==================== Export Endpoints ====================

@router.get("/export/dialogues", response_model=DialogueExportResponse)
async def export_dialogues(
    multimodal_only: bool = Query(False, description="Export only multimodal dialogues"),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Export all dialogues to JSON format"""
    dialogues = service.get_all_dialogues(limit=1000)

    if multimodal_only:
        dialogues = [d for d in dialogues if d.get("image_analyzed", False)]

    return DialogueExportResponse(
        format="json",
        count=len(dialogues),
        exported_at=datetime.now().isoformat(),
        data=dialogues
    )


@router.get("/export/dialogues/sample")
async def export_sample_dialogues(
    count: int = Query(5, ge=1, le=20, description="Number of sample dialogues"),
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Export sample dialogues for quality review"""
    dialogues = service.get_all_dialogues(limit=1000)

    # Sample random dialogues
    import random
    samples = random.sample(dialogues, min(count, len(dialogues)))

    return {
        "count": len(samples),
        "exported_at": datetime.now().isoformat(),
        "samples": samples
    }


# ==================== Quality Report Endpoints ====================

@router.get("/dialogues/quality-report", response_model=DialogueQualityReport)
async def get_dialogue_quality_report(
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get comprehensive quality report for all dialogues"""
    dialogues = service.get_all_dialogues(limit=1000)
    stats = service.get_stats()

    total_dialogues = len(dialogues)
    multimodal_count = sum(1 for d in dialogues if d.get("image_analyzed", False))

    # Calculate turn statistics
    total_turns = sum(d.get("total_turns", 0) for d in dialogues)
    total_conflicts = sum(d.get("conflict_moments", 0) for d in dialogues)

    # Language statistics
    language_counter = Counter()
    for d in dialogues:
        for lang in d.get("languages_used", []):
            language_counter[lang] += 1

    total_language_refs = sum(language_counter.values())
    languages = [
        LanguageStats(
            language=lang,
            count=count,
            percentage=round(count / total_language_refs * 100, 2) if total_language_refs > 0 else 0
        )
        for lang, count in language_counter.most_common()
    ]

    # Participant statistics
    participant_counter = Counter()
    for d in dialogues:
        for name in d.get("participant_names", []):
            participant_counter[name] += 1

    total_participant_refs = sum(participant_counter.values())
    participants = [
        ParticipantStats(
            name=name,
            count=count,
            percentage=round(count / total_participant_refs * 100, 2) if total_participant_refs > 0 else 0
        )
        for name, count in participant_counter.most_common(10)
    ]

    # Coverage statistics
    artworks_count = stats.get("artworks_count", 0)
    dialogues_count = stats.get("dialogues_count", 0)

    return DialogueQualityReport(
        total_dialogues=total_dialogues,
        multimodal_dialogues=multimodal_count,
        multimodal_percentage=round(multimodal_count / total_dialogues * 100, 2) if total_dialogues > 0 else 0,
        total_turns=total_turns,
        avg_turns_per_dialogue=round(total_turns / total_dialogues, 2) if total_dialogues > 0 else 0,
        total_conflict_moments=total_conflicts,
        avg_conflicts_per_dialogue=round(total_conflicts / total_dialogues, 2) if total_dialogues > 0 else 0,
        languages=languages,
        participants=participants,
        artworks_with_dialogues=dialogues_count,
        artworks_without_dialogues=artworks_count - dialogues_count,
        coverage_percentage=round(dialogues_count / artworks_count * 100, 2) if artworks_count > 0 else 0,
        generated_at=datetime.now().isoformat()
    )


@router.get("/dialogues/statistics")
async def get_dialogue_statistics(
    api_key: str = Depends(verify_api_key),
    service: LanceDBService = Depends(get_lancedb_service)
):
    """Get quick dialogue statistics"""
    dialogues = service.get_all_dialogues(limit=1000)
    stats = service.get_stats()

    multimodal_count = sum(1 for d in dialogues if d.get("image_analyzed", False))

    return {
        "total_dialogues": len(dialogues),
        "multimodal_dialogues": multimodal_count,
        "text_only_dialogues": len(dialogues) - multimodal_count,
        "total_artworks": stats.get("artworks_count", 0),
        "coverage": f"{len(dialogues)}/{stats.get('artworks_count', 0)}",
        "generated_at": datetime.now().isoformat()
    }
