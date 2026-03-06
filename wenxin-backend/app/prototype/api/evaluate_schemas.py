"""Pydantic schemas for the B2B evaluate API (M4)."""

from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class EvaluateRequest(BaseModel):
    """POST /api/v1/evaluate — cultural art evaluation request."""

    image_url: str | None = Field(default=None, description="HTTP(S) image URL")
    image_base64: str | None = Field(default=None, description="Base64-encoded image data")
    tradition: str = Field(default="default", description="Cultural tradition identifier")
    subject: str = Field(default="", description="Artwork subject description")
    include_evidence: bool = Field(default=False, description="Run Scout evidence gathering")

    @model_validator(mode="after")
    def _require_image(self) -> EvaluateRequest:
        if not self.image_url and not self.image_base64:
            raise ValueError("Either image_url or image_base64 must be provided")
        return self


class DimensionDetail(BaseModel):
    """Single L1-L5 dimension score with rationale."""

    score: float
    rationale: str = ""


class EvaluateResponse(BaseModel):
    """POST /api/v1/evaluate — evaluation result."""

    scores: dict[str, float] = Field(description="L1-L5 scores, e.g. {'L1': 0.85, ...}")
    rationales: dict[str, str] = Field(description="Per-dimension rationale text")
    weighted_total: float
    tradition_used: str
    cultural_diagnosis: str = Field(default="", description="VLM综合诊断")
    recommendations: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list, description="Cultural taboo/risk flags")
    evidence_summary: dict | None = Field(default=None, description="Scout evidence if requested")
    latency_ms: int
    cost_usd: float = 0.0


class IdentifyTraditionRequest(BaseModel):
    """POST /api/v1/identify-tradition — auto-detect cultural tradition."""

    image_url: str | None = Field(default=None, description="HTTP(S) image URL")
    image_base64: str | None = Field(default=None, description="Base64-encoded image data")

    @model_validator(mode="after")
    def _require_image(self) -> IdentifyTraditionRequest:
        if not self.image_url and not self.image_base64:
            raise ValueError("Either image_url or image_base64 must be provided")
        return self


class TraditionAlternative(BaseModel):
    """Alternative tradition match."""

    tradition: str
    confidence: float


class IdentifyTraditionResponse(BaseModel):
    """POST /api/v1/identify-tradition — tradition identification result."""

    tradition: str
    confidence: float
    alternatives: list[TraditionAlternative] = Field(default_factory=list)
    recommended_weights: dict[str, float] = Field(
        default_factory=dict,
        description="Recommended L1-L5 weights for the identified tradition",
    )
    latency_ms: int
