"""Unified /create endpoint — single entry point for both creation and evaluation.

Has image → evaluate mode (MetaOrchestrator).
No image  → create mode  (PipelineOrchestrator full cycle).

Supports both synchronous JSON and SSE streaming responses.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
import time
import uuid
from threading import Thread

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.prototype.api.auth import verify_api_key
from app.prototype.orchestrator.events import EventType, PipelineEvent
from app.prototype.session.store import SessionStore
from app.prototype.session.types import RoundSnapshot, SessionDigest

logger = logging.getLogger("vulca")

create_router = APIRouter(prefix="/api/v1", tags=["create"])


def _extract_cultural_features(tradition: str, final_scores: dict[str, float], risk_flags: list[str]) -> dict[str, float]:
    """Extract cultural features from session results (rule-based, no LLM call)."""
    features: dict[str, float] = {}

    if not final_scores:
        return features

    # Tradition specificity: how specific is this tradition (non-default = more specific)
    features["tradition_specificity"] = 0.3 if tradition == "default" else 0.8

    # L5 emphasis: ratio of L5 to max score
    score_values = [v for v in final_scores.values() if isinstance(v, (int, float)) and v > 0]
    if score_values:
        max_score = max(score_values)
        l5 = final_scores.get("L5", final_scores.get("philosophical_aesthetic", 0.0))
        if isinstance(l5, (int, float)) and max_score > 0:
            features["l5_emphasis"] = round(l5 / max_score, 4)

        # Overall quality
        features["avg_score"] = round(sum(score_values) / len(score_values), 4)

    # Risk level
    features["risk_level"] = round(min(1.0, len(risk_flags) * 0.25), 4)

    # Cultural depth: based on L3 score
    l3 = final_scores.get("L3", final_scores.get("cultural_context", 0.0))
    if isinstance(l3, (int, float)):
        features["cultural_depth"] = round(l3, 4)

    return features


# In-memory event buffers for SSE (mirrors routes.py pattern)
_create_event_buffers: dict[str, list[PipelineEvent]] = {}
_create_buffer_lock = threading.Lock()


class CreateRequest(BaseModel):
    """Unified creation request."""

    intent: str = Field(default="", description="Natural language creation/evaluation intent")
    image_url: str | None = Field(default=None, description="Image URL for evaluation mode")
    image_base64: str | None = Field(default=None, description="Base64-encoded image for evaluation mode")
    tradition: str = Field(default="default", description="Cultural tradition")
    subject: str = Field(default="", description="Artwork subject/title")
    stream: bool = Field(default=False, description="Enable SSE streaming")

    # User identification
    user_type: str = Field(default="human", description="User type: human | agent")

    # Pipeline config (create mode only)
    provider: str = Field(default="nb2", description="Image generation provider")
    n_candidates: int = Field(default=4, ge=1, le=6)
    max_rounds: int = Field(default=3, ge=1, le=5)
    enable_agent_critic: bool = Field(default=True)


class CreateResponse(BaseModel):
    """Unified creation response (synchronous mode)."""

    session_id: str
    mode: str  # "create" | "evaluate"
    tradition: str = "default"

    # Evaluate mode fields
    scores: dict[str, float] | None = None
    weighted_total: float | None = None
    summary: str | None = None
    risk_level: str | None = None
    recommendations: list[str] | None = None
    risk_flags: list[str] | None = None
    skills_used: list[str] | None = None

    # Create mode fields
    best_candidate_id: str | None = None
    best_image_url: str | None = None
    total_rounds: int | None = None
    rounds: list[dict] | None = None

    # Shared
    latency_ms: int = 0
    cost_usd: float = 0.0


@create_router.post(
    "/create",
    response_model=None,
    summary="Unified creation/evaluation entry point",
    description=(
        "Send intent + optional image. "
        "With image: evaluate mode (VLM scoring). "
        "Without image: create mode (full generation pipeline). "
        "Use stream=true for SSE streaming in create mode."
    ),
)
async def create_session(
    req: CreateRequest,
    api_key: str = Depends(verify_api_key),
):
    session_id = f"sess-{uuid.uuid4().hex[:12]}"
    has_image = bool(req.image_url or req.image_base64)
    t0 = time.monotonic()

    if has_image:
        # ── Evaluate mode (MetaOrchestrator) ──
        return await _run_evaluate_mode(req, session_id, t0)
    else:
        if req.stream:
            # ── Create mode + SSE streaming ──
            return _run_create_mode_stream(req, session_id)
        else:
            # ── Create mode + synchronous ──
            return await _run_create_mode_sync(req, session_id, t0)


async def _run_evaluate_mode(
    req: CreateRequest,
    session_id: str,
    t0: float,
) -> CreateResponse:
    """Evaluate an existing image via MetaOrchestrator."""
    from app.prototype.intent.meta_orchestrator import MetaOrchestrator
    from app.prototype.tools.image_utils import cleanup_temp_image, resolve_image_input

    tmp_path: str | None = None
    try:
        tmp_path = await resolve_image_input(req.image_url, req.image_base64)
        orch = MetaOrchestrator.get_instance()
        result = await orch.run(
            user_input=req.intent or "general evaluation",
            image_path=tmp_path,
            subject=req.subject,
        )

        elapsed_ms = int((time.monotonic() - t0) * 1000)

        # Store session digest
        digest = SessionDigest(
            session_id=session_id,
            mode="evaluate",
            intent=req.intent,
            tradition=result.tradition_used,
            subject=req.subject,
            user_type=req.user_type,
            final_scores=result.scores,
            final_weighted_total=result.weighted_total,
            risk_flags=result.risk_flags,
            recommendations=result.recommendations,
            total_latency_ms=elapsed_ms,
            total_cost_usd=result.cost_usd,
        )
        digest.cultural_features = _extract_cultural_features(
            tradition=result.tradition_used,
            final_scores=result.scores,
            risk_flags=result.risk_flags if result.risk_flags else [],
        )
        SessionStore.get().append(digest)

        return CreateResponse(
            session_id=session_id,
            mode="evaluate",
            tradition=result.tradition_used,
            scores=result.scores,
            weighted_total=result.weighted_total,
            summary=result.result_card.summary,
            risk_level=result.result_card.risk_level,
            recommendations=result.recommendations,
            risk_flags=result.risk_flags,
            skills_used=result.skill_plan.skill_names() if result.skill_plan else [],
            latency_ms=elapsed_ms,
            cost_usd=result.cost_usd,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Create (evaluate mode) error")
        raise HTTPException(status_code=500, detail=f"Evaluation error: {type(exc).__name__}") from exc
    finally:
        if tmp_path:
            cleanup_temp_image(tmp_path)


async def _run_create_mode_sync(
    req: CreateRequest,
    session_id: str,
    t0: float,
) -> CreateResponse:
    """Run full pipeline synchronously and return JSON."""
    from app.prototype.agents.critic_config import CriticConfig
    from app.prototype.agents.draft_config import DraftConfig
    from app.prototype.agents.queen_config import QueenConfig
    from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
    from app.prototype.pipeline.pipeline_types import PipelineInput

    api_key = os.environ.get("GOOGLE_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")

    d_cfg = DraftConfig(
        provider=req.provider,
        api_key=api_key,
        n_candidates=req.n_candidates,
    )
    q_cfg = QueenConfig(max_rounds=req.max_rounds)

    orchestrator = PipelineOrchestrator(
        draft_config=d_cfg,
        critic_config=CriticConfig(),
        queen_config=q_cfg,
        enable_agent_critic=req.enable_agent_critic,
        enable_fix_it_plan=req.enable_agent_critic,
    )

    pipeline_input = PipelineInput(
        task_id=session_id,
        subject=req.subject or req.intent,
        cultural_tradition=req.tradition,
    )

    # Collect events from synchronous run
    rounds: list[RoundSnapshot] = []
    best_candidate_id = ""
    best_image_url = ""
    final_scores: dict[str, float] = {}
    total_rounds = 0
    total_cost = 0.0
    # Track candidate image URLs from draft/critic events (WU-1 fix)
    candidate_image_urls: dict[str, str] = {}

    for event in orchestrator.run_stream(pipeline_input):
        if event.event_type == EventType.DECISION_MADE:
            p = event.payload
            snap = RoundSnapshot(
                round_num=event.round_num,
                best_candidate_id=p.get("best_candidate_id", ""),
                weighted_total=p.get("weighted_total", 0.0),
                decision=p.get("action", ""),
            )
            rounds.append(snap)
        elif event.event_type == EventType.STAGE_COMPLETED and event.stage == "draft":
            # Capture candidate image URLs from draft stage
            p = event.payload
            for c in p.get("candidates", []):
                if isinstance(c, dict) and c.get("id") and c.get("image_url"):
                    candidate_image_urls[c["id"]] = c["image_url"]
        elif event.event_type == EventType.STAGE_COMPLETED and event.stage == "critic":
            p = event.payload
            scored = p.get("scored_candidates", [])
            if scored:
                # Also capture image_url from scored candidates
                for sc in scored:
                    if isinstance(sc, dict) and sc.get("id") and sc.get("image_url"):
                        candidate_image_urls[sc["id"]] = sc["image_url"]
                top = scored[0] if isinstance(scored[0], dict) else {}
                for ds in top.get("dimension_scores", []):
                    if isinstance(ds, dict):
                        final_scores[ds.get("dimension", "")] = ds.get("score", 0.0)
        elif event.event_type == EventType.PIPELINE_COMPLETED:
            p = event.payload
            best_candidate_id = p.get("best_candidate_id", "")
            total_rounds = p.get("total_rounds", len(rounds))
            total_cost = p.get("total_cost_usd", 0.0)

    # Resolve best_image_url from collected candidates
    if best_candidate_id and best_candidate_id in candidate_image_urls:
        best_image_url = candidate_image_urls[best_candidate_id]

    elapsed_ms = int((time.monotonic() - t0) * 1000)

    # Store session digest
    digest = SessionDigest(
        session_id=session_id,
        mode="create",
        intent=req.intent,
        tradition=req.tradition,
        subject=req.subject or req.intent,
        user_type=req.user_type,
        rounds=rounds,
        final_scores=final_scores,
        best_image_url=best_image_url,
        total_rounds=total_rounds,
        total_latency_ms=elapsed_ms,
        total_cost_usd=total_cost,
    )
    digest.cultural_features = _extract_cultural_features(
        tradition=req.tradition,
        final_scores=final_scores,
        risk_flags=[],
    )
    SessionStore.get().append(digest)

    return CreateResponse(
        session_id=session_id,
        mode="create",
        tradition=req.tradition,
        best_candidate_id=best_candidate_id,
        best_image_url=best_image_url,
        total_rounds=total_rounds,
        rounds=[r.to_dict() for r in rounds],
        latency_ms=elapsed_ms,
        cost_usd=total_cost,
    )


def _run_create_mode_stream(
    req: CreateRequest,
    session_id: str,
) -> StreamingResponse:
    """Run full pipeline with SSE streaming (mirrors routes.py pattern)."""
    from app.prototype.agents.critic_config import CriticConfig
    from app.prototype.agents.draft_config import DraftConfig
    from app.prototype.agents.queen_config import QueenConfig
    from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
    from app.prototype.pipeline.pipeline_types import PipelineInput

    api_key = os.environ.get("GOOGLE_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")

    d_cfg = DraftConfig(
        provider=req.provider,
        api_key=api_key,
        n_candidates=req.n_candidates,
    )
    q_cfg = QueenConfig(max_rounds=req.max_rounds)

    orchestrator = PipelineOrchestrator(
        draft_config=d_cfg,
        critic_config=CriticConfig(),
        queen_config=q_cfg,
        enable_agent_critic=req.enable_agent_critic,
        enable_fix_it_plan=req.enable_agent_critic,
    )

    pipeline_input = PipelineInput(
        task_id=session_id,
        subject=req.subject or req.intent,
        cultural_tradition=req.tradition,
    )

    with _create_buffer_lock:
        _create_event_buffers[session_id] = []

    def _run_in_background() -> None:
        t0 = time.monotonic()
        rounds: list[RoundSnapshot] = []
        best_candidate_id = ""
        best_image_url = ""
        final_scores: dict[str, float] = {}
        total_cost = 0.0
        candidate_image_urls: dict[str, str] = {}

        for event in orchestrator.run_stream(pipeline_input):
            with _create_buffer_lock:
                _create_event_buffers.setdefault(session_id, []).append(event)
            if event.event_type == EventType.DECISION_MADE:
                p = event.payload
                rounds.append(RoundSnapshot(
                    round_num=event.round_num,
                    best_candidate_id=p.get("best_candidate_id", ""),
                    weighted_total=p.get("weighted_total", 0.0),
                    decision=p.get("action", ""),
                ))
            elif event.event_type == EventType.STAGE_COMPLETED and event.stage == "draft":
                for c in event.payload.get("candidates", []):
                    if isinstance(c, dict) and c.get("id") and c.get("image_url"):
                        candidate_image_urls[c["id"]] = c["image_url"]
            elif event.event_type == EventType.STAGE_COMPLETED and event.stage == "critic":
                scored = event.payload.get("scored_candidates", [])
                for sc in scored:
                    if isinstance(sc, dict) and sc.get("id") and sc.get("image_url"):
                        candidate_image_urls[sc["id"]] = sc["image_url"]
                if scored:
                    top = scored[0] if isinstance(scored[0], dict) else {}
                    for ds in top.get("dimension_scores", []):
                        if isinstance(ds, dict):
                            final_scores[ds.get("dimension", "")] = ds.get("score", 0.0)
            elif event.event_type == EventType.PIPELINE_COMPLETED:
                p = event.payload
                best_candidate_id = p.get("best_candidate_id", "")
                total_cost = p.get("total_cost_usd", 0.0)

        if best_candidate_id and best_candidate_id in candidate_image_urls:
            best_image_url = candidate_image_urls[best_candidate_id]

        # Store digest after pipeline completes
        elapsed_ms = int((time.monotonic() - t0) * 1000)
        digest = SessionDigest(
            session_id=session_id,
            mode="create",
            intent=req.intent,
            tradition=req.tradition,
            subject=req.subject or req.intent,
            user_type=req.user_type,
            rounds=rounds,
            final_scores=final_scores,
            best_image_url=best_image_url,
            total_rounds=len(rounds),
            total_latency_ms=elapsed_ms,
            total_cost_usd=total_cost,
        )
        digest.cultural_features = _extract_cultural_features(
            tradition=req.tradition,
            final_scores=final_scores,
            risk_flags=[],
        )
        SessionStore.get().append(digest)

    thread = Thread(target=_run_in_background, daemon=True)
    thread.start()

    async def generate():
        # First emit session metadata
        meta = {"session_id": session_id, "mode": "create", "tradition": req.tradition}
        yield f"data: {json.dumps(meta)}\n\n"

        seen = 0
        max_wait = 300
        start = time.monotonic()

        while time.monotonic() - start < max_wait:
            with _create_buffer_lock:
                buffer = list(_create_event_buffers.get(session_id, []))
            while seen < len(buffer):
                event = buffer[seen]
                seen += 1
                data = json.dumps(event.to_dict(), ensure_ascii=False)
                yield f"data: {data}\n\n"

                if event.event_type in (EventType.PIPELINE_COMPLETED, EventType.PIPELINE_FAILED):
                    # Cleanup buffer
                    with _create_buffer_lock:
                        _create_event_buffers.pop(session_id, None)
                    return

            await asyncio.sleep(0.1)

        yield f"data: {json.dumps({'event_type': 'timeout', 'payload': {}})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
