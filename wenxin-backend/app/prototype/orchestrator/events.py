"""Pipeline event types for streaming and HITL."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class EventType(Enum):
    """All pipeline event types."""

    STAGE_STARTED = "stage_started"
    STAGE_COMPLETED = "stage_completed"
    DECISION_MADE = "decision_made"
    HUMAN_REQUIRED = "human_required"
    HUMAN_RECEIVED = "human_received"
    PIPELINE_COMPLETED = "pipeline_completed"
    PIPELINE_FAILED = "pipeline_failed"


@dataclass
class PipelineEvent:
    """A single event emitted during pipeline execution."""

    event_type: EventType
    stage: str = ""           # "scout" | "draft" | "critic" | "queen" | "archivist"
    round_num: int = 0
    payload: dict = field(default_factory=dict)
    timestamp_ms: int = 0     # monotonic offset from pipeline start

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type.value,
            "stage": self.stage,
            "round_num": self.round_num,
            "payload": self.payload,
            "timestamp_ms": self.timestamp_ms,
        }
