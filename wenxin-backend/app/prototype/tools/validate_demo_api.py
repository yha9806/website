#!/usr/bin/env python3
"""D11 validation — CLI demo minimal E2E test.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_demo_api.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

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
# Case 1: CLI demo produces output files
# ---------------------------------------------------------------------------

def test_case_1_cli_output() -> None:
    print(f"\n{'='*60}")
    print("  Case 1: CLI demo produces output files")
    print(f"{'='*60}")

    output_dir = _PROJECT_ROOT / "app" / "prototype" / "checkpoints" / "_demo_test"
    if output_dir.exists():
        shutil.rmtree(output_dir)

    result = subprocess.run(
        [
            sys.executable, "-m", "app.prototype.ui.cli_demo",
            "--subject", "Dong Yuan landscape",
            "--tradition", "chinese_xieyi",
            "--output-dir", str(output_dir),
            "--task-id", "d11-demo-test-001",
        ],
        cwd=str(_PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )

    check("CLI exit code == 0", result.returncode == 0, f"stderr: {result.stderr[:200]}")

    # Check output contains expected text
    check("stdout mentions VULCA", "VULCA" in result.stdout)
    check("stdout mentions ACCEPT or STOP", "ACCEPT" in result.stdout or "STOP" in result.stdout)

    # Check output files
    check("evidence_chain.json exists", (output_dir / "evidence_chain.json").exists())
    check("critique_card.md exists", (output_dir / "critique_card.md").exists())
    check("params_snapshot.json exists", (output_dir / "params_snapshot.json").exists())
    check("pipeline_output.json exists", (output_dir / "pipeline_output.json").exists())

    # Validate pipeline_output.json
    if (output_dir / "pipeline_output.json").exists():
        data = json.loads((output_dir / "pipeline_output.json").read_text(encoding="utf-8"))
        check("pipeline_output has task_id", data.get("task_id") == "d11-demo-test-001")
        check("pipeline_output has success", data.get("success") is True)

    # Validate critique_card.md
    if (output_dir / "critique_card.md").exists():
        card = (output_dir / "critique_card.md").read_text(encoding="utf-8")
        check("critique_card has title", "# Critique Card:" in card)
        check("critique_card has L1-L5", "Dimension" in card)

    # Cleanup
    if output_dir.exists():
        shutil.rmtree(output_dir)


# ---------------------------------------------------------------------------
# Case 2: CLI demo with different tradition
# ---------------------------------------------------------------------------

def test_case_2_different_tradition() -> None:
    print(f"\n{'='*60}")
    print("  Case 2: CLI demo with western_academic tradition")
    print(f"{'='*60}")

    output_dir = _PROJECT_ROOT / "app" / "prototype" / "checkpoints" / "_demo_test2"
    if output_dir.exists():
        shutil.rmtree(output_dir)

    result = subprocess.run(
        [
            sys.executable, "-m", "app.prototype.ui.cli_demo",
            "--subject", "Caravaggio dramatic chiaroscuro",
            "--tradition", "western_academic",
            "--output-dir", str(output_dir),
            "--candidates", "2",
            "--max-rounds", "1",
            "--task-id", "d11-demo-test-002",
        ],
        cwd=str(_PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )

    check("CLI exit code == 0", result.returncode == 0, f"stderr: {result.stderr[:200]}")
    check("output files created", (output_dir / "pipeline_output.json").exists())

    if output_dir.exists():
        shutil.rmtree(output_dir)


# ---------------------------------------------------------------------------
# Case 3: Gradio module importable (no launch)
# ---------------------------------------------------------------------------

def test_case_3_gradio_importable() -> None:
    print(f"\n{'='*60}")
    print("  Case 3: Gradio demo module importable (generator API)")
    print(f"{'='*60}")

    from app.prototype.ui.gradio_demo import run_pipeline_stepwise

    # Consume all yields from the generator (mock provider = instant)
    last_result = None
    yield_count = 0
    for result in run_pipeline_stepwise(
        subject="Test subject",
        tradition="default",
        provider="mock",
        n_candidates=2,
        max_rounds=1,
    ):
        last_result = result
        yield_count += 1

    check("generator yielded at least 1 result", yield_count > 0)
    check("generator yielded multiple stages", yield_count >= 4, f"got {yield_count}")

    if last_result:
        progress_md, gallery, scout_md, critic_md, queen_md = last_result
        check("progress log non-empty", len(progress_md) > 0)
        check("progress mentions Result", "Result:" in progress_md)
        check("scout evidence non-empty", len(scout_md) > 0)
        check("critic scoring non-empty", len(critic_md) > 0)
        check("queen decision non-empty", len(queen_md) > 0)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D11 Demo API Validation")
    print("=" * 60)

    test_case_1_cli_output()
    test_case_2_different_tradition()
    test_case_3_gradio_importable()

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
