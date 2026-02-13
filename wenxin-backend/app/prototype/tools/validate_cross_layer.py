"""Validate Step 3: Cross-Layer Signal detection and consumption.

Tests:
1. CrossLayerSignal data class works
2. _detect_cross_layer_signals generates correct signals
3. Queen consumes REINTERPRET signals → rerun with targets
4. Queen consumes CONFLICT signals
5. Queen ignores CONFIRMATION signals (no rerun)
6. Signals cleared after consumption
7. Orchestrator propagates signals from CriticLLM to PlanState
8. E2E: signal-driven rerun flow

Run:
    python3 app/prototype/tools/validate_cross_layer.py
"""

from __future__ import annotations

import os
import sys

_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

_pass = 0
_fail = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global _pass, _fail
    if condition:
        _pass += 1
        print(f"  [PASS] {name}")
    else:
        _fail += 1
        msg = f"  [FAIL] {name}"
        if detail:
            msg += f" — {detail}"
        print(msg)


def test_signal_data_class():
    """Test 1: CrossLayerSignal works correctly."""
    print("\n=== Test 1: CrossLayerSignal data class ===")
    from app.prototype.agents.layer_state import CrossLayerSignal, SignalType

    sig = CrossLayerSignal(
        source_layer="L5",
        target_layer="L1",
        signal_type=SignalType.REINTERPRET,
        message="Re-evaluate L1",
        strength=0.8,
    )
    check("signal created", sig.source_layer == "L5")
    check("signal type", sig.signal_type == SignalType.REINTERPRET)
    check("strength", sig.strength == 0.8)

    d = sig.to_dict()
    check("to_dict works", d["signal_type"] == "reinterpret")
    check("to_dict has message", d["message"] == "Re-evaluate L1")


def test_detect_signals():
    """Test 2: _detect_cross_layer_signals rules."""
    print("\n=== Test 2: Signal detection rules ===")
    from app.prototype.agents.critic_llm import CriticLLM
    from app.prototype.agents.critic_types import DimensionScore

    # Case A: L5 high (0.9), L1 low (0.3) → REINTERPRET
    scores_a = [
        DimensionScore(dimension="visual_perception", score=0.3, rationale=""),
        DimensionScore(dimension="technical_analysis", score=0.5, rationale=""),
        DimensionScore(dimension="cultural_context", score=0.5, rationale=""),
        DimensionScore(dimension="critical_interpretation", score=0.5, rationale=""),
        DimensionScore(dimension="philosophical_aesthetic", score=0.9, rationale=""),
    ]
    signals_a = CriticLLM._detect_cross_layer_signals(scores_a)
    reinterpret_l1 = [s for s in signals_a if s.target_layer == "L1" and s.signal_type.value == "reinterpret"]
    check("L5(0.9) vs L1(0.3) → REINTERPRET", len(reinterpret_l1) >= 1)

    # Check REINTERPRET L5→L2
    reinterpret_l2 = [s for s in signals_a if s.target_layer == "L2" and s.signal_type.value == "reinterpret"]
    check("L5(0.9) vs L2(0.5) → REINTERPRET", len(reinterpret_l2) >= 1)

    # Case B: L3 low (0.3), L5 high (0.85) → CONFLICT
    scores_b = [
        DimensionScore(dimension="visual_perception", score=0.5, rationale=""),
        DimensionScore(dimension="technical_analysis", score=0.5, rationale=""),
        DimensionScore(dimension="cultural_context", score=0.3, rationale=""),
        DimensionScore(dimension="critical_interpretation", score=0.5, rationale=""),
        DimensionScore(dimension="philosophical_aesthetic", score=0.85, rationale=""),
    ]
    signals_b = CriticLLM._detect_cross_layer_signals(scores_b)
    conflicts = [s for s in signals_b if s.signal_type.value == "conflict"]
    check("L3(0.3) + L5(0.85) → CONFLICT", len(conflicts) >= 1)

    # Case C: Both L5 and L3 high → CONFIRMATION
    scores_c = [
        DimensionScore(dimension="visual_perception", score=0.5, rationale=""),
        DimensionScore(dimension="technical_analysis", score=0.5, rationale=""),
        DimensionScore(dimension="cultural_context", score=0.8, rationale=""),
        DimensionScore(dimension="critical_interpretation", score=0.5, rationale=""),
        DimensionScore(dimension="philosophical_aesthetic", score=0.8, rationale=""),
    ]
    signals_c = CriticLLM._detect_cross_layer_signals(scores_c)
    confirms = [s for s in signals_c if s.signal_type.value == "confirmation"]
    check("L3(0.8) + L5(0.8) → CONFIRMATION", len(confirms) >= 1)

    # Case D: All scores similar (no signals except maybe small ones)
    scores_d = [
        DimensionScore(dimension="visual_perception", score=0.5, rationale=""),
        DimensionScore(dimension="technical_analysis", score=0.5, rationale=""),
        DimensionScore(dimension="cultural_context", score=0.5, rationale=""),
        DimensionScore(dimension="critical_interpretation", score=0.5, rationale=""),
        DimensionScore(dimension="philosophical_aesthetic", score=0.5, rationale=""),
    ]
    signals_d = CriticLLM._detect_cross_layer_signals(scores_d)
    reinterprets_d = [s for s in signals_d if s.signal_type.value == "reinterpret"]
    check("Uniform scores → no REINTERPRET", len(reinterprets_d) == 0)

    # Case E: L4 vs L1 divergence → EVIDENCE_GAP
    scores_e = [
        DimensionScore(dimension="visual_perception", score=0.3, rationale=""),
        DimensionScore(dimension="technical_analysis", score=0.5, rationale=""),
        DimensionScore(dimension="cultural_context", score=0.5, rationale=""),
        DimensionScore(dimension="critical_interpretation", score=0.8, rationale=""),
        DimensionScore(dimension="philosophical_aesthetic", score=0.5, rationale=""),
    ]
    signals_e = CriticLLM._detect_cross_layer_signals(scores_e)
    evidence_gaps = [s for s in signals_e if s.signal_type.value == "evidence_gap"]
    check("L4(0.8) vs L1(0.3) → EVIDENCE_GAP", len(evidence_gaps) >= 1)


