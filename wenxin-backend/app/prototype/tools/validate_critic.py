#!/usr/bin/env python3
"""D6 validation — Critic Agent end-to-end checks.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_critic.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.critic_agent import CriticAgent  # noqa: E402
from app.prototype.agents.critic_config import DIMENSIONS, CriticConfig  # noqa: E402
from app.prototype.agents.critic_types import (  # noqa: E402
    CritiqueInput,
    CritiqueOutput,
)
from app.prototype.agents.draft_agent import DraftAgent  # noqa: E402
from app.prototype.agents.draft_config import DraftConfig  # noqa: E402
from app.prototype.agents.draft_types import DraftInput  # noqa: E402
from app.prototype.checkpoints.critic_checkpoint import load_critic_checkpoint  # noqa: E402
from app.prototype.tools.scout_service import ScoutService  # noqa: E402

# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

_CASES = [
    {
        "name": "Case 1: Chinese xieyi (normal — expect pass)",
        "task_id": "d6-test-chinese-001",
        "subject": "Dong Yuan landscape with hemp-fiber texture strokes",
        "tradition": "chinese_xieyi",
        "expect_gate": True,
    },
    {
        "name": "Case 2: Western academic (normal — expect pass)",
        "task_id": "d6-test-western-001",
        "subject": "Caravaggio's dramatic chiaroscuro scene",
        "tradition": "western_academic",
        "expect_gate": True,
    },
    {
        "name": "Case 3: Default cross-cultural (normal — expect pass)",
        "task_id": "d6-test-default-001",
        "subject": "Cross-cultural composition analysis",
        "tradition": "default",
        "expect_gate": True,
    },
    {
        "name": "Case 4: Taboo violation (expect REJECT)",
        "task_id": "d6-test-taboo-001",
        "subject": "primitive art tribal art savage exotic",
        "tradition": "western_academic",
        "expect_gate": False,
    },
]

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

passed = 0
failed = 0


def check(label: str, condition: bool, detail: str = "") -> None:
    global passed, failed
    if condition:
        passed += 1
        print(f"  [PASS] {label}")
    else:
        failed += 1
        msg = f"  [FAIL] {label}"
        if detail:
            msg += f" — {detail}"
        print(msg)


def _build_critique_input(case: dict) -> CritiqueInput:
    """Build CritiqueInput by running Scout + Draft for a test case."""
    scout = ScoutService()
    evidence = scout.gather_evidence(
        subject=case["subject"],
        cultural_tradition=case["tradition"],
    )

    draft_config = DraftConfig(provider="mock", n_candidates=4, seed_base=42)
    draft_agent = DraftAgent(config=draft_config)
    draft_input = DraftInput(
        task_id=case["task_id"],
        subject=case["subject"],
        cultural_tradition=case["tradition"],
        evidence=evidence.to_dict(),
        config=draft_config,
    )
    draft_output = draft_agent.run(draft_input)

    return CritiqueInput(
        task_id=case["task_id"],
        subject=case["subject"],
        cultural_tradition=case["tradition"],
        evidence=evidence.to_dict(),
        candidates=[c.to_dict() for c in draft_output.candidates],
    )


def run_case(case: dict) -> CritiqueOutput:
    print(f"\n{'='*60}")
    print(f"  {case['name']}")
    print(f"{'='*60}")

    critique_input = _build_critique_input(case)
    critic = CriticAgent()
    output = critic.run(critique_input)

    # 1. Every candidate has exactly 5 dimension scores (L1-L5)
    for sc in output.scored_candidates:
        check(
            f"{sc.candidate_id}: has 5 dimension scores",
            len(sc.dimension_scores) == 5,
            f"got {len(sc.dimension_scores)}",
        )
        dims_found = {ds.dimension for ds in sc.dimension_scores}
        check(
            f"{sc.candidate_id}: dimensions match L1-L5",
            dims_found == set(DIMENSIONS),
            f"got {dims_found}",
        )

    # 2. Weighted total in [0.0, 1.0]
    for sc in output.scored_candidates:
        check(
            f"{sc.candidate_id}: weighted_total in [0,1]",
            0.0 <= sc.weighted_total <= 1.0,
            f"got {sc.weighted_total}",
        )

    # 3. Sorted descending by weighted_total
    totals = [sc.weighted_total for sc in output.scored_candidates]
    check(
        "Candidates sorted descending by weighted_total",
        totals == sorted(totals, reverse=True),
        f"totals={totals}",
    )

    # 4. Gate expectation
    if case["expect_gate"]:
        has_any_pass = any(sc.gate_passed for sc in output.scored_candidates)
        check(
            "At least one candidate passes gate",
            has_any_pass,
        )
        check(
            "best_candidate_id is set",
            output.best_candidate_id is not None,
        )
    else:
        all_fail = all(not sc.gate_passed for sc in output.scored_candidates)
        check(
            "ALL candidates fail gate (taboo case)",
            all_fail,
        )
        # Rejected reasons must be non-empty for every failing candidate
        for sc in output.scored_candidates:
            check(
                f"{sc.candidate_id}: rejected_reasons non-empty",
                len(sc.rejected_reasons) > 0,
                f"reasons={sc.rejected_reasons}",
            )
        # Risk tags must include taboo_critical
        for sc in output.scored_candidates:
            check(
                f"{sc.candidate_id}: risk_tags contains taboo_critical",
                "taboo_critical" in sc.risk_tags,
                f"tags={sc.risk_tags}",
            )

    # 5. CritiqueOutput.to_dict() structure
    od = output.to_dict()
    expected_keys = {
        "task_id", "scored_candidates", "best_candidate_id",
        "rerun_hint", "created_at", "latency_ms", "success", "error",
    }
    check(
        "CritiqueOutput.to_dict() has all keys",
        set(od.keys()) >= expected_keys,
        f"missing={expected_keys - set(od.keys())}",
    )

    # 6. DimensionScore.to_dict() fields
    if output.scored_candidates and output.scored_candidates[0].dimension_scores:
        ds_dict = output.scored_candidates[0].dimension_scores[0].to_dict()
        check(
            "DimensionScore.to_dict() has dimension/score/rationale",
            set(ds_dict.keys()) >= {"dimension", "score", "rationale"},
            f"keys={set(ds_dict.keys())}",
        )

    # 7. CandidateScore.to_dict() fields
    if output.scored_candidates:
        cs_dict = output.scored_candidates[0].to_dict()
        cs_expected = {
            "candidate_id", "dimension_scores", "weighted_total",
            "risk_tags", "gate_passed", "rejected_reasons",
        }
        check(
            "CandidateScore.to_dict() has all keys",
            set(cs_dict.keys()) >= cs_expected,
            f"missing={cs_expected - set(cs_dict.keys())}",
        )

    # 8. Checkpoint
    ckpt = load_critic_checkpoint(case["task_id"])
    check(
        "Checkpoint run.json exists and loads",
        ckpt is not None,
    )
    if ckpt is not None:
        check(
            "Checkpoint JSON is valid (has task_id)",
            ckpt.get("task_id") == case["task_id"],
            f"got task_id={ckpt.get('task_id')}",
        )
        # Verify JSON round-trip
        check(
            "Checkpoint JSON round-trips cleanly",
            json.loads(json.dumps(ckpt)) == ckpt,
        )

    # 9. success flag
    check("CritiqueOutput.success == True", output.success)

    return output


def run_d61_cases() -> None:
    """D6.1 regression: empty candidates, non-normalized weights, top_k=1."""
    print(f"\n{'='*60}")
    print("  D6.1 Post-Review Cases (5-7)")
    print(f"{'='*60}")

    # --- Case 5: Empty candidates → success=False + checkpoint ---
    print("\n  Case 5: Empty candidates → success=False")
    empty_input = CritiqueInput(
        task_id="d61-empty-candidates",
        subject="empty test",
        cultural_tradition="default",
        evidence={"sample_matches": [], "terminology_hits": [], "taboo_violations": []},
        candidates=[],
    )
    critic = CriticAgent()
    out5 = critic.run(empty_input)
    check("Case5: success == False", out5.success is False)
    check("Case5: error contains 'no candidates'", out5.error is not None and "no candidates" in out5.error)
    check("Case5: scored_candidates is empty", len(out5.scored_candidates) == 0)
    check("Case5: best_candidate_id is None", out5.best_candidate_id is None)
    # Checkpoint should still be saved
    from app.prototype.checkpoints.critic_checkpoint import load_critic_checkpoint
    ckpt5 = load_critic_checkpoint("d61-empty-candidates")
    check("Case5: checkpoint saved", ckpt5 is not None)
    if ckpt5:
        check("Case5: checkpoint has success=False", ckpt5.get("success") is False)

    # --- Case 6: Non-normalized weights → auto-normalize ---
    print("\n  Case 6: Non-normalized weights → auto-normalize")
    bad_weights = {
        "visual_perception": 3.0,
        "technical_analysis": 4.0,
        "cultural_context": 5.0,
        "critical_interpretation": 4.0,
        "philosophical_aesthetic": 4.0,
    }
    cfg6 = CriticConfig(weights=bad_weights)
    # After __post_init__, weights should be normalized
    w_sum = sum(cfg6.weights.values())
    check("Case6: weights sum ≈ 1.0 after normalization", abs(w_sum - 1.0) < 1e-6, f"got sum={w_sum}")

    # Run with normalized weights — weighted_total should still be in [0,1]
    scout = ScoutService()
    ev6 = scout.gather_evidence("Dong Yuan landscape", "chinese_xieyi")
    draft_cfg6 = DraftConfig(provider="mock", n_candidates=2, seed_base=100)
    draft_agent6 = DraftAgent(config=draft_cfg6)
    draft_in6 = DraftInput(
        task_id="d61-normalize-weights",
        subject="Dong Yuan landscape",
        cultural_tradition="chinese_xieyi",
        evidence=ev6.to_dict(),
        config=draft_cfg6,
    )
    draft_out6 = draft_agent6.run(draft_in6)
    crit_in6 = CritiqueInput(
        task_id="d61-normalize-weights",
        subject="Dong Yuan landscape",
        cultural_tradition="chinese_xieyi",
        evidence=ev6.to_dict(),
        candidates=[c.to_dict() for c in draft_out6.candidates],
    )
    critic6 = CriticAgent(config=cfg6)
    out6 = critic6.run(crit_in6)
    for sc in out6.scored_candidates:
        check(
            f"Case6 {sc.candidate_id}: weighted_total in [0,1]",
            0.0 <= sc.weighted_total <= 1.0,
            f"got {sc.weighted_total}",
        )

    # --- Case 7: top_k=1 → only 1 scored candidate in output ---
    print("\n  Case 7: top_k=1 → scored_candidates length == 1")
    cfg7 = CriticConfig(top_k=1)
    scout7 = ScoutService()
    ev7 = scout7.gather_evidence("Caravaggio chiaroscuro", "western_academic")
    draft_cfg7 = DraftConfig(provider="mock", n_candidates=4, seed_base=200)
    draft_agent7 = DraftAgent(config=draft_cfg7)
    draft_in7 = DraftInput(
        task_id="d61-topk-1",
        subject="Caravaggio chiaroscuro",
        cultural_tradition="western_academic",
        evidence=ev7.to_dict(),
        config=draft_cfg7,
    )
    draft_out7 = draft_agent7.run(draft_in7)
    crit_in7 = CritiqueInput(
        task_id="d61-topk-1",
        subject="Caravaggio chiaroscuro",
        cultural_tradition="western_academic",
        evidence=ev7.to_dict(),
        candidates=[c.to_dict() for c in draft_out7.candidates],
    )
    critic7 = CriticAgent(config=cfg7)
    out7 = critic7.run(crit_in7)
    check("Case7: scored_candidates length == 1", len(out7.scored_candidates) == 1, f"got {len(out7.scored_candidates)}")

    # Also test top_k=2
    cfg7b = CriticConfig(top_k=2)
    critic7b = CriticAgent(config=cfg7b)
    out7b = critic7b.run(crit_in7)
    check("Case7b: top_k=2 → scored_candidates length == 2", len(out7b.scored_candidates) == 2, f"got {len(out7b.scored_candidates)}")


def run_rerun_hint_tests(outputs: dict[str, CritiqueOutput]) -> None:
    """Check rerun_hint across all outputs."""
    print(f"\n{'='*60}")
    print("  Rerun hint checks")
    print(f"{'='*60}")

    # Taboo case should have rerun_hint pointing to low-score dimensions
    taboo_output = outputs.get("d6-test-taboo-001")
    if taboo_output:
        check(
            "Taboo case: rerun_hint is non-empty",
            len(taboo_output.rerun_hint) > 0,
            f"hint={taboo_output.rerun_hint}",
        )
        # Every item in rerun_hint must be a valid dimension ID
        for dim in taboo_output.rerun_hint:
            check(
                f"rerun_hint '{dim}' is valid dimension",
                dim in DIMENSIONS,
            )
        # critical_interpretation should be in hint (score=0.0 due to taboo)
        check(
            "rerun_hint includes critical_interpretation",
            "critical_interpretation" in taboo_output.rerun_hint,
            f"hint={taboo_output.rerun_hint}",
        )

    # Normal cases: rerun_hint should be reasonable (can be empty if all scores are ok)
    for tid in ["d6-test-chinese-001", "d6-test-western-001"]:
        out = outputs.get(tid)
        if out:
            for dim in out.rerun_hint:
                check(
                    f"{tid}: rerun_hint '{dim}' is valid dimension",
                    dim in DIMENSIONS,
                )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D6 Critic Agent Validation")
    print("=" * 60)

    outputs: dict[str, CritiqueOutput] = {}
    for case in _CASES:
        output = run_case(case)
        outputs[case["task_id"]] = output

    run_rerun_hint_tests(outputs)
    run_d61_cases()

    print(f"\n{'='*60}")
    total = passed + failed
    print(f"  Results: {passed}/{total} checks passed, {failed} failed")
    if failed == 0:
        print("  ALL CHECKS PASSED")
    else:
        print("  SOME CHECKS FAILED")
    print("=" * 60)
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
