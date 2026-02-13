#!/usr/bin/env python3
"""A/B blind test: one-shot vs agent pipeline.

For each task:
- Arm A (one-shot): Pick candidate[0] without scoring — simulates single-shot generation
- Arm B (agent): Full orchestrator pipeline — picks best candidate, applies taboo gate

Both arms use the same orchestrator for the agent arm.

Usage::

    cd wenxin-backend
    TOGETHER_API_KEY=... python3 app/prototype/tools/run_ab_test.py \
        --provider together_flux --tasks .../tasks-20.json \
        --output reports/ab-test.json
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
from app.prototype.orchestrator.events import EventType
from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
from app.prototype.pipeline.pipeline_types import PipelineInput


def run_ab_test(
    tasks_path: str | Path,
    draft_config: DraftConfig | None = None,
) -> list[dict]:
    """Run A/B blind test for each task using the unified orchestrator."""
    tasks_path = Path(tasks_path)
    tasks = json.loads(tasks_path.read_text(encoding="utf-8"))

    d_cfg = draft_config or DraftConfig(provider="mock", n_candidates=4, seed_base=42)

    results: list[dict] = []

    for task in tasks:
        task_id = task["task_id"]
        subject = task["subject"]
        tradition = task["cultural_tradition"]

        # --- Agent arm: use orchestrator for full pipeline (single round) ---
        q_cfg = QueenConfig(max_rounds=1)  # Single round for fair comparison
        orchestrator = PipelineOrchestrator(
            draft_config=d_cfg,
            critic_config=CriticConfig(),
            queen_config=q_cfg,
            enable_hitl=False,
            enable_archivist=False,
        )

        inp = PipelineInput(
            task_id=f"ab-{task_id}",
            subject=subject,
            cultural_tradition=tradition,
        )

        # Collect events to extract scores
        agent_decision = "stop"
        agent_id: str | None = None
        agent_score = 0.0
        agent_gate = False
        oneshot_id: str | None = None
        oneshot_score = 0.0
        oneshot_gate = False
        has_taboo = False
        n_candidates = 0
        scored_candidates: list[dict] = []

        for event in orchestrator.run_stream(inp):
            et = event.event_type
            payload = event.payload

            if et == EventType.STAGE_COMPLETED and event.stage == "scout":
                evidence = payload.get("evidence", {})
                has_taboo = len(evidence.get("taboo_violations", [])) > 0

            elif et == EventType.STAGE_COMPLETED and event.stage == "draft":
                candidates = payload.get("candidates", [])
                n_candidates = len(candidates)
                if candidates:
                    oneshot_id = candidates[0].get("candidate_id", "unknown")

            elif et == EventType.STAGE_COMPLETED and event.stage == "critic":
                critique = payload.get("critique", {})
                scored_candidates = critique.get("scored_candidates", [])
                agent_id = critique.get("best_candidate_id")

            elif et == EventType.DECISION_MADE:
                agent_decision = payload.get("action", "stop")

        # Extract scores from scored candidates
        for sc in scored_candidates:
            cid = sc.get("candidate_id", "")
            if cid == oneshot_id:
                oneshot_score = sc.get("weighted_total", 0.0)
                oneshot_gate = sc.get("gate_passed", False)
            if cid == agent_id:
                agent_score = sc.get("weighted_total", 0.0)
                agent_gate = sc.get("gate_passed", False)

        # --- Taboo safety check ---
        oneshot_taboo_safe = not has_taboo
        agent_would_stop = agent_id is None
        agent_taboo_safe = agent_would_stop if has_taboo else True

        # --- Winner ---
        if agent_score > oneshot_score:
            winner = "agent"
        elif oneshot_score > agent_score:
            winner = "oneshot"
        else:
            winner = "tie"

        if has_taboo and agent_would_stop:
            winner = "agent"
            safety_override = True
        else:
            safety_override = False

        results.append({
            "task_id": task_id,
            "subject": subject,
            "tradition": tradition,
            "has_taboo": has_taboo,
            "n_candidates": n_candidates,
            "oneshot": {
                "candidate_id": oneshot_id,
                "weighted_total": round(oneshot_score, 4),
                "gate_passed": oneshot_gate,
                "taboo_safe": oneshot_taboo_safe,
            },
            "agent": {
                "candidate_id": agent_id,
                "weighted_total": round(agent_score, 4),
                "gate_passed": agent_gate,
                "decision": agent_decision,
                "taboo_safe": agent_taboo_safe,
            },
            "winner": winner,
            "safety_override": safety_override,
            "score_delta": round(agent_score - oneshot_score, 4),
        })

    return results


def compute_ab_stats(results: list[dict]) -> dict:
    """Compute A/B test summary statistics."""
    n = len(results)
    if n == 0:
        return {"n_tasks": 0}

    agent_wins = sum(1 for r in results if r["winner"] == "agent")
    oneshot_wins = sum(1 for r in results if r["winner"] == "oneshot")
    ties = sum(1 for r in results if r["winner"] == "tie")
    safety_overrides = sum(1 for r in results if r.get("safety_override", False))

    agent_scores = [r["agent"]["weighted_total"] for r in results]
    oneshot_scores = [r["oneshot"]["weighted_total"] for r in results]
    deltas = [r["score_delta"] for r in results]

    taboo_tasks = [r for r in results if r["has_taboo"]]
    agent_taboo_caught = sum(1 for r in taboo_tasks if r["agent"]["taboo_safe"])
    oneshot_taboo_caught = sum(1 for r in taboo_tasks if r["oneshot"]["taboo_safe"])

    return {
        "n_tasks": n,
        "agent_wins": agent_wins,
        "oneshot_wins": oneshot_wins,
        "ties": ties,
        "agent_win_rate": round(agent_wins / n, 4),
        "safety_overrides": safety_overrides,
        "avg_agent_score": round(sum(agent_scores) / n, 4),
        "avg_oneshot_score": round(sum(oneshot_scores) / n, 4),
        "avg_score_delta": round(sum(deltas) / n, 4),
        "max_score_delta": round(max(deltas), 4) if deltas else 0,
        "min_score_delta": round(min(deltas), 4) if deltas else 0,
        "taboo_tasks": len(taboo_tasks),
        "agent_taboo_caught": agent_taboo_caught,
        "oneshot_taboo_caught": oneshot_taboo_caught,
    }


def print_ab_report(results: list[dict], stats: dict) -> None:
    """Print formatted A/B test report."""
    print(f"\n{'='*78}")
    print(f"  A/B Blind Test: one-shot vs agent pipeline ({stats['n_tasks']} tasks)")
    print(f"{'='*78}")

    print(f"\n  {'Task':<15} {'One-shot':<12} {'Agent':<12} {'Delta':<10} {'Winner':<10} {'Taboo'}")
    print(f"  {'─'*15} {'─'*12} {'─'*12} {'─'*10} {'─'*10} {'─'*6}")
    for r in results:
        taboo_mark = "!" if r["has_taboo"] else ""
        safety = " (SAFE)" if r.get("safety_override") else ""
        print(
            f"  {r['task_id']:<15} "
            f"{r['oneshot']['weighted_total']:>8.4f}    "
            f"{r['agent']['weighted_total']:>8.4f}    "
            f"{r['score_delta']:>+8.4f}  "
            f"{r['winner']:<10}"
            f"{taboo_mark}{safety}"
        )

    print(f"\n{'─'*78}")
    print(f"  Agent wins:   {stats['agent_wins']}/{stats['n_tasks']} ({stats['agent_win_rate']*100:.1f}%)")
    print(f"  One-shot wins: {stats['oneshot_wins']}/{stats['n_tasks']}")
    print(f"  Ties:         {stats['ties']}/{stats['n_tasks']}")
    print(f"  Safety overrides: {stats['safety_overrides']}")
    print(f"\n  Avg score — Agent: {stats['avg_agent_score']:.4f}  One-shot: {stats['avg_oneshot_score']:.4f}")
    print(f"  Avg delta:  {stats['avg_score_delta']:+.4f}")
    print(f"  Delta range: [{stats['min_score_delta']:+.4f}, {stats['max_score_delta']:+.4f}]")
    if stats['taboo_tasks'] > 0:
        print(f"\n  Taboo safety ({stats['taboo_tasks']} tasks):")
        print(f"    Agent caught:   {stats['agent_taboo_caught']}/{stats['taboo_tasks']}")
        print(f"    One-shot caught: {stats['oneshot_taboo_caught']}/{stats['taboo_tasks']} (NO taboo detection)")
    print(f"{'='*78}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="VULCA A/B Blind Test: one-shot vs agent")
    default_tasks = Path(__file__).resolve().parent.parent / "data" / "benchmarks" / "tasks-20.json"
    parser.add_argument("--tasks", default=str(default_tasks), help="Path to tasks JSON")
    parser.add_argument("--provider", default="mock", choices=["mock", "together_flux"])
    parser.add_argument("--api-key", default="")
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=512)
    parser.add_argument("--steps", type=int, default=4)
    parser.add_argument("--n-candidates", type=int, default=4)
    parser.add_argument("--output", default="", help="Path to save JSON results")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("TOGETHER_API_KEY", "")
    if args.provider == "together_flux" and not api_key:
        print("ERROR: together_flux requires --api-key or $TOGETHER_API_KEY", file=sys.stderr)
        sys.exit(1)

    d_cfg = DraftConfig(
        provider=args.provider, api_key=api_key,
        width=args.width, height=args.height,
        steps=args.steps, n_candidates=args.n_candidates, seed_base=42,
    )

    results = run_ab_test(args.tasks, draft_config=d_cfg)
    stats = compute_ab_stats(results)
    print_ab_report(results, stats)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(
                {"test": "ab_oneshot_vs_agent", "provider": args.provider,
                 "stats": stats, "results": results},
                indent=2, ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        print(f"  Results saved to: {output_path}")


if __name__ == "__main__":
    main()
