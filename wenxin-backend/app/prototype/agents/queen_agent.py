"""Queen Agent — budget-aware decision layer over Critic output.

Decision priority:
1. Early stop: gate_passed AND weighted_total >= early_stop_threshold → ACCEPT
2. Over rounds: rounds_used >= max_rounds → STOP
3. Over budget: total_cost >= max_cost_usd → STOP
4. Downgrade: total_cost >= max_cost_usd * downgrade_at_cost_pct → DOWNGRADE
5. Threshold accept: gate_passed AND weighted_total >= accept_threshold → ACCEPT
6. Rerun hint: has rerun_hint AND rounds_used < max_rounds → RERUN
7. Insufficient improvement: delta < min_improvement → STOP
8. Default → RERUN
"""

from __future__ import annotations

import time
from datetime import datetime, timezone

from app.prototype.agents.queen_config import QueenConfig
from app.prototype.agents.queen_types import (
    BudgetState,
    PlanState,
    QueenDecision,
    QueenOutput,
)


class QueenAgent:
    """Decide accept / rerun / stop / downgrade based on Critic output and budget."""

    def __init__(self, config: QueenConfig | None = None) -> None:
        self._config = config or QueenConfig()

    def decide(
        self,
        critique_output_dict: dict,
        plan_state: PlanState,
    ) -> QueenOutput:
        """Evaluate the latest critique and update plan state."""
        t0 = time.monotonic()
        cfg = self._config

        # --- Extract best candidate info from critique output ---
        scored = critique_output_dict.get("scored_candidates", [])
        best_id = critique_output_dict.get("best_candidate_id")
        rerun_hint = critique_output_dict.get("rerun_hint", [])

        best_score = 0.0
        best_gate_passed = False
        for sc in scored:
            if sc.get("candidate_id") == best_id:
                best_score = sc.get("weighted_total", 0.0)
                best_gate_passed = sc.get("gate_passed", False)
                break

        # If no best_id, pick top scorer anyway for comparison
        if not best_id and scored:
            top = scored[0]
            best_score = top.get("weighted_total", 0.0)
            best_gate_passed = top.get("gate_passed", False)

        # --- Update budget ---
        budget = plan_state.budget
        budget.rounds_used += 1
        budget.total_cost_usd += cfg.mock_cost_per_round
        budget.critic_calls += 1
        budget.candidates_generated += len(scored)
        plan_state.current_round = budget.rounds_used

        # Record this round in history
        plan_state.history.append({
            "round": budget.rounds_used,
            "best_score": round(best_score, 4),
            "best_gate_passed": best_gate_passed,
            "best_candidate_id": best_id,
            "rerun_hint": rerun_hint,
            "cost_usd": round(budget.total_cost_usd, 6),
        })

        # --- Decision logic (priority order) ---
        decision = self._decide_action(
            cfg=cfg,
            budget=budget,
            best_score=best_score,
            best_gate_passed=best_gate_passed,
            rerun_hint=rerun_hint,
            plan_state=plan_state,
        )

        # --- Update confirmed/pending dimensions ---
        if decision.action == "accept":
            plan_state.confirmed_dimensions = list(
                set(plan_state.confirmed_dimensions) | set(plan_state.pending_dimensions)
            )
            plan_state.pending_dimensions = []
        elif decision.action == "rerun":
            plan_state.pending_dimensions = decision.rerun_dimensions

        elapsed_ms = int((time.monotonic() - t0) * 1000)

        return QueenOutput(
            task_id=plan_state.task_id,
            decision=decision,
            plan_state=plan_state,
            created_at=datetime.now(timezone.utc).isoformat(),
            latency_ms=elapsed_ms,
            success=True,
            error=None,
        )

    def _decide_action(
        self,
        cfg: QueenConfig,
        budget: BudgetState,
        best_score: float,
        best_gate_passed: bool,
        rerun_hint: list[str],
        plan_state: PlanState,
    ) -> QueenDecision:
        # 1. Early stop
        if best_gate_passed and best_score >= cfg.early_stop_threshold:
            return QueenDecision(
                action="accept",
                reason=f"early stop: weighted_total {best_score:.4f} >= {cfg.early_stop_threshold}",
            )

        # 2. Over rounds
        if budget.rounds_used >= cfg.max_rounds:
            return QueenDecision(
                action="stop",
                reason=f"max rounds reached: {budget.rounds_used} >= {cfg.max_rounds}",
            )

        # 3. Over budget
        if budget.total_cost_usd >= cfg.max_cost_usd:
            return QueenDecision(
                action="stop",
                reason=f"budget exhausted: ${budget.total_cost_usd:.4f} >= ${cfg.max_cost_usd:.4f}",
            )

        # 4. Downgrade
        if budget.total_cost_usd >= cfg.max_cost_usd * cfg.downgrade_at_cost_pct:
            return QueenDecision(
                action="downgrade",
                downgrade_params={"reduce_candidates": 2, "reduce_steps": 10},
                reason=(
                    f"cost ${budget.total_cost_usd:.4f} >= "
                    f"{cfg.downgrade_at_cost_pct*100:.0f}% of ${cfg.max_cost_usd:.4f}"
                ),
            )

        # 5. Threshold accept
        if best_gate_passed and best_score >= cfg.accept_threshold:
            return QueenDecision(
                action="accept",
                reason=f"threshold accept: weighted_total {best_score:.4f} >= {cfg.accept_threshold}",
            )

        # 5b. Cross-layer signal driven rerun
        if plan_state.cross_layer_signals and budget.rounds_used < cfg.max_rounds:
            reinterpret_targets = []
            for sig in plan_state.cross_layer_signals:
                if sig.signal_type.value in ("reinterpret", "conflict", "evidence_gap"):
                    if sig.strength >= 0.3:
                        # Map target layer label to dimension ID
                        _label_to_dim = {
                            "L1": "visual_perception", "L2": "technical_analysis",
                            "L3": "cultural_context", "L4": "critical_interpretation",
                            "L5": "philosophical_aesthetic",
                        }
                        dim = _label_to_dim.get(sig.target_layer, sig.target_layer)
                        if dim not in reinterpret_targets:
                            reinterpret_targets.append(dim)
            if reinterpret_targets:
                # Determine preserve dimensions (everything not being rerun)
                all_dims = [
                    "visual_perception", "technical_analysis", "cultural_context",
                    "critical_interpretation", "philosophical_aesthetic",
                ]
                preserve = [d for d in all_dims if d not in reinterpret_targets]
                # Clear consumed signals
                plan_state.cross_layer_signals = []
                return QueenDecision(
                    action="rerun",
                    rerun_dimensions=reinterpret_targets,
                    preserve_dimensions=preserve,
                    reason=f"cross-layer signal: rerun {reinterpret_targets}",
                )

        # 6. Rerun hint
        if rerun_hint and budget.rounds_used < cfg.max_rounds:
            return QueenDecision(
                action="rerun",
                rerun_dimensions=rerun_hint,
                reason=f"rerun dimensions {rerun_hint} (round {budget.rounds_used}/{cfg.max_rounds})",
            )

        # 7. Insufficient improvement
        if len(plan_state.history) >= 2:
            prev_score = plan_state.history[-2].get("best_score", 0.0)
            delta = best_score - prev_score
            if delta < cfg.min_improvement:
                return QueenDecision(
                    action="stop",
                    reason=f"insufficient improvement: delta {delta:.4f} < {cfg.min_improvement}",
                )

        # 8. Default rerun
        return QueenDecision(
            action="rerun",
            rerun_dimensions=rerun_hint or [],
            reason="default rerun",
        )
