#!/usr/bin/env python3
"""CLI demo — run the full VULCA prototype pipeline from the command line.

Uses PipelineOrchestrator for unified execution (Archivist included).

Usage::

    cd wenxin-backend
    python -m app.prototype.ui.cli_demo \\
        --subject "Dong Yuan landscape" \\
        --tradition chinese_xieyi \\
        --output-dir ./output
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.critic_config import CriticConfig
from app.prototype.agents.draft_config import DraftConfig
from app.prototype.agents.queen_config import QueenConfig
from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
from app.prototype.pipeline.pipeline_types import PipelineInput


TRADITIONS = [
    "chinese_xieyi", "chinese_gongbi", "western_academic",
    "islamic_geometric", "watercolor", "african_traditional",
    "south_asian", "default",
]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="VULCA Prototype Pipeline — CLI Demo",
    )
    parser.add_argument("--subject", required=True, help="Artwork subject description")
    parser.add_argument(
        "--tradition", default="default", choices=TRADITIONS,
        help="Cultural tradition (default: default)",
    )
    parser.add_argument("--output-dir", default="./output", help="Output directory")
    parser.add_argument("--candidates", type=int, default=4, help="Number of candidates")
    parser.add_argument("--max-rounds", type=int, default=2, help="Max Queen rounds")
    parser.add_argument("--task-id", default=None, help="Custom task ID")
    args = parser.parse_args()

    task_id = args.task_id or f"cli-{int(time.time())}"
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n  VULCA Prototype Pipeline — CLI Demo")
    print(f"  Task ID: {task_id}")
    print(f"  Subject: {args.subject}")
    print(f"  Tradition: {args.tradition}")
    print(f"  Candidates: {args.candidates}")
    print(f"  Max rounds: {args.max_rounds}")
    print(f"{'─'*50}")

    d_cfg = DraftConfig(provider="mock", n_candidates=args.candidates, seed_base=42)
    cr_cfg = CriticConfig()
    q_cfg = QueenConfig(max_rounds=args.max_rounds)

    orchestrator = PipelineOrchestrator(
        draft_config=d_cfg,
        critic_config=cr_cfg,
        queen_config=q_cfg,
        enable_hitl=False,
        enable_archivist=True,
    )

    inp = PipelineInput(
        task_id=task_id,
        subject=args.subject,
        cultural_tradition=args.tradition,
    )

    print()
    t0 = time.monotonic()
    result = orchestrator.run_sync(inp)

    # Display stage results
    stage_idx = 0
    stage_names_seen: dict[str, int] = {}
    for s in result.stages:
        sn = s.stage
        stage_names_seen[sn] = stage_names_seen.get(sn, 0) + 1
        round_label = f" (round {stage_names_seen[sn]})" if stage_names_seen[sn] > 1 else ""
        status_icon = "✓" if s.status == "completed" else "⟳" if s.status == "skipped" else "✗"
        stage_idx += 1
        summary = ""
        if s.output_summary:
            summary = " — " + ", ".join(f"{k}={v}" for k, v in s.output_summary.items())
        print(f"  [{stage_idx}] {sn.capitalize()}{round_label}: {status_icon} ({s.latency_ms}ms){summary}")

    print(f"{'─'*50}")

    if result.success:
        print(f"  Result: {result.final_decision.upper()}")
        print(f"  Best candidate: {result.best_candidate_id or 'N/A'}")
        print(f"  Total rounds: {result.total_rounds}")
        print(f"  Total time: {result.total_latency_ms}ms")
    else:
        print(f"  FAILED: {result.error}")
        sys.exit(1)

    # Save pipeline output to output dir
    pipe_out_path = output_dir / "pipeline_output.json"
    pipe_out_path.write_text(
        json.dumps(result.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n  → {pipe_out_path}")

    # Copy Archivist artifacts to output dir if they exist
    import shutil
    archive_dir = Path(__file__).resolve().parent.parent / "checkpoints" / "archive"
    import re
    safe_tid = re.sub(r"[^A-Za-z0-9._-]+", "_", task_id).strip("._") or "task"
    archivist_dir = archive_dir / safe_tid
    if archivist_dir.exists():
        for artifact in ("evidence_chain.json", "critique_card.md", "params_snapshot.json"):
            src = archivist_dir / artifact
            if src.exists():
                shutil.copy2(src, output_dir / artifact)
                print(f"  → {output_dir / artifact}")

    print(f"\n  Done! Total elapsed: {int((time.monotonic() - t0) * 1000)}ms\n")


if __name__ == "__main__":
    main()
