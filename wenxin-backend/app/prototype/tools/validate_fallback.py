#!/usr/bin/env python3
"""D10 validation — Fallback chain and fault injection.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_fallback.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.draft_provider import (  # noqa: E402
    AllProvidersFailedError,
    FallbackProvider,
    FaultInjectProvider,
    MockProvider,
)
from app.prototype.pipeline.fallback_chain import build_fallback_provider  # noqa: E402

# ---------------------------------------------------------------------------
passed = 0
failed = 0
_TMP_DIR = Path(__file__).resolve().parent.parent / "checkpoints" / "_fallback_test"


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


def _gen_args(output_name: str) -> dict:
    """Common generate() arguments."""
    _TMP_DIR.mkdir(parents=True, exist_ok=True)
    return {
        "prompt": "test prompt",
        "negative_prompt": "",
        "seed": 42,
        "width": 64,
        "height": 64,
        "steps": 10,
        "sampler": "euler_a",
        "output_path": str(_TMP_DIR / output_name),
    }


# ---------------------------------------------------------------------------
# Case 1: Primary provider 429 × 2 → fallback to mock
# ---------------------------------------------------------------------------

def test_case_1_rate_limit_fallback() -> None:
    print(f"\n{'='*60}")
    print("  Case 1: Rate limit (429) → fallback to mock")
    print(f"{'='*60}")

    faulty = FaultInjectProvider(fault_type="rate_limit", fail_count=0)  # always fail
    mock = MockProvider()
    fb = FallbackProvider(providers=[faulty, mock], max_retries_per_provider=2)

    result = fb.generate(**_gen_args("case1.png"))
    check("generate succeeded", Path(result).exists())

    log = fb.route_log
    faulty_entries = [e for e in log if e["provider"].startswith("fault-inject")]
    mock_entries = [e for e in log if e["provider"] == "mock-v1"]
    check("faulty provider retried 2 times", len(faulty_entries) == 2)
    check("mock provider succeeded", len(mock_entries) == 1 and mock_entries[0]["status"] == "success")


# ---------------------------------------------------------------------------
# Case 2: Primary + backup timeout → fallback to mock
# ---------------------------------------------------------------------------

def test_case_2_timeout_double_fallback() -> None:
    print(f"\n{'='*60}")
    print("  Case 2: Timeout on primary + backup → fallback to mock")
    print(f"{'='*60}")

    primary = FaultInjectProvider(fault_type="timeout", fail_count=0)
    backup = FaultInjectProvider(fault_type="connection", fail_count=0)
    mock = MockProvider()
    fb = FallbackProvider(providers=[primary, backup, mock], max_retries_per_provider=1)

    result = fb.generate(**_gen_args("case2.png"))
    check("generate succeeded via mock", Path(result).exists())

    log = fb.route_log
    check("3 log entries total", len(log) == 3)
    check("last entry is mock success", log[-1]["provider"] == "mock-v1" and log[-1]["status"] == "success")


# ---------------------------------------------------------------------------
# Case 3: All providers down → AllProvidersFailedError
# ---------------------------------------------------------------------------

def test_case_3_all_fail() -> None:
    print(f"\n{'='*60}")
    print("  Case 3: All providers fail → AllProvidersFailedError")
    print(f"{'='*60}")

    p1 = FaultInjectProvider(fault_type="timeout", fail_count=0)
    p2 = FaultInjectProvider(fault_type="connection", fail_count=0)
    fb = FallbackProvider(providers=[p1, p2], max_retries_per_provider=2)

    caught = False
    try:
        fb.generate(**_gen_args("case3.png"))
    except AllProvidersFailedError as exc:
        caught = True
        check("error message mentions providers", "All providers failed" in str(exc))

    check("AllProvidersFailedError raised", caught)

    log = fb.route_log
    check("total attempts = 4 (2 providers × 2 retries)", len(log) == 4)


# ---------------------------------------------------------------------------
# Case 4: Intermittent failure (fail once, then succeed)
# ---------------------------------------------------------------------------

def test_case_4_intermittent() -> None:
    print(f"\n{'='*60}")
    print("  Case 4: Intermittent failure → retry succeeds")
    print(f"{'='*60}")

    # Fail 1 time, then succeed
    faulty = FaultInjectProvider(fault_type="timeout", fail_count=1)
    fb = FallbackProvider(providers=[faulty], max_retries_per_provider=3)

    result = fb.generate(**_gen_args("case4.png"))
    check("generate succeeded after retry", Path(result).exists())

    log = fb.route_log
    check("first attempt failed", "failed" in log[0]["status"])
    check("second attempt succeeded", log[1]["status"] == "success")


# ---------------------------------------------------------------------------
# Case 5: FaultInjectProvider standalone
# ---------------------------------------------------------------------------

def test_case_5_fault_inject_standalone() -> None:
    print(f"\n{'='*60}")
    print("  Case 5: FaultInjectProvider standalone checks")
    print(f"{'='*60}")

    # Timeout
    fi = FaultInjectProvider(fault_type="timeout", fail_count=0)
    check("model_ref contains fault type", "timeout" in fi.model_ref)

    caught_timeout = False
    try:
        fi.generate(**_gen_args("case5a.png"))
    except TimeoutError:
        caught_timeout = True
    check("TimeoutError raised", caught_timeout)

    # Connection
    fi2 = FaultInjectProvider(fault_type="connection", fail_count=0)
    caught_conn = False
    try:
        fi2.generate(**_gen_args("case5b.png"))
    except ConnectionError:
        caught_conn = True
    check("ConnectionError raised", caught_conn)


# ---------------------------------------------------------------------------
# Case 6: build_fallback_provider factory
# ---------------------------------------------------------------------------

def test_case_6_factory() -> None:
    print(f"\n{'='*60}")
    print("  Case 6: build_fallback_provider factory")
    print(f"{'='*60}")

    fb = build_fallback_provider(["mock"], max_retries=1)
    result = fb.generate(**_gen_args("case6.png"))
    check("factory-built provider generates", Path(result).exists())
    check("model_ref includes mock", "mock" in fb.model_ref)

    # Unknown provider name is skipped, mock still works
    fb2 = build_fallback_provider(["nonexistent", "mock"])
    result2 = fb2.generate(**_gen_args("case6b.png"))
    check("unknown provider skipped, mock works", Path(result2).exists())

    # Empty list still adds mock as fallback
    fb3 = build_fallback_provider([])
    result3 = fb3.generate(**_gen_args("case6c.png"))
    check("empty list still has mock fallback", Path(result3).exists())


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D10 Fallback Chain Validation")
    print("=" * 60)

    test_case_1_rate_limit_fallback()
    test_case_2_timeout_double_fallback()
    test_case_3_all_fail()
    test_case_4_intermittent()
    test_case_5_fault_inject_standalone()
    test_case_6_factory()

    # Cleanup
    import shutil
    if _TMP_DIR.exists():
        shutil.rmtree(_TMP_DIR)

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
