#!/usr/bin/env python3
"""D12 validation — 10-sample benchmark regression.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/validate_regression.py

Exit code 0 = ALL CHECKS PASSED, 1 = failures detected.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.tools.run_benchmark import compute_statistics, run_benchmark  # noqa: E402

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


def main() -> None:
    global passed, failed

    print("=" * 60)
    print("  D12 Benchmark Regression (10 tasks)")
    print("=" * 60)

    tasks_path = Path(__file__).resolve().parent.parent / "data" / "benchmarks" / "tasks-10.json"
    check("tasks-10.json exists", tasks_path.exists())

    tasks = json.loads(tasks_path.read_text(encoding="utf-8"))
    check("tasks-10.json has 10 entries", len(tasks) == 10)

    # Check tradition coverage
    traditions = {t["cultural_tradition"] for t in tasks}
    expected_traditions = {
        "chinese_xieyi", "chinese_gongbi", "western_academic",
        "islamic_geometric", "african_traditional", "south_asian",
        "watercolor", "default",
    }
    check("covers all 8 traditions", traditions >= expected_traditions,
          f"missing: {expected_traditions - traditions}")

    # Run benchmark
    print(f"\n  Running 10 tasks...")
    results = run_benchmark(tasks_path)
    stats = compute_statistics(results)

    check("all 10 tasks ran", stats["n_tasks"] == 10)
    check("all tasks completed (no errors)", all(r["success"] for r in results))

    # Pass rate (at least 70% expected — taboo case may fail)
    check(f"pass rate >= 70%: got {stats['pass_rate']*100:.1f}%", stats["pass_rate"] >= 0.7)

    # Taboo case (bench-010) should not pass
    taboo_result = [r for r in results if r["task_id"] == "bench-010"]
    if taboo_result:
        check("bench-010 (taboo) decision != accept", taboo_result[0]["final_decision"] != "accept",
              f"got {taboo_result[0]['final_decision']}")

    # Latency checks
    check(f"avg latency > 0: got {stats['avg_latency_ms']}ms", stats["avg_latency_ms"] > 0)
    check(f"max latency < 10000ms", stats["max_latency_ms"] < 10000)

    # Cost checks
    check(f"avg cost <= $0.10: got ${stats['avg_cost_usd']}", stats["avg_cost_usd"] <= 0.10)

    # Decision distribution
    check("decisions dict non-empty", len(stats["decisions"]) > 0)

    # Provider type assertions
    provider_types = {r.get("provider_type", "unknown") for r in results}
    check("provider_type field present", all("provider_type" in r for r in results))
    check("provider_distribution in stats", "provider_distribution" in stats)

    # Per-tradition checks
    print(f"\n  Per-tradition results:")
    tradition_results: dict[str, list[dict]] = {}
    for r in results:
        t = r["tradition"]
        tradition_results.setdefault(t, []).append(r)

    for tradition, t_results in sorted(tradition_results.items()):
        t_passed = sum(1 for r in t_results if r["gate_passed"])
        t_total = len(t_results)
        status = "✓" if t_passed == t_total or (tradition == "western_academic" and t_passed >= 1) else "✗"
        print(f"    {tradition}: {t_passed}/{t_total} passed {status}")

    # Statistics summary
    print(f"\n  Statistics:")
    print(f"    Pass rate: {stats['pass_rate']*100:.1f}%")
    print(f"    Avg latency: {stats['avg_latency_ms']}ms")
    print(f"    Avg rounds: {stats['avg_rounds']}")
    print(f"    Avg cost: ${stats['avg_cost_usd']}")
    print(f"    Decisions: {stats['decisions']}")

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
