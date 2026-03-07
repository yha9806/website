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

__all__ = ["SkillSelector", "SkillPlan"]


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
_CULTURE_KEYWORDS = {
    "culture", "cultural", "tradition", "traditional", "taboo", "religious",
    "appropriate", "sensitivity", "ethnic", "heritage",
}
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
        if _CULTURE_KEYWORDS & set(combined.split()) and not any(
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
