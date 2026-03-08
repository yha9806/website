"""Layer 2a: PatternDetector — discover systematic scoring patterns.

Example patterns:
- "watercolor L1 systematically low" (avg L1 < 0.5 across 10+ sessions)
- "chinese_xieyi L5 consistently high" (avg L5 > 0.8)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.prototype.digestion.aggregator import DigestAggregator, TraditionStats

logger = logging.getLogger("vulca")

_LOW_THRESHOLD = 0.50
_HIGH_THRESHOLD = 0.80
_MIN_SESSIONS = 5  # Need at least this many sessions to detect a pattern


@dataclass
class Pattern:
    """A detected scoring pattern."""

    tradition: str
    dimension: str
    pattern_type: str  # "systematically_low" | "consistently_high" | "negative_feedback_dominant"
    avg_score: float = 0.0
    session_count: int = 0
    description: str = ""

    def to_dict(self) -> dict:
        return {
            "tradition": self.tradition,
            "dimension": self.dimension,
            "pattern_type": self.pattern_type,
            "avg_score": round(self.avg_score, 4),
            "session_count": self.session_count,
            "description": self.description,
        }


class PatternDetector:
    """Detect systematic patterns from aggregated stats."""

    def __init__(self, aggregator: DigestAggregator | None = None) -> None:
        self._aggregator = aggregator or DigestAggregator()

    def detect(self) -> list[Pattern]:
        """Run pattern detection on current aggregate data."""
        stats = self._aggregator.aggregate()
        patterns: list[Pattern] = []

        for tradition, ts in stats.items():
            if ts.session_count < _MIN_SESSIONS:
                continue

            # Dimension-level patterns
            for dim, avg in ts.avg_scores_by_dim.items():
                if avg < _LOW_THRESHOLD:
                    patterns.append(Pattern(
                        tradition=tradition,
                        dimension=dim,
                        pattern_type="systematically_low",
                        avg_score=avg,
                        session_count=ts.session_count,
                        description=f"{tradition} {dim} avg={avg:.2f} across {ts.session_count} sessions",
                    ))
                elif avg > _HIGH_THRESHOLD:
                    patterns.append(Pattern(
                        tradition=tradition,
                        dimension=dim,
                        pattern_type="consistently_high",
                        avg_score=avg,
                        session_count=ts.session_count,
                        description=f"{tradition} {dim} avg={avg:.2f} across {ts.session_count} sessions",
                    ))

            # Feedback-level pattern
            total_fb = ts.thumbs_up + ts.thumbs_down
            if total_fb >= _MIN_SESSIONS and ts.thumbs_down > ts.thumbs_up * 2:
                patterns.append(Pattern(
                    tradition=tradition,
                    dimension="feedback",
                    pattern_type="negative_feedback_dominant",
                    session_count=ts.session_count,
                    description=f"{tradition}: {ts.thumbs_down} down vs {ts.thumbs_up} up",
                ))

        logger.info("PatternDetector: found %d patterns", len(patterns))
        return patterns
