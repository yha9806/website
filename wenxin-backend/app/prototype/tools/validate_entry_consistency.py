#!/usr/bin/env python3
"""Validate that all entry points produce consistent results for the same input.

Compares: run_pipeline(), PipelineOrchestrator.run_sync(), and stream mode.
All should produce the same final_decision and total_rounds.
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.prototype.agents.draft_config import DraftConfig
from app.prototype.agents.queen_config import QueenConfig
from app.prototype.orchestrator.events import EventType
from app.prototype.orchestrator.orchestrator import PipelineOrchestrator
from app.prototype.pipeline.pipeline_types import PipelineInput
from app.prototype.pipeline.run_pipeline import run_pipeline

passed = 0
failed = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✓ {name}")
    else:
        failed += 1
        print(f"  ✗ {name} — {detail}")


def test_consistency(subject: str, tradition: str):
    """Compare all entry points for the same input."""
    d_cfg = DraftConfig(provider="mock", n_candidates=4, seed_base=42)
    q_cfg = QueenConfig(max_rounds=2)

    print(f"\n  Subject: '{subject}', Tradition: '{tradition}'")

    # 1. run_pipeline (backward compat wrapper)
    inp1 = PipelineInput(task_id="consist-rp-1", subject=subject, cultural_tradition=tradition)
    r1 = run_pipeline(inp1, draft_config=d_cfg, queen_config=q_cfg)

    # 2. Orchestrator sync mode
    orch2 = PipelineOrchestrator(draft_config=d_cfg, queen_config=q_cfg, enable_archivist=False)
    inp2 = PipelineInput(task_id="consist-sync-1", subject=subject, cultural_tradition=tradition)
    r2 = orch2.run_sync(inp2)

    # 3. Orchestrator stream mode (consume to PipelineOutput)
    orch3 = PipelineOrchestrator(draft_config=d_cfg, queen_config=q_cfg, enable_archivist=False)
    inp3 = PipelineInput(task_id="consist-stream-1", subject=subject, cultural_tradition=tradition)
    stream_decision = None
    stream_rounds = None
    for event in orch3.run_stream(inp3):
        if event.event_type == EventType.PIPELINE_COMPLETED:
            stream_decision = event.payload.get("final_decision")
            stream_rounds = event.payload.get("total_rounds")

    check("all succeed", r1.success and r2.success and stream_decision is not None,
          f"r1={r1.success}, r2={r2.success}, stream={stream_decision}")

    check("decisions match (rp vs sync)",
          r1.final_decision == r2.final_decision,
          f"rp={r1.final_decision}, sync={r2.final_decision}")

    check("decisions match (sync vs stream)",
          r2.final_decision == stream_decision,
          f"sync={r2.final_decision}, stream={stream_decision}")

    check("rounds match (rp vs sync)",
          r1.total_rounds == r2.total_rounds,
          f"rp={r1.total_rounds}, sync={r2.total_rounds}")

    check("rounds match (sync vs stream)",
          r2.total_rounds == stream_rounds,
          f"sync={r2.total_rounds}, stream={stream_rounds}")

    # Check stage count consistency (excluding archivist)
    r1_core = [s for s in r1.stages if s.stage != "archivist"]
    r2_core = [s for s in r2.stages if s.stage != "archivist"]
    check("stage count match",
          len(r1_core) == len(r2_core),
          f"rp={len(r1_core)}, sync={len(r2_core)}")


if __name__ == "__main__":
    print("=" * 60)
    print("  Entry Consistency Validation")
    print("=" * 60)

    test_consistency("Dong Yuan landscape", "chinese_xieyi")
    test_consistency("Islamic geometric pattern", "islamic_geometric")
    test_consistency("African mask carving", "african_traditional")

    print(f"\n{'=' * 60}")
    print(f"  Results: {passed} passed, {failed} failed")
    print(f"{'=' * 60}")

    sys.exit(1 if failed > 0 else 0)
