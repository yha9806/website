"""SessionDigest and RoundSnapshot — unified creation session data protocol."""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field


@dataclass
class RoundSnapshot:
    """Snapshot of a single pipeline round within a session."""

    round_num: int = 0
    candidates_generated: int = 0
    best_candidate_id: str = ""
    weighted_total: float = 0.0
    dimension_scores: dict[str, float] = field(default_factory=dict)
    decision: str = ""  # "accept" | "rerun" | "refine"
    latency_ms: int = 0

    def to_dict(self) -> dict:
        return {
            "round_num": self.round_num,
            "candidates_generated": self.candidates_generated,
            "best_candidate_id": self.best_candidate_id,
            "weighted_total": self.weighted_total,
            "dimension_scores": self.dimension_scores,
            "decision": self.decision,
            "latency_ms": self.latency_ms,
        }


@dataclass
class SessionDigest:
    """Unified digest for both creation and evaluation sessions.

    Human users and Agent users produce identical digests.
    """

    session_id: str = field(default_factory=lambda: f"sess-{uuid.uuid4().hex[:12]}")
    mode: str = "create"  # "create" | "evaluate"
    intent: str = ""
    tradition: str = "default"
    subject: str = ""
    user_type: str = "human"  # "human" | "agent"
    user_id: str = ""

    # Pipeline results
    rounds: list[RoundSnapshot] = field(default_factory=list)
    final_scores: dict[str, float] = field(default_factory=dict)
    final_weighted_total: float = 0.0
    best_image_url: str = ""
    risk_flags: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)

    # Feedback (filled post-session)
    feedback: list[dict] = field(default_factory=list)

    # Cultural features (extracted post-session)
    # Tier-1 (rule-based): float values — tradition_specificity, l5_emphasis, etc.
    # Tier-2 (LLM): list[str] values — style_elements, emotional_tone, etc.
    cultural_features: dict = field(default_factory=dict)
    critic_insights: list[str] = field(default_factory=list)

    # Implicit feedback signals
    candidate_choice_index: int = -1
    time_to_select_ms: int = 0
    downloaded: bool = False

    # Metadata
    total_rounds: int = 0
    total_latency_ms: int = 0
    total_cost_usd: float = 0.0
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "mode": self.mode,
            "intent": self.intent,
            "tradition": self.tradition,
            "subject": self.subject,
            "user_type": self.user_type,
            "user_id": self.user_id,
            "rounds": [r.to_dict() for r in self.rounds],
            "final_scores": self.final_scores,
            "final_weighted_total": self.final_weighted_total,
            "best_image_url": self.best_image_url,
            "risk_flags": self.risk_flags,
            "recommendations": self.recommendations,
            "feedback": self.feedback,
            "cultural_features": self.cultural_features,
            "critic_insights": self.critic_insights,
            "candidate_choice_index": self.candidate_choice_index,
            "time_to_select_ms": self.time_to_select_ms,
            "downloaded": self.downloaded,
            "total_rounds": self.total_rounds,
            "total_latency_ms": self.total_latency_ms,
            "total_cost_usd": self.total_cost_usd,
            "created_at": self.created_at,
        }
