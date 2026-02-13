"""Experiment configuration types for blind evaluation.

Defines experiment groups (baseline / treatment / ablation),
task descriptors, and the overall experiment config.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass
class ExperimentGroup:
    """A single experimental condition."""

    name: str
    enable_agent_critic: bool
    enable_evidence_loop: bool
    enable_fix_it_plan: bool
    description: str = ""


@dataclass
class BlindTask:
    """A single evaluation task."""

    task_id: str
    subject: str
    tradition: str
    category: str  # poetic / cultural / taboo
    expected_emphasis: list[str] = field(default_factory=list)  # e.g. ["L4", "L5"]


@dataclass
class ExperimentConfig:
    """Full experiment configuration."""

    groups: list[ExperimentGroup]
    tasks: list[BlindTask]
    provider: str = "mock"
    seed_base: int = 42
    max_rounds: int = 3
    n_candidates: int = 4

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)

    @classmethod
    def from_dict(cls, d: dict) -> ExperimentConfig:
        groups = [ExperimentGroup(**g) for g in d["groups"]]
        tasks = [BlindTask(**t) for t in d["tasks"]]
        return cls(
            groups=groups,
            tasks=tasks,
            provider=d.get("provider", "mock"),
            seed_base=d.get("seed_base", 42),
            max_rounds=d.get("max_rounds", 3),
            n_candidates=d.get("n_candidates", 4),
        )

    @classmethod
    def from_json(cls, s: str) -> ExperimentConfig:
        return cls.from_dict(json.loads(s))

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_json(), encoding="utf-8")

    @classmethod
    def load(cls, path: Path) -> ExperimentConfig:
        return cls.from_json(path.read_text(encoding="utf-8"))


# ── Pre-defined experiment groups ──────────────────────────────────────

BASELINE_GROUP = ExperimentGroup(
    name="baseline",
    enable_agent_critic=False,
    enable_evidence_loop=False,
    enable_fix_it_plan=False,
    description="Rule-only CriticAgent, no LLM, no interactive loops",
)

TREATMENT_GROUP = ExperimentGroup(
    name="treatment",
    enable_agent_critic=True,
    enable_evidence_loop=True,
    enable_fix_it_plan=True,
    description="Full Hybrid v2.6: CriticLLM + EvidenceLoop + FixItPlan",
)

ABLATION_GROUP = ExperimentGroup(
    name="ablation",
    enable_agent_critic=True,
    enable_evidence_loop=False,
    enable_fix_it_plan=False,
    description="LLM critic but no interactive feedback loops",
)

DEFAULT_GROUPS = [BASELINE_GROUP, TREATMENT_GROUP, ABLATION_GROUP]


def build_default_config(
    tasks: list[BlindTask],
    provider: str = "mock",
    include_ablation: bool = False,
) -> ExperimentConfig:
    """Build default experiment config with standard groups."""
    groups = [BASELINE_GROUP, TREATMENT_GROUP]
    if include_ablation:
        groups.append(ABLATION_GROUP)
    return ExperimentConfig(
        groups=groups,
        tasks=tasks,
        provider=provider,
    )
