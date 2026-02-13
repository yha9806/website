"""Cultural tradition-specific L1-L5 weight tables.

Based on VULCA v2 plan §4 — each tradition has a unique weight profile
reflecting its evaluative priorities (e.g., Chinese xieyi emphasizes L5
philosophical aesthetics, Islamic geometric emphasizes L1+L2 visual precision).

Weight tables sum to 1.0 for each tradition.
"""

from __future__ import annotations

from app.prototype.agents.critic_config import DIMENSIONS


# ---------------------------------------------------------------------------
# Per-tradition weight tables  (L1, L2, L3, L4, L5)
# ---------------------------------------------------------------------------

_WEIGHT_TABLES: dict[str, dict[str, float]] = {
    "default": {
        "visual_perception": 0.15,
        "technical_analysis": 0.20,
        "cultural_context": 0.25,
        "critical_interpretation": 0.20,
        "philosophical_aesthetic": 0.20,
    },
    "chinese_xieyi": {
        "visual_perception": 0.10,
        "technical_analysis": 0.15,
        "cultural_context": 0.25,
        "critical_interpretation": 0.20,
        "philosophical_aesthetic": 0.30,
    },
    "chinese_gongbi": {
        "visual_perception": 0.15,
        "technical_analysis": 0.30,
        "cultural_context": 0.25,
        "critical_interpretation": 0.15,
        "philosophical_aesthetic": 0.15,
    },
    "western_academic": {
        "visual_perception": 0.20,
        "technical_analysis": 0.25,
        "cultural_context": 0.15,
        "critical_interpretation": 0.25,
        "philosophical_aesthetic": 0.15,
    },
    "islamic_geometric": {
        "visual_perception": 0.25,
        "technical_analysis": 0.30,
        "cultural_context": 0.20,
        "critical_interpretation": 0.15,
        "philosophical_aesthetic": 0.10,
    },
    "japanese_traditional": {
        "visual_perception": 0.15,
        "technical_analysis": 0.20,
        "cultural_context": 0.20,
        "critical_interpretation": 0.20,
        "philosophical_aesthetic": 0.25,
    },
    "watercolor": {
        "visual_perception": 0.20,
        "technical_analysis": 0.25,
        "cultural_context": 0.15,
        "critical_interpretation": 0.20,
        "philosophical_aesthetic": 0.20,
    },
    "african_traditional": {
        "visual_perception": 0.15,
        "technical_analysis": 0.20,
        "cultural_context": 0.30,
        "critical_interpretation": 0.20,
        "philosophical_aesthetic": 0.15,
    },
    "south_asian": {
        "visual_perception": 0.15,
        "technical_analysis": 0.20,
        "cultural_context": 0.25,
        "critical_interpretation": 0.15,
        "philosophical_aesthetic": 0.25,
    },
}

# All traditions that have weight tables
KNOWN_TRADITIONS: list[str] = sorted(_WEIGHT_TABLES.keys())


def get_weights(tradition: str) -> dict[str, float]:
    """Return L1-L5 weights for a given cultural tradition.

    Falls back to ``"default"`` if the tradition is not recognized.
    """
    return dict(_WEIGHT_TABLES.get(tradition, _WEIGHT_TABLES["default"]))


def get_all_weight_tables() -> dict[str, dict[str, float]]:
    """Return a copy of the full weight table registry."""
    return {k: dict(v) for k, v in _WEIGHT_TABLES.items()}
