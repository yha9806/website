#!/usr/bin/env python3
"""Batch benchmark runner — runs tasks from a JSON file and outputs statistics.

Usage::

    cd wenxin-backend
    python3 app/prototype/tools/run_benchmark.py [--tasks path/to/tasks.json]
    python3 app/prototype/tools/run_benchmark.py --provider together_flux --steps 4 --width 256 --height 256
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.critic_config import CriticConfig
from app.prototype.agents.draft_config import DraftConfig
from app.prototype.agents.queen_config import QueenConfig
from app.prototype.pipeline.pipeline_types import PipelineInput, PipelineOutput
from app.prototype.pipeline.run_pipeline import run_pipeline


def run_benchmark(
    tasks_path: str | Path,
    draft_config: DraftConfig | None = None,
    critic_config: CriticConfig | None = None,
    queen_config: QueenConfig | None = None,
) -> list[dict]:
    """Run all tasks from a JSON file and return per-task results."""
    tasks_path = Path(tasks_path)
    tasks = json.loads(tasks_path.read_text(encoding="utf-8"))

    d_cfg = draft_config or DraftConfig(provider="mock", n_candidates=4, seed_base=42)
    cr_cfg = critic_config or CriticConfig()
    q_cfg = queen_config or QueenConfig()

    results: list[dict] = []

    for task in tasks:
        inp = PipelineInput(
            task_id=task["task_id"],
            subject=task["subject"],
            cultural_tradition=task["cultural_tradition"],
        )
        out = run_pipeline(inp, d_cfg, cr_cfg, q_cfg)
        results.append(_summarize(out, task))

    return results


def _summarize(out: PipelineOutput, task: dict) -> dict:
    """Extract key metrics from a pipeline output."""
    # Extract provider info from draft stage output
    provider_type = "unknown"
    for stage in out.stages:
        if stage.stage == "draft" and stage.output_summary:
            model_ref = stage.output_summary.get("model_ref", "")
            if model_ref:
                provider_type = model_ref.split(":")[0] if ":" in model_ref else model_ref
                break

    return {
        "task_id": out.task_id,
        "subject": task["subject"],
        "tradition": task["cultural_tradition"],
        "success": out.success,
        "final_decision": out.final_decision,
        "best_candidate_id": out.best_candidate_id,
        "total_rounds": out.total_rounds,
        "total_latency_ms": out.total_latency_ms,
        "gate_passed": out.final_decision == "accept",
        "provider_type": provider_type,
    }


def compute_statistics(results: list[dict]) -> dict:
    """Compute aggregate statistics from benchmark results."""
    n = len(results)
    if n == 0:
        return {"n_tasks": 0}

    passed = sum(1 for r in results if r["gate_passed"])
    latencies = [r["total_latency_ms"] for r in results]
    rounds = [r["total_rounds"] for r in results]
    decisions = {}
    for r in results:
        d = r["final_decision"]
        decisions[d] = decisions.get(d, 0) + 1

    # P95 latency
    sorted_latencies = sorted(latencies)
    p95_idx = min(int(0.95 * n), n - 1)

    # Cost model: mock=$0.00/image, together=$0.003/image
    cost_per_image = {"mock": 0.00, "together": 0.003, "unknown": 0.00}
    costs = []
    for r in results:
        pt = r.get("provider_type", "mock")
        # Normalize provider type (e.g. "mock-v1" -> "mock")
        pt_base = pt.split("-")[0] if "-" in pt else pt
        cpi = cost_per_image.get(pt_base, 0.003)
        n_images = r["total_rounds"] * 4  # 4 candidates per round
        costs.append(n_images * cpi)

    # Provider distribution
    provider_counts: dict[str, int] = {}
    for r in results:
        pt = r.get("provider_type", "unknown")
        provider_counts[pt] = provider_counts.get(pt, 0) + 1

    # Per-task draft latency (from total latency as proxy)
    draft_latencies = [r["total_latency_ms"] for r in results]

    stats: dict = {
        "n_tasks": n,
        "pass_rate": round(passed / n, 4),
        "passed": passed,
        "failed": n - passed,
        "decisions": decisions,
        "avg_latency_ms": round(sum(latencies) / n, 1),
        "p95_latency_ms": sorted_latencies[p95_idx],
        "max_latency_ms": max(latencies),
        "min_latency_ms": min(latencies),
        "avg_rounds": round(sum(rounds) / n, 2),
        "avg_cost_usd": round(sum(costs) / n, 4),
        "total_cost_usd": round(sum(costs), 4),
        "provider_distribution": provider_counts,
        "total_api_calls": sum(r["total_rounds"] for r in results) * 4,  # 4 candidates per round
    }
    return stats


def print_report(results: list[dict], stats: dict) -> None:
    """Print a formatted benchmark report."""
    print(f"\n{'='*70}")
    print(f"  Benchmark Report: {stats['n_tasks']} tasks")
    print(f"{'='*70}")

    # Per-task results
    print(f"\n  {'Task ID':<20} {'Tradition':<22} {'Decision':<12} {'Rounds':<8} {'ms':<8}")
    print(f"  {'─'*20} {'─'*22} {'─'*12} {'─'*8} {'─'*8}")
    for r in results:
        print(f"  {r['task_id']:<20} {r['tradition']:<22} {r['final_decision']:<12} {r['total_rounds']:<8} {r['total_latency_ms']:<8}")

    # Statistics
    print(f"\n{'─'*70}")
    print(f"  Pass rate: {stats['pass_rate']*100:.1f}% ({stats['passed']}/{stats['n_tasks']})")
    print(f"  Decisions: {stats['decisions']}")
    print(f"  Avg latency: {stats['avg_latency_ms']}ms")
    print(f"  P95 latency: {stats['p95_latency_ms']}ms")
    print(f"  Avg rounds: {stats['avg_rounds']}")
    print(f"  Avg cost: ${stats['avg_cost_usd']}")
    print(f"  Total cost: ${stats['total_cost_usd']}")
    if "provider_distribution" in stats:
        print(f"  Providers: {stats['provider_distribution']}")
    if "total_api_calls" in stats:
        print(f"  Total API calls: {stats['total_api_calls']}")
    print(f"{'='*70}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="VULCA Benchmark Runner")
    default_tasks = Path(__file__).resolve().parent.parent / "data" / "benchmarks" / "tasks-10.json"
    parser.add_argument("--tasks", default=str(default_tasks), help="Path to tasks JSON")
    parser.add_argument(
        "--provider", default="mock", choices=["mock", "together_flux"],
        help="Image generation provider (default: mock)",
    )
    parser.add_argument("--api-key", default="", help="Provider API key (fallback: $TOGETHER_API_KEY)")
    parser.add_argument("--width", type=int, default=512, help="Image width (default: 512)")
    parser.add_argument("--height", type=int, default=512, help="Image height (default: 512)")
    parser.add_argument("--steps", type=int, default=4, help="Inference steps (default: 4)")
    parser.add_argument("--n-candidates", type=int, default=4, help="Candidates per round (default: 4)")
    parser.add_argument("--output", default="", help="Path to save JSON results")
    args = parser.parse_args()

    # Resolve API key
    api_key = args.api_key or os.environ.get("TOGETHER_API_KEY", "")
    if args.provider == "together_flux" and not api_key:
        print("ERROR: together_flux requires --api-key or $TOGETHER_API_KEY", file=sys.stderr)
        sys.exit(1)

    d_cfg = DraftConfig(
        provider=args.provider,
        api_key=api_key,
        width=args.width,
        height=args.height,
        steps=args.steps,
        n_candidates=args.n_candidates,
        seed_base=42,
    )

    results = run_benchmark(args.tasks, draft_config=d_cfg)
    stats = compute_statistics(results)
    print_report(results, stats)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(
                {"provider": args.provider, "stats": stats, "results": results},
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        print(f"  Results saved to: {output_path}")


if __name__ == "__main__":
    main()
