"""Layer 1: DigestAggregator — perception layer.

Reads sessions.jsonl and aggregates by tradition, time window, and mode.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass, field

from app.prototype.session.store import SessionStore

logger = logging.getLogger("vulca")


@dataclass
class TraditionStats:
    """Aggregated stats for one tradition."""

    tradition: str = ""
    session_count: int = 0
    avg_weighted_total: float = 0.0
    mode_counts: dict[str, int] = field(default_factory=dict)
    avg_scores_by_dim: dict[str, float] = field(default_factory=dict)
    thumbs_up: int = 0
    thumbs_down: int = 0

    def to_dict(self) -> dict:
        return {
            "tradition": self.tradition,
            "session_count": self.session_count,
            "avg_weighted_total": round(self.avg_weighted_total, 4),
            "mode_counts": self.mode_counts,
            "avg_scores_by_dim": {k: round(v, 4) for k, v in self.avg_scores_by_dim.items()},
            "thumbs_up": self.thumbs_up,
            "thumbs_down": self.thumbs_down,
        }


class DigestAggregator:
    """Aggregate session digests into per-tradition statistics."""

    def __init__(self, store: SessionStore | None = None) -> None:
        self._store = store or SessionStore.get()

    def aggregate(self) -> dict[str, TraditionStats]:
        """Read all sessions and produce per-tradition stats."""
        sessions = self._store.get_all()
        if not sessions:
            return {}

        by_tradition: dict[str, list[dict]] = defaultdict(list)
        for s in sessions:
            by_tradition[s.get("tradition", "default")].append(s)

        result: dict[str, TraditionStats] = {}
        for tradition, sess_list in by_tradition.items():
            stats = TraditionStats(tradition=tradition, session_count=len(sess_list))

            # Mode counts
            modes: dict[str, int] = defaultdict(int)
            for s in sess_list:
                modes[s.get("mode", "unknown")] += 1
            stats.mode_counts = dict(modes)

            # Average weighted total
            totals = [s.get("final_weighted_total", 0.0) for s in sess_list if s.get("final_weighted_total")]
            stats.avg_weighted_total = sum(totals) / len(totals) if totals else 0.0

            # Average dimension scores
            dim_sums: dict[str, float] = defaultdict(float)
            dim_counts: dict[str, int] = defaultdict(int)
            for s in sess_list:
                for dim, score in s.get("final_scores", {}).items():
                    if isinstance(score, (int, float)):
                        dim_sums[dim] += score
                        dim_counts[dim] += 1
            stats.avg_scores_by_dim = {
                dim: dim_sums[dim] / dim_counts[dim]
                for dim in dim_sums
                if dim_counts[dim] > 0
            }

            # Feedback counts
            for s in sess_list:
                for fb in s.get("feedback", []):
                    rating = fb.get("rating", "")
                    if rating == "thumbs_up":
                        stats.thumbs_up += 1
                    elif rating == "thumbs_down":
                        stats.thumbs_down += 1

            result[tradition] = stats

        return result