def test_queen_consumes_reinterpret():
    """Test 3: Queen consumes REINTERPRET signals → rerun."""
    print("\n=== Test 3: Queen consumes REINTERPRET ===")
    from app.prototype.agents.queen_agent import QueenAgent
    from app.prototype.agents.queen_types import PlanState
    from app.prototype.agents.layer_state import CrossLayerSignal, SignalType

    queen = QueenAgent()
    plan_state = PlanState(task_id="test-signal")
    plan_state.cross_layer_signals = [
        CrossLayerSignal(
            source_layer="L5",
            target_layer="L1",
            signal_type=SignalType.REINTERPRET,
            message="Re-evaluate L1",
            strength=0.5,
        ),
    ]

    critique_dict = {
        "scored_candidates": [
            {
                "candidate_id": "c1",
                "weighted_total": 0.55,
                "gate_passed": True,
            },
        ],
        "best_candidate_id": "c1",
        "rerun_hint": [],
    }

    output = queen.decide(critique_dict, plan_state)
    check("decision is rerun", output.decision.action == "rerun")
    check(
        "rerun targets L1",
        "visual_perception" in output.decision.rerun_dimensions,
        f"got {output.decision.rerun_dimensions}",
    )
    check("reason mentions cross-layer", "cross-layer" in output.decision.reason)


def test_queen_consumes_conflict():
    """Test 4: Queen consumes CONFLICT signals."""
    print("\n=== Test 4: Queen consumes CONFLICT ===")
    from app.prototype.agents.queen_agent import QueenAgent
    from app.prototype.agents.queen_types import PlanState
    from app.prototype.agents.layer_state import CrossLayerSignal, SignalType

    queen = QueenAgent()
    plan_state = PlanState(task_id="test-conflict")
    plan_state.cross_layer_signals = [
        CrossLayerSignal(
            source_layer="L5",
            target_layer="L3",
            signal_type=SignalType.CONFLICT,
            message="Cultural grounding inconsistency",
            strength=0.8,
        ),
    ]

    critique_dict = {
        "scored_candidates": [
            {"candidate_id": "c1", "weighted_total": 0.55, "gate_passed": True},
        ],
        "best_candidate_id": "c1",
        "rerun_hint": [],
    }

    output = queen.decide(critique_dict, plan_state)
    check("conflict → rerun", output.decision.action == "rerun")
    check(
        "targets L3",
        "cultural_context" in output.decision.rerun_dimensions,
    )


