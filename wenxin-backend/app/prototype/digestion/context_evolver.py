"""Layer 3: ContextEvolver — safely update evolved_context.json.

Safety guardrails:
- Single adjustment ≤ ±0.05
- Weights always sum to 1.0
- Minimum 10 sessions before evolving
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from app.prototype.digestion.aggregator import DigestAggregator
from app.prototype.digestion.pattern_detector import Pattern, PatternDetector
from app.prototype.digestion.preference_learner import PreferenceLearner
from app.prototype.session.store import SessionStore

logger = logging.getLogger("vulca")

_MAX_DELTA = 0.05
_MIN_SESSIONS_TO_EVOLVE = 10
_DEFAULT_CONTEXT_PATH = os.path.join(
    os.path.dirname(__file__), os.pardir, "data", "evolved_context.json"
)


@dataclass
class EvolutionAction:
    """A single weight adjustment action."""

    tradition: str
    dimension: str
    old_value: float
    new_value: float
    reason: str

    def to_dict(self) -> dict:
        return {
            "tradition": self.tradition,
            "dimension": self.dimension,
            "old_value": round(self.old_value, 4),
            "new_value": round(self.new_value, 4),
            "delta": round(self.new_value - self.old_value, 4),
            "reason": self.reason,
        }


@dataclass
class EvolutionResult:
    """Result of a context evolution run."""

    actions: list[EvolutionAction] = field(default_factory=list)
    patterns_found: int = 0
    sessions_analyzed: int = 0
    skipped_reason: str = ""

    def to_dict(self) -> dict:
        return {
            "actions": [a.to_dict() for a in self.actions],
            "patterns_found": self.patterns_found,
            "sessions_analyzed": self.sessions_analyzed,
            "skipped_reason": self.skipped_reason,
        }


class ContextEvolver:
    """Read digestion results and safely evolve context weights."""

    def __init__(
        self,
        store: SessionStore | None = None,
        context_path: str | None = None,
    ) -> None:
        self._store = store or SessionStore.get()
        self._context_path = Path(context_path or _DEFAULT_CONTEXT_PATH).resolve()
        self._detector = PatternDetector(DigestAggregator(self._store))
        self._learner = PreferenceLearner(self._store)

    def evolve(self) -> EvolutionResult:
        """Run full evolution cycle: detect → learn → adjust → save."""
        session_count = self._store.count()

        if session_count < _MIN_SESSIONS_TO_EVOLVE:
            return EvolutionResult(
                sessions_analyzed=session_count,
                skipped_reason=f"Need {_MIN_SESSIONS_TO_EVOLVE} sessions, have {session_count}",
            )

        # Detect patterns
        patterns = self._detector.detect()

        # Load current context
        context = self._load_context()

        # Generate evolution actions from patterns
        actions: list[EvolutionAction] = []
        for pattern in patterns:
            if pattern.pattern_type == "systematically_low" and pattern.dimension != "feedback":
                action = self._boost_dimension(context, pattern)
                if action:
                    actions.append(action)
            elif pattern.pattern_type == "negative_feedback_dominant":
                # Don't auto-adjust for feedback patterns; log only
                logger.info("Feedback pattern detected for %s: %s", pattern.tradition, pattern.description)

        # Apply and save
        if actions:
            self._save_context(context)

        return EvolutionResult(
            actions=actions,
            patterns_found=len(patterns),
            sessions_analyzed=session_count,
        )

    def _boost_dimension(self, context: dict, pattern: Pattern) -> EvolutionAction | None:
        """Boost a systematically low dimension's weight, keeping sum=1.0."""
        tradition = pattern.tradition
        dim = pattern.dimension

        weights = context.get("tradition_weights", {}).get(tradition, {})
        if not weights or dim not in weights:
            return None

        old_val = weights[dim]
        delta = min(_MAX_DELTA, (0.60 - pattern.avg_score) * 0.1)
        delta = max(0.0, delta)  # Only boost, don't reduce

        if delta < 0.005:
            return None  # Too small to matter

        new_val = min(1.0, old_val + delta)

        # Redistribute: reduce other dims proportionally to keep sum=1.0
        other_dims = [d for d in weights if d != dim]
        reduction_total = new_val - old_val
        other_total = sum(weights[d] for d in other_dims)
        if other_total > 0:
            for d in other_dims:
                share = weights[d] / other_total
                weights[d] = max(0.05, weights[d] - reduction_total * share)

        weights[dim] = new_val

        # Normalize to exactly 1.0
        total = sum(weights.values())
        if total > 0:
            for d in weights:
                weights[d] = weights[d] / total

        context.setdefault("tradition_weights", {})[tradition] = weights

        return EvolutionAction(
            tradition=tradition,
            dimension=dim,
            old_value=old_val,
            new_value=weights[dim],
            reason=pattern.description,
        )

    def _load_context(self) -> dict:
        """Load evolved context or return default structure."""
        if self._context_path.exists():
            try:
                with open(self._context_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, ValueError):
                pass
        return {"tradition_weights": {}, "version": 1, "evolutions": 0}

    def _save_context(self, context: dict) -> None:
        """Atomically save evolved context to avoid corruption on crash."""
        context["evolutions"] = context.get("evolutions", 0) + 1
        self._context_path.parent.mkdir(parents=True, exist_ok=True)
        dir_name = str(self._context_path.parent)
        fd, tmp_path = tempfile.mkstemp(dir=dir_name, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(context, f, indent=2, ensure_ascii=False)
            os.replace(tmp_path, str(self._context_path))  # atomic on POSIX
        except BaseException:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            raise
        logger.info("ContextEvolver: saved evolved context (evolution #%d)", context["evolutions"])
