"""ConfigTranslator — translate SkillPlan into pipeline configuration.

The bridge between Intent Layer and the existing evaluation engine.
No engine changes needed — maps skills to existing config objects.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.prototype.agents.critic_config import CriticConfig
from app.prototype.cultural_pipelines.pipeline_router import (
    CulturalPipelineRouter,
    PipelineRoute,
)
from app.prototype.intent.skill_selector import SkillPlan

logger = logging.getLogger(__name__)

__all__ = ["ConfigTranslator", "PipelineConfig"]


@dataclass
class PipelineConfig:
    """Translated pipeline configuration ready for execution."""

    tradition: str = "default"
    critic_config: CriticConfig = field(default_factory=CriticConfig)
    include_evidence: bool = False
    enable_vlm: bool = True
    extra_skills: list[str] = field(default_factory=list)
    context: dict = field(default_factory=dict)
    route: PipelineRoute | None = None

    def to_dict(self) -> dict:
        return {
            "tradition": self.tradition,
            "critic_config": self.critic_config.to_dict(),
            "include_evidence": self.include_evidence,
            "enable_vlm": self.enable_vlm,
            "extra_skills": self.extra_skills,
            "context": self.context,
        }


class ConfigTranslator:
    """Translate a SkillPlan into PipelineConfig for the existing engine."""

    def __init__(self):
        self._router = CulturalPipelineRouter()

    def translate(self, plan: SkillPlan) -> PipelineConfig:
        """Convert a SkillPlan to a PipelineConfig.

        Maps tradition to CulturalPipelineRouter route,
        determines which skills need VLM, which need evidence.
        """
        # Route tradition
        route = self._router.route(plan.tradition)
        critic_config = route.critic_config

        # Override weights if plan specifies custom weights
        if plan.weights:
            critic_config = CriticConfig(weights=plan.weights)

        # Determine if VLM is needed (cultural_evaluation always needs it)
        enable_vlm = any(
            s.name == "cultural_evaluation" or "evaluation" in s.tags
            for s in plan.skills
        )

        # Collect non-cultural skills for parallel execution
        extra_skills = [
            s.name for s in plan.skills
            if s.name != "cultural_evaluation"
        ]

        logger.info(
            "ConfigTranslator: tradition=%s, vlm=%s, evidence=%s, extra=%s",
            plan.tradition, enable_vlm, plan.include_evidence, extra_skills,
        )

        return PipelineConfig(
            tradition=plan.tradition,
            critic_config=critic_config,
            include_evidence=plan.include_evidence,
            enable_vlm=enable_vlm,
            extra_skills=extra_skills,
            context=plan.context,
            route=route,
        )
