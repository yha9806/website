"""Pydantic request/response schemas for the prototype API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CreateRunRequest(BaseModel):
    """Request body for POST /runs."""

    subject: str = Field(..., min_length=1, max_length=500, description="Artwork subject")
    tradition: str = Field(
        default="default",
        description="Cultural tradition",
    )
    provider: str = Field(default="mock", description="Image provider: mock | together_flux")
    n_candidates: int = Field(default=4, ge=1, le=8, description="Candidates per round")
    max_rounds: int = Field(default=2, ge=1, le=5, description="Max Queen rounds")
    enable_hitl: bool = Field(default=False, description="Enable human-in-the-loop")
    idempotency_key: str | None = Field(default=None, description="Optional idempotency key")


class RunStatusResponse(BaseModel):
    """Response for GET /runs/{id}."""

    task_id: str
    status: str                         # pending | running | waiting_human | completed | failed
    current_stage: str = ""
    current_round: int = 0
    final_decision: str | None = None
    best_candidate_id: str | None = None
    total_rounds: int = 0
    total_latency_ms: int = 0
    total_cost_usd: float = 0.0
    success: bool | None = None
    error: str | None = None
    stages: list[dict] = []


class SubmitActionRequest(BaseModel):
    """Request body for POST /runs/{id}/action."""

    action: str = Field(..., description="approve | reject | rerun | lock_dimensions | force_accept")
    locked_dimensions: list[str] = Field(default_factory=list)
    rerun_dimensions: list[str] = Field(default_factory=list)
    candidate_id: str = ""
    reason: str = ""


class SubmitActionResponse(BaseModel):
    """Response for POST /runs/{id}/action."""

    accepted: bool
    message: str = ""
