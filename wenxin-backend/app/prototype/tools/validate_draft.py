#!/usr/bin/env python3
"""D5 validation — Draft Agent end-to-end checks.

Usage::

    cd wenxin-backend
    ./venv/bin/python app/prototype/tools/validate_draft.py

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

from app.prototype.agents.draft_agent import DraftAgent  # noqa: E402
from app.prototype.agents.draft_config import DraftConfig  # noqa: E402
from app.prototype.agents.draft_types import (  # noqa: E402
    DraftInput,
    DraftOutput,
)
from app.prototype.checkpoints.draft_checkpoint import load_draft_checkpoint  # noqa: E402
from app.prototype.tools.scout_service import ScoutService  # noqa: E402

# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

_CASES = [
    {
        "name": "Case 1: Chinese xieyi landscape",
        "task_id": "d5-test-chinese-001",
        "subject": "Dong Yuan landscape with hemp-fiber texture strokes",
        "tradition": "chinese_xieyi",
        "expect_prompt_contains": ["ink wash"],
    },
    {
        "name": "Case 2: Western academic chiaroscuro",
        "task_id": "d5-test-western-001",
        "subject": "Caravaggio's dramatic chiaroscuro scene",
        "tradition": "western_academic",
        "expect_prompt_contains": ["oil painting"],
    },
    {
        "name": "Case 3: Default cross-cultural",
        "task_id": "d5-test-default-001",
        "subject": "Cross-cultural composition analysis",
        "tradition": "default",
        "expect_prompt_contains": ["fine art"],
    },
]

_REQUIRED_CANDIDATE_KEYS = {
    "candidate_id",
    "prompt",
    "negative_prompt",
    "seed",
    "width",
    "height",
    "steps",
    "sampler",
    "model_ref",
    "image_path",
}
_CHECKPOINT_ROOT = (Path(__file__).resolve().parent.parent / "checkpoints" / "draft").resolve()

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


def run_case(case: dict) -> None:
    print(f"\n{'='*60}")
    print(f"  {case['name']}")
    print(f"{'='*60}")

    scout = ScoutService()
    evidence = scout.gather_evidence(
        subject=case["subject"],
        cultural_tradition=case["tradition"],
    )

    config = DraftConfig(provider="mock", n_candidates=4, seed_base=42)
    agent = DraftAgent(config=config)

    draft_input = DraftInput(
        task_id=case["task_id"],
        subject=case["subject"],
        cultural_tradition=case["tradition"],
        evidence=evidence.to_dict(),
        config=config,
    )

    output = agent.run(draft_input)

    # 1. Candidate count
    check(
        "Candidate count == 4",
        len(output.candidates) == 4,
        f"got {len(output.candidates)}",
    )

    # 2. DraftOutput.to_dict() structure
    od = output.to_dict()
    check(
        "DraftOutput.to_dict() has all keys",
        set(od.keys()) >= {"task_id", "candidates", "created_at", "latency_ms", "model_ref", "success", "error"},
    )

    # 3. Success flag
    check("DraftOutput.success == True", output.success)

    # 4. Per-candidate checks
    for i, cand in enumerate(output.candidates):
        cd = cand.to_dict()

        # Field completeness
        check(
            f"Candidate {i} has all 10 keys",
            set(cd.keys()) == _REQUIRED_CANDIDATE_KEYS,
            f"missing={_REQUIRED_CANDIDATE_KEYS - set(cd.keys())}, extra={set(cd.keys()) - _REQUIRED_CANDIDATE_KEYS}",
        )

        # File exists and > 0 bytes
        p = Path(cand.image_path)
        check(
            f"Candidate {i} image file exists",
            p.exists() and p.stat().st_size > 0,
            f"path={cand.image_path}",
        )

        # Candidate path must stay under checkpoint root
        check(
            f"Candidate {i} path stays under checkpoints/draft",
            str(p.resolve()).startswith(str(_CHECKPOINT_ROOT)),
            f"resolved={p.resolve()}",
        )

        # Seed determinism
        check(
            f"Candidate {i} seed == {42 + i}",
            cand.seed == 42 + i,
            f"got {cand.seed}",
        )

    # 5. Prompt cultural alignment
    for keyword in case["expect_prompt_contains"]:
        found = any(keyword.lower() in c.prompt.lower() for c in output.candidates)
        check(
            f"Prompt contains '{keyword}'",
            found,
        )

    # 6. Checkpoint existence
    ckpt = load_draft_checkpoint(case["task_id"])
    check(
        "Checkpoint run.json exists and loads",
        ckpt is not None,
    )
    if ckpt is not None:
        check(
            "Checkpoint JSON has required keys",
            set(ckpt.keys()) >= {"task_id", "created_at", "candidates", "latency_ms", "success"},
        )

    # 7. Seed reproducibility: re-run same input, compare file bytes
    output2 = agent.run(draft_input)
    if output.candidates and output2.candidates:
        p1 = Path(output.candidates[0].image_path)
        p2 = Path(output2.candidates[0].image_path)
        if p1.exists() and p2.exists():
            check(
                "Same seed → identical file content",
                p1.read_bytes() == p2.read_bytes(),
            )
        else:
            check("Same seed → identical file content", False, "file(s) missing")
    else:
        check("Same seed → identical file content", False, "no candidates")


def run_guardrail_tests() -> None:
    print(f"\n{'='*60}")
    print("  Guardrail tests")
    print(f"{'='*60}")

    # n_candidates=0 → clamped to 1
    cfg0 = DraftConfig(provider="mock", n_candidates=0, seed_base=100)
    check(
        "n_candidates=0 → clamped to 1",
        cfg0.n_candidates == 1,
        f"got {cfg0.n_candidates}",
    )

    # n_candidates=10 → clamped to max_candidates (6)
    cfg10 = DraftConfig(provider="mock", n_candidates=10, seed_base=100)
    check(
        "n_candidates=10 → clamped to 6",
        cfg10.n_candidates == 6,
        f"got {cfg10.n_candidates}",
    )

    # max_candidates < 1 -> clamped to 1
    cfg_max = DraftConfig(provider="mock", n_candidates=3, max_candidates=0)
    check(
        "max_candidates=0 → clamped to 1",
        cfg_max.max_candidates == 1,
        f"got {cfg_max.max_candidates}",
    )
    check(
        "max_candidates=0 keeps n_candidates in range",
        cfg_max.n_candidates == 1,
        f"got {cfg_max.n_candidates}",
    )

    # steps > 50 → clamped
    cfg_steps = DraftConfig(provider="mock", steps=100)
    check(
        "steps=100 → clamped to 50",
        cfg_steps.steps == 50,
        f"got {cfg_steps.steps}",
    )

    # width not multiple of 64 → rounded up
    cfg_w = DraftConfig(provider="mock", width=500, height=300)
    check(
        "width=500 → rounded to 512",
        cfg_w.width == 512,
        f"got {cfg_w.width}",
    )
    check(
        "height=300 → rounded to 320",
        cfg_w.height == 320,
        f"got {cfg_w.height}",
    )

    # max_retries < 0 -> clamped to 0
    cfg_retry = DraftConfig(provider="mock", max_retries=-1)
    check(
        "max_retries=-1 → clamped to 0",
        cfg_retry.max_retries == 0,
        f"got {cfg_retry.max_retries}",
    )


def run_config_and_path_tests() -> None:
    print(f"\n{'='*60}")
    print("  Config precedence + path safety tests")
    print(f"{'='*60}")

    scout = ScoutService()
    evidence = scout.gather_evidence(
        subject="Config override probe",
        cultural_tradition="default",
    ).to_dict()

    # Agent default config should be overridable by per-input config
    agent_default = DraftConfig(provider="mock", n_candidates=2, seed_base=1)
    input_cfg = DraftConfig(provider="mock", n_candidates=5, seed_base=100)
    agent = DraftAgent(config=agent_default)
    output = agent.run(
        DraftInput(
            task_id="d5-test-config-override-001",
            subject="Config override probe",
            cultural_tradition="default",
            evidence=evidence,
            config=input_cfg,
        )
    )
    check(
        "DraftInput.config overrides default n_candidates",
        len(output.candidates) == 5,
        f"got {len(output.candidates)}",
    )
    if output.candidates:
        check(
            "DraftInput.config overrides default seed_base",
            output.candidates[0].seed == 100,
            f"got {output.candidates[0].seed}",
        )
    else:
        check("DraftInput.config overrides default seed_base", False, "no candidates")

    # Path traversal in task_id should be neutralized
    traversal_task = "../../../../tmp/d5_escape_probe"
    out2 = agent.run(
        DraftInput(
            task_id=traversal_task,
            subject="Path safety probe",
            cultural_tradition="default",
            evidence=evidence,
            config=DraftConfig(provider="mock", n_candidates=1, seed_base=200),
        )
    )
    if out2.candidates:
        p = Path(out2.candidates[0].image_path).resolve()
        check(
            "task_id traversal blocked (image path contained)",
            str(p).startswith(str(_CHECKPOINT_ROOT)),
            f"resolved={p}",
        )
    else:
        check("task_id traversal blocked (image path contained)", False, "no candidates")

    ckpt = load_draft_checkpoint(traversal_task)
    check(
        "task_id traversal blocked (checkpoint still loadable)",
        ckpt is not None and ckpt.get("task_id") == traversal_task,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D5 Draft Agent Validation")
    print("=" * 60)

    for case in _CASES:
        run_case(case)

    run_guardrail_tests()
    run_config_and_path_tests()

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
