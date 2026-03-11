"""ConceptCrystallizer — crystallize emerged cultural concepts from clusters.

When a cluster reaches a size threshold, uses LLM to name and describe
the emerged cultural concept. Falls back to rule-based naming if LLM unavailable.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

from app.prototype.agents.model_router import MODEL_FAST

logger = logging.getLogger("vulca")

_MIN_CLUSTER_SIZE = 3  # Minimum sessions to crystallize a concept


@dataclass
class CulturalConcept:
    """A crystallized cultural concept that emerged from user sessions."""

    name: str
    description: str = ""
    key_principles: list[str] = field(default_factory=list)
    l_focus: dict[str, float] = field(default_factory=dict)  # L1-L5 emphasis
    weights: dict[str, float] = field(default_factory=dict)
    reference_sessions: list[str] = field(default_factory=list)
    emerged_at: float = field(default_factory=time.time)
    confidence: float = 0.0

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "key_principles": self.key_principles,
            "l_focus": self.l_focus,
            "weights": self.weights,
            "reference_sessions": self.reference_sessions[:10],
            "emerged_at": self.emerged_at,
            "confidence": round(self.confidence, 4),
        }


class ConceptCrystallizer:
    """Crystallize cultural concepts from large enough clusters."""

    _SYSTEM_MSG = (
        "You are a cultural art concept naming expert for the VULCA system. "
        "You identify and name emerged cultural concepts from art creation session clusters. "
        "Output ONLY valid JSON, no markdown fences or explanation."
    )

    def __init__(self, min_cluster_size: int = _MIN_CLUSTER_SIZE) -> None:
        self._min_size = min_cluster_size

    def crystallize(
        self,
        clusters: list,  # list[CulturalCluster]
        sessions: list[dict],
    ) -> list[CulturalConcept]:
        """Crystallize concepts from clusters that meet the size threshold.

        Parameters
        ----------
        clusters : list[CulturalCluster]
            Clusters from CulturalClusterer.
        sessions : list[dict]
            Full session data for enrichment.

        Returns
        -------
        list[CulturalConcept]
            Crystallized cultural concepts.
        """
        concepts: list[CulturalConcept] = []

        for cluster in clusters:
            if cluster.size < self._min_size:
                continue

            # Try LLM crystallization first, fall back to rule-based
            concept = self._try_llm_crystallize(cluster, sessions)
            if concept is None:
                concept = self._rule_based_crystallize(cluster, sessions)

            if concept is not None:
                concepts.append(concept)

        logger.info(
            "ConceptCrystallizer: %d clusters → %d concepts (threshold=%d)",
            len(clusters), len(concepts), self._min_size,
        )
        return concepts

    _LLM_MAX_RETRIES = 3
    _LLM_RETRY_DELAY_S = 1
    _LLM_TIMEOUT_S = 60

    def _try_llm_crystallize(self, cluster, sessions: list[dict]) -> CulturalConcept | None:
        """Use LLM to name and describe the emerged concept, with retry."""
        import json
        import re

        # Build context from cluster (done once, outside retry loop)
        cluster_sessions = [
            s for s in sessions
            if s.get("session_id") in set(cluster.session_ids)
        ]
        intents = [s.get("intent", "") for s in cluster_sessions[:5]]
        traditions = list({s.get("tradition", "") for s in cluster_sessions})

        is_cross = getattr(cluster, "source", "") == "cross_tradition"
        if is_cross:
            # Cap tradition names to 5 to keep prompt concise
            cross_traditions = getattr(cluster, "traditions", traditions)[:5]
            tradition_line = f"- Cross-tradition cluster spanning: {', '.join(cross_traditions)}"
        else:
            tradition_line = f"- Tradition: {cluster.tradition}"

        # Keep prompt concise — top 3 intents, summarized centroid
        top_intents = [i[:80] for i in intents[:3] if i]
        centroid_summary = {k: round(v, 2) for k, v in list(cluster.feature_centroid.items())[:6]}

        prompt = (
            "Name the emerged cultural concept from these art sessions:\n"
            f"{tradition_line}\n"
            f"- Sample intents: {'; '.join(top_intents)}\n"
            f"- Feature centroid: {centroid_summary}\n\n"
            'Return JSON: {"name": "snake_case_name", "description": "brief", '
            '"key_principles": ["p1", "p2"], "l_focus": {"L1": 0.X, "L3": 0.X}}'
        )

        last_error: Exception | None = None

        for attempt in range(self._LLM_MAX_RETRIES):
            try:
                import litellm

                response = litellm.completion(
                    model=MODEL_FAST,
                    messages=[
                        {"role": "system", "content": self._SYSTEM_MSG},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=4096,
                    temperature=0.3,
                    timeout=self._LLM_TIMEOUT_S,
                )

                raw = response.choices[0].message.content or ""
                from app.prototype.digestion.llm_utils import strip_markdown_fences
                text = strip_markdown_fences(raw)

                # Try JSON parsing
                brace_start = text.find("{")
                brace_end = text.rfind("}")
                if brace_start != -1 and brace_end > brace_start:
                    try:
                        parsed = json.loads(text[brace_start:brace_end + 1])
                        return CulturalConcept(
                            name=parsed.get("name", f"concept_{cluster.cluster_id}"),
                            description=parsed.get("description", ""),
                            key_principles=parsed.get("key_principles", []),
                            l_focus=parsed.get("l_focus", {}),
                            weights=dict(cluster.feature_centroid),
                            reference_sessions=cluster.session_ids[:10],
                            confidence=min(1.0, cluster.size / 20),
                        )
                    except json.JSONDecodeError:
                        pass  # Fall through to regex fallback

                # Regex fallback: extract name from text if JSON fails
                name_match = re.search(r'"name"\s*:\s*"([^"]+)"', text)
                desc_match = re.search(r'"description"\s*:\s*"([^"]+)"', text)
                if name_match:
                    return CulturalConcept(
                        name=name_match.group(1),
                        description=desc_match.group(1) if desc_match else "",
                        weights=dict(cluster.feature_centroid),
                        reference_sessions=cluster.session_ids[:10],
                        confidence=min(1.0, cluster.size / 20) * 0.8,  # Lower confidence for regex
                    )

                raise ValueError(f"No valid JSON in LLM response: {text[:200]}")
            except Exception as e:
                last_error = e
                logger.warning(
                    "LLM concept naming attempt %d/%d failed for cluster %s "
                    "(model=%s, error=%s): %s",
                    attempt + 1,
                    self._LLM_MAX_RETRIES,
                    cluster.cluster_id,
                    MODEL_FAST,
                    type(e).__name__,
                    str(e),
                )
                if attempt < self._LLM_MAX_RETRIES - 1:
                    time.sleep(self._LLM_RETRY_DELAY_S)

        logger.warning(
            "All %d LLM naming attempts failed for cluster %s, "
            "falling back to rule-based naming. Last error: %s: %s",
            self._LLM_MAX_RETRIES,
            cluster.cluster_id,
            type(last_error).__name__ if last_error else "Unknown",
            str(last_error) if last_error else "N/A",
        )
        return None

    def _rule_based_crystallize(self, cluster, sessions: list[dict]) -> CulturalConcept:
        """Rule-based fallback: name from tradition + dominant features."""
        # Derive name from tradition and dominant feature
        dominant_feature = ""
        max_val = 0.0
        for k, v in cluster.feature_centroid.items():
            if v > max_val:
                max_val = v
                dominant_feature = k

        is_cross = getattr(cluster, "source", "") == "cross_tradition"
        if is_cross:
            cross_traditions = getattr(cluster, "traditions", [cluster.tradition])
            tradition_part = "+".join(cross_traditions[:3])
            name = f"cross_{tradition_part}_{dominant_feature}" if dominant_feature else f"cross_concept_{cluster.cluster_id}"
            description = f"Emerged from {cluster.size} sessions spanning {', '.join(cross_traditions)} traditions"
        else:
            name = f"{cluster.tradition}_{dominant_feature}" if dominant_feature else f"concept_{cluster.cluster_id}"
            description = f"Emerged from {cluster.size} sessions in {cluster.tradition} tradition"

        return CulturalConcept(
            name=name,
            description=description,
            key_principles=[f"High {dominant_feature}"] if dominant_feature else [],
            l_focus=dict(cluster.feature_centroid),
            weights=dict(cluster.feature_centroid),
            reference_sessions=cluster.session_ids[:10],
            confidence=min(1.0, cluster.size / 20),
        )
