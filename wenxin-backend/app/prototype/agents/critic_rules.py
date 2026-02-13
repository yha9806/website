"""Rule-based L1-L5 scoring engine for the Critic Agent."""

from __future__ import annotations

from app.prototype.agents.critic_config import DIMENSIONS
from app.prototype.agents.critic_types import DimensionScore

# Cultural style keywords per tradition (subset of DraftAgent._STYLE_MAP keys)
_CULTURE_KEYWORDS: dict[str, list[str]] = {
    "chinese_xieyi": ["ink", "brush", "xieyi", "rice paper", "wash", "shanshui", "shan shui"],
    "chinese_gongbi": ["gongbi", "meticulous", "mineral", "fine lines"],
    "western_academic": ["oil", "chiaroscuro", "perspective", "classical", "academic", "realism"],
    "islamic_geometric": ["geometric", "tessellation", "arabesque", "islamic"],
    "watercolor": ["watercolor", "transparent", "washes", "wet"],
    "african_traditional": ["carved", "bold", "symbolic", "african"],
    "south_asian": ["miniature", "narrative", "south asian"],
    "default": ["art", "fine art", "museum"],
}


def _clamp(v: float) -> float:
    """Clamp value to [0.0, 1.0]."""
    return max(0.0, min(1.0, v))


class CriticRules:
    """Pure rule-based scorer: no LLM calls, fully deterministic."""

    def score(
        self,
        candidate: dict,
        evidence: dict,
        cultural_tradition: str,
    ) -> list[DimensionScore]:
        """Return L1-L5 DimensionScore list for a single candidate."""
        prompt = candidate.get("prompt", "")
        prompt_lower = prompt.lower()
        steps = candidate.get("steps", 0)
        sampler = candidate.get("sampler", "")
        model_ref = candidate.get("model_ref", "")

        term_hits = evidence.get("terminology_hits", [])
        sample_matches = evidence.get("sample_matches", [])
        taboo_violations = evidence.get("taboo_violations", [])

        style_keywords = _CULTURE_KEYWORDS.get(
            cultural_tradition, _CULTURE_KEYWORDS["default"]
        )
        has_style = any(kw in prompt_lower for kw in style_keywords)
        has_terms = len(term_hits) > 0
        has_samples = len(sample_matches) > 0
        has_taboo_critical = any(
            v.get("severity") == "critical" for v in taboo_violations
        )
        has_taboo_high = any(
            v.get("severity") == "high" for v in taboo_violations
        )

        scores: list[DimensionScore] = []

        # --- L1: visual_perception ---
        l1 = 0.5
        rationale_parts_l1 = ["base=0.5"]
        if has_style:
            l1 += 0.2
            rationale_parts_l1.append("style_match=+0.2")
        if has_terms:
            l1 += 0.15
            rationale_parts_l1.append("terminology=+0.15")
        if len(prompt) > 50:
            l1 += 0.15
            rationale_parts_l1.append("prompt_length>50=+0.15")
        scores.append(DimensionScore(
            dimension=DIMENSIONS[0],
            score=_clamp(l1),
            rationale="; ".join(rationale_parts_l1),
        ))

        # --- L2: technical_analysis ---
        l2 = 0.5
        rationale_parts_l2 = ["base=0.5"]
        if steps >= 15:
            l2 += 0.2
            rationale_parts_l2.append("steps>=15=+0.2")
        if sampler:
            l2 += 0.15
            rationale_parts_l2.append("sampler_present=+0.15")
        if model_ref:
            l2 += 0.15
            rationale_parts_l2.append("model_ref_present=+0.15")
        scores.append(DimensionScore(
            dimension=DIMENSIONS[1],
            score=_clamp(l2),
            rationale="; ".join(rationale_parts_l2),
        ))

        # --- L3: cultural_context ---
        l3 = 0.3
        rationale_parts_l3 = ["base=0.3"]
        term_bonus = min(len(term_hits) * 0.15, 0.3)
        if term_bonus > 0:
            l3 += term_bonus
            rationale_parts_l3.append(f"term_hits({len(term_hits)})=+{term_bonus:.2f}")
        sample_bonus = min(len(sample_matches) * 0.1, 0.2)
        if sample_bonus > 0:
            l3 += sample_bonus
            rationale_parts_l3.append(f"sample_matches({len(sample_matches)})=+{sample_bonus:.2f}")
        if not taboo_violations:
            l3 += 0.2
            rationale_parts_l3.append("no_taboo=+0.2")
        scores.append(DimensionScore(
            dimension=DIMENSIONS[2],
            score=_clamp(l3),
            rationale="; ".join(rationale_parts_l3),
        ))

        # --- L4: critical_interpretation ---
        l4 = 0.6
        rationale_parts_l4 = ["base=0.6"]
        if has_taboo_critical:
            l4 = 0.0
            rationale_parts_l4 = ["taboo_critical → 0.0"]
        else:
            if has_taboo_high:
                l4 -= 0.3
                rationale_parts_l4.append("taboo_high=-0.3")
            if has_terms:
                l4 += 0.2
                rationale_parts_l4.append("terminology=+0.2")
            if has_samples:
                l4 += 0.2
                rationale_parts_l4.append("sample_evidence=+0.2")
        scores.append(DimensionScore(
            dimension=DIMENSIONS[3],
            score=_clamp(l4),
            rationale="; ".join(rationale_parts_l4),
        ))

        # --- L5: philosophical_aesthetic ---
        l5 = 0.4
        rationale_parts_l5 = ["base=0.4"]
        # Cultural keywords in prompt
        culture_kws = ["culture", "cultural", "philosophy", "aesthetic",
                       "meaning", "symbolism", "tradition", "heritage"]
        if any(kw in prompt_lower for kw in culture_kws):
            l5 += 0.2
            rationale_parts_l5.append("cultural_keywords=+0.2")
        if not taboo_violations:
            l5 += 0.2
            rationale_parts_l5.append("no_taboo=+0.2")
        if len(term_hits) >= 2:
            l5 += 0.2
            rationale_parts_l5.append("term_coverage>=2=+0.2")
        scores.append(DimensionScore(
            dimension=DIMENSIONS[4],
            score=_clamp(l5),
            rationale="; ".join(rationale_parts_l5),
        ))

        return scores