def test_queen_ignores_confirmation():
    """Test 5: Queen ignores CONFIRMATION signals (no rerun trigger)."""
    print("\n=== Test 5: Queen ignores CONFIRMATION ===")
    from app.prototype.agents.queen_agent import QueenAgent
    from app.prototype.agents.queen_types import PlanState
    from app.prototype.agents.layer_state import CrossLayerSignal, SignalType

    queen = QueenAgent()
    plan_state = PlanState(task_id="test-confirm")
    plan_state.cross_layer_signals = [
        CrossLayerSignal(
            source_layer="L5",
            target_layer="L3",
            signal_type=SignalType.CONFIRMATION,
            message="Confirmed",
            strength=0.9,
        ),
    ]

    critique_dict = {
        "scored_candidates": [
            {"candidate_id": "c1", "weighted_total": 0.80, "gate_passed": True},
        ],
        "best_candidate_id": "c1",
        "rerun_hint": [],
    }

    output = queen.decide(critique_dict, plan_state)
    # With high score + gate passed, should accept (not rerun due to confirmation)
    check("confirmation → accept or early_stop", output.decision.action in ("accept",))


def test_signals_cleared():
    """Test 6: Signals cleared after consumption."""
    print("\n=== Test 6: Signals cleared ===")
    from app.prototype.agents.queen_agent import QueenAgent
    from app.prototype.agents.queen_types import PlanState
    from app.prototype.agents.layer_state import CrossLayerSignal, SignalType

    queen = QueenAgent()
    plan_state = PlanState(task_id="test-clear")
    plan_state.cross_layer_signals = [
        CrossLayerSignal(
            source_layer="L5", target_layer="L1",
            signal_type=SignalType.REINTERPRET,
            message="test", strength=0.5,
        ),
    ]

    critique_dict = {
        "scored_candidates": [
            {"candidate_id": "c1", "weighted_total": 0.55, "gate_passed": True},
        ],
        "best_candidate_id": "c1",
        "rerun_hint": [],
    }

    output = queen.decide(critique_dict, plan_state)
    check("signals consumed", len(plan_state.cross_layer_signals) == 0)


def test_critic_llm_accumulates_signals():
    """Test 7: CriticLLM accumulates signals."""
    print("\n=== Test 7: CriticLLM signal accumulation ===")
    from app.prototype.agents.critic_llm import CriticLLM
    from app.prototype.agents.critic_config import CriticConfig
    from app.prototype.agents.critic_types import CritiqueInput

    config = CriticConfig()
    critic = CriticLLM(config=config)

    check("cross_layer_signals initialized", critic.cross_layer_signals == [])

    inp = CritiqueInput(
        task_id="signal-test",
        subject="Mountain landscape",
        cultural_tradition="default",
        evidence={
            "sample_matches": [],
            "terminology_hits": [],
            "taboo_violations": [],
        },
        candidates=[
            {
                "candidate_id": "c1",
                "prompt": "test",
                "model_ref": "mock",
                "steps": 1,
                "sampler": "euler",
            },
        ],
    )
    output = critic.run(inp)
    check("signals list is list", isinstance(critic.cross_layer_signals, list))
    # Mock mode: rule scores may or may not trigger signals — just verify structure
    for sig in critic.cross_layer_signals:
        check(f"signal {sig.signal_type.value} is valid", sig.strength >= 0)


def test_orchestrator_propagation():
    """Test 8: Orchestrator propagates signals."""
    print("\n=== Test 8: Orchestrator signal propagation ===")
    import inspect
    from app.prototype.orchestrator.orchestrator import PipelineOrchestrator

    src = inspect.getsource(PipelineOrchestrator.run_stream)
    check("orchestrator checks cross_layer_signals", "cross_layer_signals" in src)
    check("orchestrator extends plan_state", "plan_state.cross_layer_signals" in src)


def main():
    print("=" * 60)
    print("Step 3 Validation: Cross-Layer Signal Detection & Consumption")
    print("=" * 60)

    test_signal_data_class()
    test_detect_signals()
    test_queen_consumes_reinterpret()
    test_queen_consumes_conflict()
    test_queen_ignores_confirmation()
    test_signals_cleared()
    test_critic_llm_accumulates_signals()
    test_orchestrator_propagation()

    print("\n" + "=" * 60)
    total = _pass + _fail
    print(f"Results: {_pass}/{total} passed, {_fail} failed")
    print("=" * 60)

    return 0 if _fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
