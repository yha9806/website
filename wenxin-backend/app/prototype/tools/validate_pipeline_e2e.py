#!/usr/bin/env python3
"""D8 validation — End-to-end pipeline (Scout → Draft → Critic → Queen).

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_pipeline_e2e.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.critic_config import CriticConfig  # noqa: E402
from app.prototype.agents.draft_config import DraftConfig  # noqa: E402
from app.prototype.agents.queen_config import QueenConfig  # noqa: E402
from app.prototype.checkpoints.pipeline_checkpoint import (  # noqa: E402
    load_pipeline_output,
    load_pipeline_stage,
)
from app.prototype.pipeline.pipeline_types import PipelineInput  # noqa: E402
from app.prototype.pipeline.run_pipeline import run_pipeline  # noqa: E402

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


# ---------------------------------------------------------------------------
# Case 1: Normal full pipeline (chinese_xieyi)
# ---------------------------------------------------------------------------

def test_case_1_normal() -> None:
    print(f"\n{'='*60}")
    print("  Case 1: Normal full pipeline (chinese_xieyi)")
    print(f"{'='*60}")

    inp = PipelineInput(
        task_id="d8-e2e-chinese-001",
        subject="Dong Yuan landscape with hemp-fiber texture strokes",
        cultural_tradition="chinese_xieyi",
    )
    out = run_pipeline(inp)

    check("success == True", out.success)
    check("final_decision == 'accept'", out.final_decision == "accept", f"got '{out.final_decision}'")
    check("best_candidate_id is set", out.best_candidate_id is not None)
    check("total_rounds >= 1", out.total_rounds >= 1)
    check("total_latency_ms > 0", out.total_latency_ms > 0)

    # Check stages
    stage_names = [s.stage for s in out.stages]
    check("stages include scout", "scout" in stage_names)
    check("stages include draft", "draft" in stage_names)
    check("stages include critic", "critic" in stage_names)
    check("stages include queen", "queen" in stage_names)

    # All stages completed
    for s in out.stages:
        check(f"stage {s.stage} (round): status completed", s.status == "completed")

    # to_dict()
    od = out.to_dict()
    expected_keys = {"task_id", "stages", "final_decision", "best_candidate_id",
                     "total_latency_ms", "total_rounds", "success", "error"}
    check("PipelineOutput.to_dict() has all keys", set(od.keys()) >= expected_keys)

    # JSON round-trip
    check("PipelineOutput JSON round-trips", json.loads(json.dumps(od)) == od)

    # Checkpoint persistence
    saved = load_pipeline_output("d8-e2e-chinese-001")
    check("Pipeline output checkpoint saved", saved is not None)
    if saved:
        check("Checkpoint task_id matches", saved.get("task_id") == "d8-e2e-chinese-001")

    # Stage checkpoints
    scout_ckpt = load_pipeline_stage("d8-e2e-chinese-001", "scout")
    check("Scout stage checkpoint exists", scout_ckpt is not None)
    draft_ckpt = load_pipeline_stage("d8-e2e-chinese-001", "draft")
    check("Draft stage checkpoint exists", draft_ckpt is not None)
    critic_ckpt = load_pipeline_stage("d8-e2e-chinese-001", "critic")
    check("Critic stage checkpoint exists", critic_ckpt is not None)
    queen_ckpt = load_pipeline_stage("d8-e2e-chinese-001", "queen")
    check("Queen stage checkpoint exists", queen_ckpt is not None)


# ---------------------------------------------------------------------------
# Case 2: Taboo triggers rerun
# ---------------------------------------------------------------------------

def test_case_2_taboo_rerun() -> None:
    print(f"\n{'='*60}")
    print("  Case 2: Taboo case triggers rerun cycle")
    print(f"{'='*60}")

    inp = PipelineInput(
        task_id="d8-e2e-taboo-001",
        subject="primitive art tribal art savage exotic",
        cultural_tradition="western_academic",
    )
    # Queen will see low scores, attempt rerun, then stop
    out = run_pipeline(
        inp,
        queen_config=QueenConfig(max_rounds=2, accept_threshold=0.6),
    )

    check("success == True", out.success)
    check("total_rounds >= 1", out.total_rounds >= 1)
    check("final_decision in (stop, accept, downgrade)",
          out.final_decision in ("stop", "accept", "downgrade"),
          f"got '{out.final_decision}'")

    # Should have multiple critic/queen stages if rerun happened
    critic_stages = [s for s in out.stages if s.stage == "critic"]
    queen_stages = [s for s in out.stages if s.stage == "queen"]
    check(f"critic stages count >= 1", len(critic_stages) >= 1)
    check(f"queen stages count >= 1", len(queen_stages) >= 1)

    # Pipeline output saved
    saved = load_pipeline_output("d8-e2e-taboo-001")
    check("Taboo pipeline output checkpoint saved", saved is not None)


# ---------------------------------------------------------------------------
# Case 3: Resume from critic stage
# ---------------------------------------------------------------------------

def test_case_3_resume() -> None:
    print(f"\n{'='*60}")
    print("  Case 3: Resume from critic stage")
    print(f"{'='*60}")

    # First, ensure Case 1 ran so we have checkpoints
    # We'll reuse the d8-e2e-chinese-001 task_id which has scout+draft checkpoints

    inp = PipelineInput(
        task_id="d8-e2e-chinese-001",
        subject="Dong Yuan landscape with hemp-fiber texture strokes",
        cultural_tradition="chinese_xieyi",
        resume_from="critic",
    )
    out = run_pipeline(inp)

    check("success == True", out.success)

    # Scout and Draft should be skipped
    scout_stage = [s for s in out.stages if s.stage == "scout"][0]
    draft_stage = [s for s in out.stages if s.stage == "draft"][0]
    check("scout status == 'skipped'", scout_stage.status == "skipped")
    check("draft status == 'skipped'", draft_stage.status == "skipped")

    # Critic and Queen should be completed
    critic_stages = [s for s in out.stages if s.stage == "critic"]
    queen_stages = [s for s in out.stages if s.stage == "queen"]
    check("critic ran (completed)", any(s.status == "completed" for s in critic_stages))
    check("queen ran (completed)", any(s.status == "completed" for s in queen_stages))

    check("final_decision set", out.final_decision in ("accept", "stop", "downgrade"))


# ---------------------------------------------------------------------------
# Case 4: Resume from missing checkpoint → fail gracefully
# ---------------------------------------------------------------------------

def test_case_4_resume_missing() -> None:
    print(f"\n{'='*60}")
    print("  Case 4: Resume from missing checkpoint → fail gracefully")
    print(f"{'='*60}")

    import uuid
    unique_task = f"d8-nonexistent-{uuid.uuid4().hex[:8]}"
    inp = PipelineInput(
        task_id=unique_task,
        subject="test",
        cultural_tradition="default",
        resume_from="critic",
    )
    out = run_pipeline(inp)

    check("success == False", out.success is False)
    check("error mentions checkpoint", out.error is not None and "checkpoint" in out.error)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D8 Pipeline E2E Validation")
    print("=" * 60)

    test_case_1_normal()
    test_case_2_taboo_rerun()
    test_case_3_resume()
    test_case_4_resume_missing()

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
