"""Layer 2b: PreferenceLearner — learn user preferences from feedback.

Learns from thumbs_up/down feedback to build preference profiles.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass, field

from app.prototype.session.store import SessionStore

logger = logging.getLogger("vulca")


@dataclass
class PreferenceProfile:
    """Learned preference for a tradition or user."""

    key: str  # tradition name or user_id
    preferred_dimensions: list[str] = field(default_factory=list)  # dims that correlate with thumbs_up
    avoided_dimensions: list[str] = field(default_factory=list)  # dims that correlate with thumbs_down
    preferred_traditions: list[str] = field(default_factory=list)
    total_positive: int = 0
    total_negative: int = 0

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "preferred_dimensions": self.preferred_dimensions,
            "avoided_dimensions": self.avoided_dimensions,
            "preferred_traditions": self.preferred_traditions,
            "total_positive": self.total_positive,
            "total_negative": self.total_negative,
        }


class PreferenceLearner:
    """Learn preferences from session feedback data."""

    def __init__(self, store: SessionStore | None = None) -> None:
        self._store = store or SessionStore.get()

    def learn(self) -> dict[str, PreferenceProfile]:
        """Analyze sessions to build preference profiles by tradition."""
        sessions = self._store.get_all()
        if not sessions:
            return {}

        # Group sessions with feedback by tradition
        by_tradition: dict[str, list[dict]] = defaultdict(list)
        for s in sessions:
            if s.get("feedback"):
                by_tradition[s.get("tradition", "default")].append(s)

        profiles: dict[str, PreferenceProfile] = {}
        for tradition, sess_list in by_tradition.items():
            profile = PreferenceProfile(key=tradition)

            # Track which dimensions score high in positive vs negative feedback
            pos_dim_scores: dict[str, list[float]] = defaultdict(list)
            neg_dim_scores: dict[str, list[float]] = defaultdict(list)

            for s in sess_list:
                scores = s.get("final_scores", {})
                for fb in s.get("feedback", []):
                    rating = fb.get("rating", "")
                    if rating == "thumbs_up":
                        profile.total_positive += 1
                        for dim, score in scores.items():
                            if isinstance(score, (int, float)):
                                pos_dim_scores[dim].append(score)
                    elif rating == "thumbs_down":
                        profile.total_negative += 1
                        for dim, score in scores.items():
                            if isinstance(score, (int, float)):
                                neg_dim_scores[dim].append(score)

            # Find dimensions that are higher in positive-rated sessions
            for dim in set(pos_dim_scores) | set(neg_dim_scores):
                pos_avg = sum(pos_dim_scores.get(dim, [0])) / max(len(pos_dim_scores.get(dim, [1])), 1)
                neg_avg = sum(neg_dim_scores.get(dim, [0])) / max(len(neg_dim_scores.get(dim, [1])), 1)
                if pos_avg > neg_avg + 0.1:
                    profile.preferred_dimensions.append(dim)
                elif neg_avg > pos_avg + 0.1:
                    profile.avoided_dimensions.append(dim)

            profiles[tradition] = profile

        return profiles
