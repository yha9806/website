"""QueenConfig — budget guardrails, round limits, and decision thresholds."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class QueenConfig:
    """Configuration for the Queen Agent decision logic."""

    max_rounds: int = 2                # maximum iteration rounds
    max_cost_usd: float = 0.10        # per-task cost ceiling
    accept_threshold: float = 0.6      # weighted_total >= 0.6 → accept
    early_stop_threshold: float = 0.8  # >= 0.8 → immediate accept, skip further rounds
    min_improvement: float = 0.05      # improvement < 0.05 between rounds → stop
    downgrade_at_cost_pct: float = 0.8 # cost >= 80% of max → trigger downgrade
    mock_cost_per_round: float = 0.02  # simulated cost per round in mock mode

    def to_dict(self) -> dict:
        return {
            "max_rounds": self.max_rounds,
            "max_cost_usd": self.max_cost_usd,
            "accept_threshold": self.accept_threshold,
            "early_stop_threshold": self.early_stop_threshold,
            "min_improvement": self.min_improvement,
            "downgrade_at_cost_pct": self.downgrade_at_cost_pct,
            "mock_cost_per_round": self.mock_cost_per_round,
        }
