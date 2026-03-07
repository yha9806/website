"""Skill type definitions for the VULCA Skill system."""

from dataclasses import dataclass, field


@dataclass
class SkillDef:
    """Definition of a skill capability."""

    name: str
    description: str
    version: str = "1.0.0"
    author: str = "vulca"
    tags: list[str] = field(default_factory=list)
    input_types: list[str] = field(default_factory=lambda: ["image"])
    output_schema: dict = field(default_factory=dict)
    config: dict = field(default_factory=dict)


@dataclass
class SkillResult:
    """Result returned by a skill executor."""

    skill_name: str
    score: float
    summary: str
    details: dict = field(default_factory=dict)
    suggestions: list[str] = field(default_factory=list)
