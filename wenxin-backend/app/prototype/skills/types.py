"""Skill type definitions for the VULCA Skill system.

A Skill is the atomic unit of evaluation capability. Each Skill defines
what it evaluates, how it scores, and what configuration it needs.
"""

from __future__ import annotations

from dataclasses import dataclass, field


__all__ = [
    "SkillDef",
    "SkillResult",
]


@dataclass
class SkillDef:
    """Definition of a single evaluation skill.

    Loaded from YAML or registered programmatically.
    Follows the same pattern as TraditionConfig for YAML-driven configuration.
    """

    name: str
    description: str
    version: str = "1.0.0"
    author: str = "vulca"
    tags: list[str] = field(default_factory=list)
    input_types: list[str] = field(default_factory=lambda: ["image"])
    output_schema: dict = field(default_factory=dict)
    config: dict = field(default_factory=dict)  # skill-specific config
    skill_type: str = "evaluation"  # "evaluation" | "tradition" | "custom"
    tradition_config: dict = field(default_factory=dict)  # only for tradition-type skills


@dataclass
class SkillResult:
    """Result returned after a skill evaluation run."""

    skill_name: str
    score: float
    summary: str
    details: dict = field(default_factory=dict)
    suggestions: list[str] = field(default_factory=list)
