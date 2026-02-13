"""Pipeline data types — PipelineInput, StageResult, PipelineOutput."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class PipelineInput:
    """Input for a single pipeline run."""

    task_id: str
    subject: str
    cultural_tradition: str
    resume_from: str | None = None  # "scout" | "draft" | "critic" | "queen" | None

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "subject": self.subject,
            "cultural_tradition": self.cultural_tradition,
            "resume_from": self.resume_from,
        }


@dataclass
class StageResult:
    """Result of a single pipeline stage."""

    stage: str       # "scout" | "draft" | "critic" | "queen"
    status: str      # "completed" | "skipped" | "failed"
    latency_ms: int = 0
    output_summary: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "stage": self.stage,
            "status": self.status,
            "latency_ms": self.latency_ms,
            "output_summary": self.output_summary,
        }


@dataclass
class PipelineOutput:
    """Output of a complete pipeline run."""

    task_id: str
    stages: list[StageResult] = field(default_factory=list)
    final_decision: str = ""             # QueenDecision.action
    best_candidate_id: str | None = None
    total_latency_ms: int = 0
    total_rounds: int = 0
    success: bool = True
    error: str | None = None

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "stages": [s.to_dict() for s in self.stages],
            "final_decision": self.final_decision,
            "best_candidate_id": self.best_candidate_id,
            "total_latency_ms": self.total_latency_ms,
            "total_rounds": self.total_rounds,
            "success": self.success,
            "error": self.error,
        }
