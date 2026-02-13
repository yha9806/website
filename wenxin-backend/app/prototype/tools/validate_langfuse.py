#!/usr/bin/env python3
"""Validation script for Langfuse observability integration.

Tests:
1. LangfuseObserver initializes without API keys (graceful degradation)
2. LangfuseObserver.on_event() is no-op when unavailable
3. Observer processes all event types without errors
4. Orchestrator has _langfuse attribute
5. run_sync traces events (mock mode, no Langfuse server)
6. Observer available property is correct
"""

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_ROOT))

PASS = 0
FAIL = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  \u2705 {name}")
    else:
        FAIL += 1
        msg = f"  \u274c {name}"
        if detail:
            msg += f" \u2014 {detail}"
        print(msg)


# =========================================================================
# 1. Graceful degradation without API keys
# =========================================================================
print("\n=== 1. LangfuseObserver Graceful Degradation ===")

import os
# Ensure no keys are set for this test
saved_pub = os.environ.pop("LANGFUSE_PUBLIC_KEY", None)
saved_sec = os.environ.pop("LANGFUSE_SECRET_KEY", None)

from app.prototype.observability.langfuse_observer import LangfuseObserver

observer = LangfuseObserver()
check("Observer created without error", True)
check("Observer.available is False (no keys)", observer.available is False)

# Restore if they existed
if saved_pub:
    os.environ["LANGFUSE_PUBLIC_KEY"] = saved_pub
if saved_sec:
    os.environ["LANGFUSE_SECRET_KEY"] = saved_sec

# =========================================================================
# 2. No-op when unavailable
# =========================================================================
print("\n=== 2. No-op When Unavailable ===")

from app.prototype.orchestrator.events import EventType, PipelineEvent

observer.start_trace("test-task", "test subject", "default")
check("start_trace no-op", True)

event = PipelineEvent(
    event_type=EventType.STAGE_STARTED,
    stage="scout",
    round_num=1,
    payload={},
    timestamp_ms=100,
)
observer.on_event(event)
check("on_event(STAGE_STARTED) no-op", True)

observer.flush()
check("flush no-op", True)

observer.shutdown()
check("shutdown no-op", True)

# =========================================================================
# 3. Process all event types
# =========================================================================
print("\n=== 3. All Event Types ===")

events = [
    PipelineEvent(EventType.STAGE_STARTED, "scout", 1, {}, 0),
    PipelineEvent(EventType.STAGE_COMPLETED, "scout", 1, {"latency_ms": 100}, 100),
    PipelineEvent(EventType.STAGE_STARTED, "draft", 1, {}, 200),
    PipelineEvent(EventType.STAGE_COMPLETED, "draft", 1, {
        "latency_ms": 500,
        "n_candidates": 4,
        "provider": "mock",
    }, 700),
    PipelineEvent(EventType.STAGE_STARTED, "critic", 1, {}, 800),
    PipelineEvent(EventType.STAGE_COMPLETED, "critic", 1, {
        "latency_ms": 300,
        "critique": {
            "scored_candidates": [{"weighted_total": 0.75}],
            "rerun_hint": [],
        },
    }, 1100),
    PipelineEvent(EventType.DECISION_MADE, "queen", 1, {
        "action": "accept",
        "reason": "threshold met",
    }, 1200),
    PipelineEvent(EventType.PIPELINE_COMPLETED, "", 1, {
        "final_decision": "accept",
        "total_rounds": 1,
        "total_latency_ms": 1200,
        "total_cost_usd": 0.0,
        "success": True,
    }, 1200),
    PipelineEvent(EventType.PIPELINE_FAILED, "", 1, {
        "error": "test error",
    }, 1200),
    PipelineEvent(EventType.HUMAN_REQUIRED, "queen", 1, {}, 1200),
    PipelineEvent(EventType.HUMAN_RECEIVED, "queen", 1, {}, 1200),
]

all_ok = True
for evt in events:
    try:
        observer.on_event(evt)
    except Exception as e:
        all_ok = False
        check(f"Event {evt.event_type.value} processing", False, str(e))

if all_ok:
    check("All event types processed without error", True)

# =========================================================================
# 4. Orchestrator integration
# =========================================================================
print("\n=== 4. Orchestrator Integration ===")

from app.prototype.orchestrator.orchestrator import PipelineOrchestrator

orch = PipelineOrchestrator()
check("Orchestrator has _langfuse attribute", hasattr(orch, "_langfuse"))
check("_langfuse is LangfuseObserver", isinstance(orch._langfuse, LangfuseObserver))

# =========================================================================
# 5. run_sync traces events (mock, no Langfuse server)
# =========================================================================
print("\n=== 5. run_sync with Langfuse Observer ===")

from app.prototype.pipeline.pipeline_types import PipelineInput

pi = PipelineInput(task_id="langfuse-test", subject="test", cultural_tradition="default")
output = orch.run_sync(pi)
check("run_sync completes with observer", output.success, f"error={output.error}")

# =========================================================================
# 6. Observer properties
# =========================================================================
print("\n=== 6. Observer Properties ===")

check("available is bool", isinstance(observer.available, bool))
check("_client is None when unavailable", observer._client is None)

# =========================================================================
# Summary
# =========================================================================
print(f"\n{'='*60}")
print(f"Langfuse Observability Validation: {PASS} passed, {FAIL} failed")
print(f"{'='*60}")

if FAIL > 0:
    sys.exit(1)
