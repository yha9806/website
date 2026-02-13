# Step 3: Integration Baseline — Architecture & Boundaries

**Date**: 2026-02-09

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                    │
│  PrototypePage → usePrototypePipeline (SSE) → Components │
└──────────────┬───────────────────────┬──────────────────┘
               │ POST /runs           │ GET /events (SSE)
               ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer (FastAPI)                      │
│  api/routes.py → PipelineOrchestrator → run_stream()     │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              PipelineOrchestrator                         │
│  ┌──────┐  ┌──────┐  ┌────────┐  ┌───────┐  ┌────────┐ │
│  │Scout │→ │Draft │→ │Critic  │→ │Queen  │→ │Archiv. │ │
│  └──────┘  └──────┘  └────────┘  └───┬───┘  └────────┘ │
│                                      │                   │
│                              ┌───────▼────────┐         │
│                              │ HITL (optional) │         │
│                              │ wait/submit     │         │
│                              └────────────────┘         │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│              Checkpoint Layer                             │
│  checkpoints/pipeline/{task_id}/stage_*.json             │
│  checkpoints/pipeline/runs_index.json                    │
│  checkpoints/archive/{task_id}/*.json, *.md              │
└─────────────────────────────────────────────────────────┘
```

---

## Module Boundaries

### Orchestrator (`orchestrator/`)
- **Owns**: Pipeline execution flow, stage sequencing, HITL synchronization
- **Does NOT own**: Individual agent logic, image generation, scoring algorithms
- **Interface**: `run_sync(PipelineInput) → PipelineOutput`, `run_stream(PipelineInput) → Iterator[PipelineEvent]`

### API (`api/`)
- **Owns**: HTTP routing, request validation, SSE serialization, rate limiting
- **Does NOT own**: Pipeline execution (delegates to orchestrator)
- **Interface**: REST endpoints + SSE stream

### Agents (`agents/`)
- **Owns**: Individual stage logic (Scout, Draft, Critic, Queen, Archivist)
- **Does NOT own**: Execution ordering, HITL flow
- **Interface**: Each agent has `.run(input) → output`

### Checkpoints (`checkpoints/`)
- **Owns**: Persistence, resume support, runs index
- **Does NOT own**: Execution logic
- **Interface**: `save_pipeline_stage()`, `load_pipeline_stage()`, `update_runs_index()`

### Frontend (`pages/prototype/`, `components/prototype/`, `hooks/`)
- **Owns**: UI rendering, SSE consumption, user interaction
- **Does NOT own**: Backend logic
- **Interface**: SSE events → React state → UI components

---

## Data Flow

### Normal Run (no HITL)
```
POST /runs {subject, tradition}
  → orchestrator.run_stream()
    → STAGE_STARTED(scout) → STAGE_COMPLETED(scout)
    → STAGE_STARTED(draft) → STAGE_COMPLETED(draft)
    → STAGE_STARTED(critic) → STAGE_COMPLETED(critic)
    → STAGE_STARTED(queen) → DECISION_MADE(queen)
    → STAGE_STARTED(archivist) → STAGE_COMPLETED(archivist)
    → PIPELINE_COMPLETED
```

### HITL Run
```
...same as above until...
    → DECISION_MADE(queen, action=rerun)
    → HUMAN_REQUIRED(queen)
      ← POST /runs/{id}/action {action: "approve"}
    → HUMAN_RECEIVED(queen)
    → PIPELINE_COMPLETED
```

### Resume Run
```
POST /runs {task_id, resume_from: "critic"}
  → load checkpoint(scout) → skip
  → load checkpoint(draft) → skip
  → STAGE_STARTED(critic) → ... normal from here
```

---

## File Inventory

### New Files Created (Step 3)

| File | Lines | Purpose |
|------|-------|---------|
| `orchestrator/__init__.py` | 5 | Package exports |
| `orchestrator/events.py` | 40 | PipelineEvent, EventType |
| `orchestrator/run_state.py` | 55 | RunState, RunStatus, HumanAction |
| `orchestrator/orchestrator.py` | 560 | Core execution engine |
| `api/__init__.py` | 20 | Lazy import for FastAPI |
| `api/schemas.py` | 80 | Pydantic models |
| `api/routes.py` | 180 | FastAPI router (4 endpoints) |
| `tools/validate_orchestrator.py` | 218 | 28 unit tests |
| `tools/validate_entry_consistency.py` | 104 | Cross-entry consistency |
| `hooks/usePrototypePipeline.ts` | 200 | SSE React hook |
| `pages/prototype/PrototypePage.tsx` | 200 | Main prototype page |
| `components/prototype/*.tsx` | 500 | 5 UI components |

### Modified Files

| File | Change |
|------|--------|
| `pipeline/run_pipeline.py` | Rewritten as thin orchestrator wrapper |
| `agents/queen_types.py` | Added HITL fields to PlanState |
| `ui/gradio_demo.py` | Consumes orchestrator.run_stream() |
| `ui/cli_demo.py` | Uses orchestrator.run_sync() |
| `tools/run_ab_test.py` | Uses orchestrator.run_stream() |
| `checkpoints/pipeline_checkpoint.py` | Added runs_index functions |
| `app/main.py` | Registered prototype API router |
| `App.tsx` | Added /prototype route |

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| SSE connection drop | Medium | Frontend reconnects on error; last event ID tracking planned |
| HITL timeout (300s) | Low | Auto-proceeds with Queen decision; configurable |
| Concurrent runs on same task_id | Medium | Idempotency key prevents duplicate creation |
| Cost overrun | Low | Hard gate at $0.50/run in orchestrator |
| Checkpoint corruption | Low | JSON write is atomic; stale checkpoints safe to overwrite |
