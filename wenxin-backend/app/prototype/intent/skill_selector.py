"""SkillSelector — select and configure skills based on parsed intent.

Rule-based primary selection (90%) + LLM fallback (10%) for ambiguous cases.
Maps user intent to a SkillPlan that the ConfigTranslator can convert
to pipeline configuration.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.prototype.intent.types import IntentResult
from app.prototype.skills import SkillDef, SkillRegistry

logger = logging.getLogger(__name__)

__all__ = ["SkillSelector", "SkillPlan", "_get_culture_keywords", "invalidate_culture_keywords_cache"]


@dataclass
class SkillPlan:
    """The output of SkillSelector: which skills to run and how."""

    skills: list[SkillDef]
    tradition: str = "default"
    weights: dict[str, float] = field(default_factory=dict)
    include_evidence: bool = False
    context: dict = field(default_factory=dict)

    def skill_names(self) -> list[str]:
        return [s.name for s in self.skills]

    def to_dict(self) -> dict:
        return {
            "skills": self.skill_names(),
            "tradition": self.tradition,
            "weights": self.weights,
            "include_evidence": self.include_evidence,
            "context": self.context,
        }


# Keywords that trigger specific skills
_BRAND_KEYWORDS = {"brand", "logo", "branding", "corporate", "identity", "guideline"}
_AUDIENCE_KEYWORDS = {"audience", "demographic", "target", "market", "user", "consumer"}
_TREND_KEYWORDS = {"trend", "trendy", "modern", "aesthetic", "style", "popular", "current"}
_CULTURE_KEYWORDS_BASE_EN = {
    "culture", "cultural", "tradition", "traditional", "taboo", "religious",
    "appropriate", "sensitivity", "ethnic", "heritage",
    "ritual", "ceremony", "sacred", "folklore",
    "indigenous", "ancestral", "mythological",
}

_CULTURE_KEYWORDS_BASE_ZH = {
    "文化", "传统", "禁忌", "遗产", "仪式",
    "民俗", "民族", "神话", "图腾", "风俗",
}

_culture_keywords_cache: set[str] | None = None


def _get_culture_keywords() -> set[str]:
    """Dynamically build culture keywords from YAML traditions + base set.

    Caches the result after first call for performance.
    Base English and Chinese keywords are always included.
    Additional terms are loaded from YAML tradition terminology entries.
    """
    global _culture_keywords_cache
    if _culture_keywords_cache is not None:
        return _culture_keywords_cache

    keywords = set(_CULTURE_KEYWORDS_BASE_EN)
    keywords.update(_CULTURE_KEYWORDS_BASE_ZH)

    # Load from YAML traditions
    try:
        from app.prototype.cultural_pipelines.tradition_loader import get_all_traditions
        traditions = get_all_traditions()
        for config in traditions.values():
            if config.terminology:
                for entry in config.terminology:
                    # Add the English term
                    if entry.term and len(entry.term) > 2:
                        keywords.add(entry.term.lower())
                    # Add the Chinese term
                    if entry.term_zh and len(entry.term_zh) > 1:
                        keywords.add(entry.term_zh)
                    # Add aliases
                    for alias in entry.aliases:
                        if isinstance(alias, str) and len(alias) > 2:
                            keywords.add(alias.lower())
    except Exception:
        logger.debug("Could not load YAML traditions for culture keywords; using base set only")

    _culture_keywords_cache = keywords
    return keywords


def invalidate_culture_keywords_cache() -> None:
    """Invalidate the culture keywords cache (e.g. after tradition reload)."""
    global _culture_keywords_cache
    _culture_keywords_cache = None


_RISK_KEYWORDS = {"risk", "safe", "safety", "offensive", "inappropriate", "taboo", "violation"}


class SkillSelector:
    """Select skills based on parsed intent using rule-based matching."""

    def __init__(self, registry: SkillRegistry | None = None):
        self._registry = registry

    @property
    def registry(self) -> SkillRegistry:
        if self._registry is None:
            self._registry = SkillRegistry.get_instance()
        return self._registry

    def select(self, intent: IntentResult) -> SkillPlan:
        """Select skills for the given intent.

        Step 1: Deterministic rule matching (fast, <1ms)
        Step 2: Ensure at least one skill is selected
        Step 3: Determine if evidence gathering is needed
        """
        skills: list[SkillDef] = []
        include_evidence = False
        context: dict = {}

        # Normalize intent text for keyword matching
        text_lower = (intent.raw_intent or "").lower()
        context_lower = (intent.context or "").lower()
        combined = f"{text_lower} {context_lower}"

        # Rule 1: Cultural tradition detected → cultural_evaluation skill
        if intent.tradition != "default":
            cultural = self.registry.get("cultural_evaluation")
            if cultural is None:
                # Built-in fallback: create a virtual cultural_evaluation skill
                cultural = SkillDef(
                    name="cultural_evaluation",
                    description="L1-L5 cultural quality evaluation",
                    tags=["culture", "evaluation", "l1-l5"],
                )
            skills.append(cultural)
            include_evidence = True

        # Rule 2: Brand keywords → brand_consistency skill
        if _BRAND_KEYWORDS & set(combined.split()):
            brand = self.registry.get("brand_consistency")
            if brand:
                skills.append(brand)
                context["brand_focus"] = True

        # Rule 3: Audience keywords → audience_fit skill
        if _AUDIENCE_KEYWORDS & set(combined.split()):
            audience = self.registry.get("audience_fit")
            if audience:
                skills.append(audience)

        # Rule 4: Trend keywords → trend_alignment skill
        if _TREND_KEYWORDS & set(combined.split()):
            trend = self.registry.get("trend_alignment")
            if trend:
                skills.append(trend)

        # Rule 5: Culture keywords (even without tradition detected)
        if _get_culture_keywords() & set(combined.split()) and not any(
            s.name == "cultural_evaluation" for s in skills
        ):
            cultural = self.registry.get("cultural_evaluation")
            if cultural is None:
                cultural = SkillDef(
                    name="cultural_evaluation",
                    description="L1-L5 cultural quality evaluation",
                    tags=["culture", "evaluation", "l1-l5"],
                )
            skills.append(cultural)
            include_evidence = True

        # Rule 6: Risk keywords → enable evidence + flag
        if _RISK_KEYWORDS & set(combined.split()):
            include_evidence = True
            context["risk_scan"] = True

        # Fallback: if no skills matched, use cultural_evaluation with default
        if not skills:
            cultural = self.registry.get("cultural_evaluation") or SkillDef(
                name="cultural_evaluation",
                description="L1-L5 cultural quality evaluation",
                tags=["culture", "evaluation", "l1-l5"],
            )
            skills.append(cultural)

        logger.info(
            "SkillSelector: intent=%r → %d skills: %s (evidence=%s)",
            intent.raw_intent[:60] if intent.raw_intent else "",
            len(skills),
            [s.name for s in skills],
            include_evidence,
        )

        return SkillPlan(
            skills=skills,
            tradition=intent.tradition,
            weights={},  # weights come from ConfigTranslator via CulturalPipelineRouter
            include_evidence=include_evidence,
            context=context,
        )
