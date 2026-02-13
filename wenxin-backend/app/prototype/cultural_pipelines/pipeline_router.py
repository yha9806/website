"""CulturalPipelineRouter — routes cultural traditions to pipeline variants.

Three pipeline variants (v2 plan §6):

1. **default** — full pipeline: Scout→Draft→Critic(5层)→[HITL]→Refine→Archive
2. **chinese_xieyi** — atomic: Scout(L3+L5 focus)→Draft(atomic)→Critic(L5:0.30)→Archive
   "一气呵成" philosophy — no local rerun, single pass
3. **western_academic** — 3-step progressive: Scout→Draft→Critic(L1+L2)→Draft→Critic(L3+L4)→Draft→Critic(L5)
   Step-by-step refinement mirroring academic critique tradition
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.prototype.agents.critic_config import CriticConfig, DIMENSIONS
from app.prototype.cultural_pipelines.cultural_weights import (
    KNOWN_TRADITIONS,
    get_weights,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pipeline variant descriptors
# ---------------------------------------------------------------------------

@dataclass
class PipelineVariant:
    """Describes how a cultural pipeline differs from the default flow."""

    name: str  # "default" | "chinese_xieyi" | "western_academic"
    scout_focus_layers: list[str] = field(default_factory=list)
    allow_local_rerun: bool = True
    critic_stages: list[list[str]] = field(default_factory=list)
    description: str = ""

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "scout_focus_layers": self.scout_focus_layers,
            "allow_local_rerun": self.allow_local_rerun,
            "critic_stages": self.critic_stages,
            "description": self.description,
        }


# Pre-defined pipeline variants
_VARIANTS: dict[str, PipelineVariant] = {
    "default": PipelineVariant(
        name="default",
        scout_focus_layers=DIMENSIONS,  # all 5 layers
        allow_local_rerun=True,
        critic_stages=[DIMENSIONS],  # single pass, all 5 dimensions
        description="Full pipeline: Scout→Draft→Critic(L1-L5)→[HITL]→Refine→Archive",
    ),
    "chinese_xieyi": PipelineVariant(
        name="chinese_xieyi",
        scout_focus_layers=["cultural_context", "philosophical_aesthetic"],  # L3+L5
        allow_local_rerun=False,  # 一气呵成
        critic_stages=[DIMENSIONS],  # still scores all dims, but weights favor L5
        description="Atomic: Scout(L3+L5)→Draft(atomic)→Critic(L5:0.30)→Archive",
    ),
    "western_academic": PipelineVariant(
        name="western_academic",
        scout_focus_layers=DIMENSIONS,
        allow_local_rerun=True,
        critic_stages=[
            ["visual_perception", "technical_analysis"],           # step 1: form
            ["cultural_context", "critical_interpretation"],       # step 2: meaning
            ["philosophical_aesthetic"],                           # step 3: philosophy
        ],
        description="Progressive: Scout→Critic(L1+L2)→Critic(L3+L4)→Critic(L5)→Archive",
    ),
}


# ---------------------------------------------------------------------------
# Tradition → pipeline variant mapping
# ---------------------------------------------------------------------------

_TRADITION_TO_VARIANT: dict[str, str] = {
    "default": "default",
    "chinese_xieyi": "chinese_xieyi",
    "chinese_gongbi": "default",       # gongbi uses full pipeline with its own weights
    "western_academic": "western_academic",
    "islamic_geometric": "default",     # full pipeline, weight emphasis on L1+L2
    "japanese_traditional": "default",  # full pipeline, weight emphasis on L5
    "watercolor": "default",
    "african_traditional": "default",
    "south_asian": "default",
}


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

class CulturalPipelineRouter:
    """Route a cultural tradition to its pipeline variant and configuration.

    Usage::

        router = CulturalPipelineRouter()
        route = router.route("chinese_xieyi")
        # route.variant.name == "chinese_xieyi"
        # route.critic_config.weights["philosophical_aesthetic"] == 0.30
        # route.variant.allow_local_rerun == False
    """

    def route(self, tradition: str) -> PipelineRoute:
        """Determine the pipeline route for a given tradition."""
        variant_name = _TRADITION_TO_VARIANT.get(tradition, "default")
        variant = _VARIANTS.get(variant_name, _VARIANTS["default"])

        weights = get_weights(tradition)
        critic_config = CriticConfig(weights=weights)

        logger.info(
            "CulturalPipelineRouter: tradition=%s → variant=%s, L5_weight=%.2f",
            tradition,
            variant_name,
            weights.get("philosophical_aesthetic", 0.0),
        )

        return PipelineRoute(
            tradition=tradition,
            variant=variant,
            critic_config=critic_config,
        )

    @staticmethod
    def list_variants() -> list[str]:
        """Return all available pipeline variant names."""
        return sorted(_VARIANTS.keys())

    @staticmethod
    def list_traditions() -> list[str]:
        """Return all traditions with explicit routing rules."""
        return sorted(_TRADITION_TO_VARIANT.keys())


@dataclass
class PipelineRoute:
    """The resolved routing result for a cultural tradition."""

    tradition: str
    variant: PipelineVariant
    critic_config: CriticConfig

    def to_dict(self) -> dict:
        return {
            "tradition": self.tradition,
            "variant": self.variant.to_dict(),
            "critic_config": self.critic_config.to_dict(),
        }
