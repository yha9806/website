"""PromptDistiller — extract prompt patterns from high-scoring sessions.

Identifies common patterns in prompts that lead to high scores,
distilling them into reusable prompt archetypes.
"""

from __future__ import annotations

import logging
import re
from collections import Counter
from dataclasses import dataclass, field

logger = logging.getLogger("vulca")

_SCORE_THRESHOLD = 0.70  # Only learn from sessions scoring above this


@dataclass
class PromptArchetype:
    """A distilled prompt pattern from high-scoring sessions."""

    pattern: str
    avg_score: float = 0.0
    count: int = 0
    traditions: list[str] = field(default_factory=list)
    example_prompts: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "pattern": self.pattern,
            "avg_score": round(self.avg_score, 4),
            "count": self.count,
            "traditions": self.traditions,
            "example_prompts": self.example_prompts[:3],
        }


class PromptDistiller:
    """Extract prompt archetypes from high-scoring sessions."""

    def __init__(self, score_threshold: float = _SCORE_THRESHOLD) -> None:
        self._threshold = score_threshold

    def distill(self, sessions: list[dict]) -> list[PromptArchetype]:
        """Analyze sessions and extract common prompt patterns.

        Parameters
        ----------
        sessions : list[dict]
            Session dicts with 'intent', 'final_weighted_total', 'tradition'.

        Returns
        -------
        list[PromptArchetype]
            Distilled prompt patterns sorted by frequency.
        """
        high_scoring = [
            s for s in sessions
            if s.get("final_weighted_total", 0) >= self._threshold
            and s.get("intent")
        ]
        if not high_scoring:
            return []

        # Extract keyword patterns from intents
        keyword_sessions: dict[str, list[dict]] = {}
        for s in high_scoring:
            intent = s.get("intent", "")
            keywords = self._extract_keywords(intent)
            for kw in keywords:
                keyword_sessions.setdefault(kw, []).append(s)

        # Build archetypes from frequent keywords
        archetypes: list[PromptArchetype] = []
        for kw, sess_list in keyword_sessions.items():
            if len(sess_list) < 2:
                continue  # Need at least 2 occurrences

            avg_score = sum(s.get("final_weighted_total", 0) for s in sess_list) / len(sess_list)
            traditions = list({s.get("tradition", "default") for s in sess_list})
            examples = [s.get("intent", "") for s in sess_list[:3]]

            archetypes.append(PromptArchetype(
                pattern=kw,
                avg_score=avg_score,
                count=len(sess_list),
                traditions=traditions,
                example_prompts=examples,
            ))

        # Sort by count descending
        archetypes.sort(key=lambda a: a.count, reverse=True)
        logger.info("PromptDistiller: %d high-scoring sessions → %d archetypes", len(high_scoring), len(archetypes))
        return archetypes[:20]  # Top 20

    @staticmethod
    def _extract_keywords(text: str) -> list[str]:
        """Extract meaningful keywords from intent text (English + Chinese)."""
        # Remove common stop words and extract content words
        stop_words = {
            "a", "an", "the", "in", "on", "at", "to", "for", "of", "with",
            "and", "or", "but", "is", "are", "was", "were", "be", "been",
            "this", "that", "it", "its", "my", "your", "his", "her",
        }
        # English words
        en_words = re.findall(r'[a-z]+', text.lower())
        en_words = [w for w in en_words if len(w) >= 3 and w not in stop_words]
        # Chinese bigrams/trigrams (CJK Unified Ideographs)
        zh_words = re.findall(r'[\u4e00-\u9fff]{2,4}', text)
        return (en_words + zh_words)[:20]
