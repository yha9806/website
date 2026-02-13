#!/usr/bin/env python3
"""Validate CriticLLM — Agent-ness checks for the hybrid rule+LLM critic.

Usage::

    cd wenxin-backend

    # No API key — 100% rule fallback (should match CriticAgent output)
    python3 app/prototype/tools/validate_critic_llm.py

    # With LLM — test Agent escalation + FC + metrics
    DEEPSEEK_API_KEY=... python3 app/prototype/tools/validate_critic_llm.py --with-llm

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

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
from app.prototype.agents.critic_llm import CriticLLM  # noqa: E402
from app.prototype.agents.critic_types import (  # noqa: E402
    CritiqueInput,
    CritiqueOutput,
)
from app.prototype.agents.draft_agent import DraftAgent  # noqa: E402
from app.prototype.agents.draft_config import DraftConfig  # noqa: E402
from app.prototype.agents.draft_types import DraftInput  # noqa: E402
from app.prototype.tools.scout_service import ScoutService  # noqa: E402

# ---------------------------------------------------------------------------
# Test infrastructure
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
            msg += f" -- {detail}"
        print(msg)


def _build_critique_input(
    task_id: str,
    subject: str,
    tradition: str,
    n_candidates: int = 4,
) -> CritiqueInput:
    """Build CritiqueInput via Scout + Draft."""
    scout = ScoutService()
    evidence = scout.gather_evidence(subject=subject, cultural_tradition=tradition)

    draft_config = DraftConfig(provider="mock", n_candidates=n_candidates, seed_base=42)
    draft_agent = DraftAgent(config=draft_config)
    draft_input = DraftInput(
        task_id=task_id,
        subject=subject,
        cultural_tradition=tradition,
        evidence=evidence.to_dict(),
        config=draft_config,
    )
    draft_output = draft_agent.run(draft_input)

    return CritiqueInput(
        task_id=task_id,
        subject=subject,
        cultural_tradition=tradition,
        evidence=evidence.to_dict(),
        candidates=[c.to_dict() for c in draft_output.candidates],
    )


# ---------------------------------------------------------------------------
# Test case 1: Chinese xieyi — structure matches CriticAgent
# ---------------------------------------------------------------------------

def test_case_1_structure() -> None:
    print(f"\n{'='*60}")
    print("  Case 1: Chinese xieyi — CritiqueOutput structure")
    print(f"{'='*60}")

    inp = _build_critique_input(
        "llm-test-chinese-001",
        "Dong Yuan landscape with hemp-fiber texture strokes",
        "chinese_xieyi",
    )

    # Run both CriticAgent and CriticLLM
    agent_out = CriticAgent().run(inp)
    llm_out = CriticLLM().run(inp)

    # Both should succeed
    check("CriticAgent success", agent_out.success)
    check("CriticLLM success", llm_out.success)

    # CritiqueOutput structure
    llm_dict = llm_out.to_dict()
    expected_keys = {
        "task_id", "scored_candidates", "best_candidate_id",
        "rerun_hint", "created_at", "latency_ms", "success", "error",
    }
    check(
        "CritiqueOutput.to_dict() has all keys",
        set(llm_dict.keys()) >= expected_keys,
        f"missing={expected_keys - set(llm_dict.keys())}",
    )

    # Every candidate has 5 dimension scores
    for sc in llm_out.scored_candidates:
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

    # Sorted descending
    totals = [sc.weighted_total for sc in llm_out.scored_candidates]
    check(
        "Candidates sorted descending by weighted_total",
        totals == sorted(totals, reverse=True),
        f"totals={totals}",
    )

    # At least one passes gate (normal case)
    check(
        "At least one candidate passes gate",
        any(sc.gate_passed for sc in llm_out.scored_candidates),
    )
    check("best_candidate_id is set", llm_out.best_candidate_id is not None)


# ---------------------------------------------------------------------------
# Test case 2: Taboo violation — should reject
# ---------------------------------------------------------------------------

def test_case_2_taboo() -> None:
    print(f"\n{'='*60}")
    print("  Case 2: Taboo violation — all candidates rejected")
    print(f"{'='*60}")

    inp = _build_critique_input(
        "llm-test-taboo-001",
        "primitive art tribal art savage exotic",
        "western_academic",
    )

    out = CriticLLM().run(inp)
    check("CriticLLM success", out.success)

    # All candidates should fail gate
    all_fail = all(not sc.gate_passed for sc in out.scored_candidates)
    check("ALL candidates fail gate (taboo)", all_fail)

    for sc in out.scored_candidates:
        check(
            f"{sc.candidate_id}: rejected_reasons non-empty",
            len(sc.rejected_reasons) > 0,
        )
        check(
            f"{sc.candidate_id}: risk_tags contains taboo_critical",
            "taboo_critical" in sc.risk_tags,
            f"tags={sc.risk_tags}",
        )


# ---------------------------------------------------------------------------
# Test case 3: Empty candidates — success=False
# ---------------------------------------------------------------------------

def test_case_3_empty() -> None:
    print(f"\n{'='*60}")
    print("  Case 3: Empty candidates — success=False")
    print(f"{'='*60}")

    empty_input = CritiqueInput(
        task_id="llm-test-empty-001",
        subject="empty test",
        cultural_tradition="default",
        evidence={"sample_matches": [], "terminology_hits": [], "taboo_violations": []},
        candidates=[],
    )

    out = CriticLLM().run(empty_input)
    check("success == False", out.success is False)
    check("error contains 'no candidates'", out.error is not None and "no candidates" in out.error)
    check("scored_candidates is empty", len(out.scored_candidates) == 0)
    check("best_candidate_id is None", out.best_candidate_id is None)


# ---------------------------------------------------------------------------
# Test case 4: No API key — 100% fallback to rules
# ---------------------------------------------------------------------------

def test_case_4_no_api_key() -> None:
    print(f"\n{'='*60}")
    print("  Case 4: No API key — 100% rule fallback")
    print(f"{'='*60}")

    inp = _build_critique_input(
        "llm-test-nokey-001",
        "Dong Yuan landscape",
        "chinese_xieyi",
        n_candidates=2,
    )

    # Instantiate and check key detection
    critic = CriticLLM()
    has_key = critic._has_any_api_key()

    if not has_key:
        # No key — should behave identically to CriticAgent
        llm_out = critic.run(inp)
        agent_out = CriticAgent().run(inp)

        check("Both succeed", llm_out.success and agent_out.success)

        # Scores should match exactly (no escalation without API key)
        for i, (llm_sc, agent_sc) in enumerate(
            zip(llm_out.scored_candidates, agent_out.scored_candidates)
        ):
            for llm_ds, agent_ds in zip(llm_sc.dimension_scores, agent_sc.dimension_scores):
                check(
                    f"Candidate {i} {llm_ds.dimension}: scores match (no escalation)",
                    abs(llm_ds.score - agent_ds.score) < 1e-6,
                    f"llm={llm_ds.score:.4f} agent={agent_ds.score:.4f}",
                )

        # Agent-ness metrics should show 0 escalations
        metrics = critic.get_agent_metrics()
        check("escalation_rate == 0", metrics["escalation_rate"] == 0.0)
        check("tool_calls == 0", metrics["tool_calls"] == 0)
    else:
        print("  [SKIP] API key is present — cannot test no-key scenario")


# ---------------------------------------------------------------------------
# Test case 5: Agent-ness metrics (requires API key)
# ---------------------------------------------------------------------------

def test_case_5_agent_metrics(with_llm: bool) -> None:
    print(f"\n{'='*60}")
    print("  Case 5: Agent-ness metrics (requires API key)")
    print(f"{'='*60}")

    if not with_llm:
        print("  [SKIP] --with-llm not specified")
        return

    inp = _build_critique_input(
        "llm-test-metrics-001",
        "Dong Yuan landscape with hemp-fiber texture strokes",
        "chinese_xieyi",
    )

    critic = CriticLLM(max_escalations=3, max_agent_steps=3)
    if not critic._has_any_api_key():
        print("  [SKIP] No API key available")
        return

    out = critic.run(inp)
    check("CriticLLM success with LLM", out.success)

    metrics = critic.get_agent_metrics()
    print(f"  Metrics: {metrics}")

    check(
        "total_escalations > 0",
        metrics["total_escalations"] > 0,
        f"got {metrics['total_escalations']}",
    )
    check(
        "tool_calls >= 2",
        metrics["tool_calls"] >= 2,
        f"got {metrics['tool_calls']}",
    )
    # re_plan_rate: fraction of escalations where Agent significantly changed score
    check(
        "re_plan_rate >= 0.0 (metric is populated)",
        metrics["re_plan_rate"] >= 0.0,
        f"got {metrics['re_plan_rate']}",
    )

    # Check that at least one dimension has an Agent-merged rationale
    has_merged = False
    for sc in out.scored_candidates:
        for ds in sc.dimension_scores:
            if "agent=" in ds.rationale:
                has_merged = True
                break
    check("At least one dimension has Agent-merged rationale", has_merged)


# ---------------------------------------------------------------------------
# Test case 6: Multiple candidates — sorting + top_k
# ---------------------------------------------------------------------------

def test_case_6_multi_candidate() -> None:
    print(f"\n{'='*60}")
    print("  Case 6: Multiple candidates — sorting + top_k")
    print(f"{'='*60}")

    inp = _build_critique_input(
        "llm-test-multi-001",
        "Caravaggio chiaroscuro painting",
        "western_academic",
        n_candidates=4,
    )

    # top_k=1
    critic1 = CriticLLM(config=CriticConfig(top_k=1))
    out1 = critic1.run(inp)
    check("top_k=1: scored_candidates length == 1", len(out1.scored_candidates) == 1)

    # top_k=2
    critic2 = CriticLLM(config=CriticConfig(top_k=2))
    out2 = critic2.run(inp)
    check("top_k=2: scored_candidates length == 2", len(out2.scored_candidates) == 2)

    # Descending sort
    totals2 = [sc.weighted_total for sc in out2.scored_candidates]
    check(
        "top_k=2: sorted descending",
        totals2 == sorted(totals2, reverse=True),
        f"totals={totals2}",
    )

    # Default top_k
    critic_def = CriticLLM()
    out_def = critic_def.run(inp)
    check(
        "default top_k: scored_candidates length == 1 (default)",
        len(out_def.scored_candidates) == 1,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    with_llm = "--with-llm" in sys.argv

    print("=" * 60)
    print("  CriticLLM Validation (Agent-ness)")
    print(f"  Mode: {'with LLM' if with_llm else 'no LLM (rule fallback only)'}")
    print("=" * 60)

    test_case_1_structure()
    test_case_2_taboo()
    test_case_3_empty()
    test_case_4_no_api_key()
    test_case_5_agent_metrics(with_llm)
    test_case_6_multi_candidate()

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
