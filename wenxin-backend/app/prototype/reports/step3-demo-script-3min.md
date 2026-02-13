# Step 3 Demo Script (3 Minutes)

**Date**: 2026-02-09  
**Goal**: Show that Step 3 is end-to-end connected: UI/API/Orchestrator/Agents/Artifacts.

## 0. Preconditions (Before Meeting)
- Backend and frontend are running.
- Use real URL if online; fallback to local:
  - Frontend: `http://localhost:5173/prototype`
  - Backend: `http://localhost:8001`
- Optional fallback demo (if web route unavailable): `http://localhost:7860` (Gradio).

## 1. 3-Minute Timeline

### 0:00-0:30 | Scope and Value
- Say: “This is no longer a standalone script. One orchestrator now serves API, CLI, Gradio, benchmark, and web.”
- Show `step3-go-no-go.md` summary table (`114/114` all pass).

### 0:30-1:30 | Live Run
- Open `/prototype`.
- Enter a normal prompt and start run.
- Point out stage events in sequence:
  - `Scout -> Draft -> Critic -> Queen`
- Explain: Queen can `accept/rerun/stop`, and rerun loops are now first-class.

### 1:30-2:10 | HITL + Multi-round
- Run one taboo or hard sample.
- Show decision becoming `stop` or rerun path.
- If enabled, submit one HITL action (`lock_dimensions` or `rerun`) and continue.

### 2:10-2:40 | Traceability
- Show generated artifacts for same task id:
  - `stage_scout.json`
  - `stage_draft.json`
  - `stage_critic.json`
  - `stage_queen.json`
  - `pipeline_output.json`
- Show archivist outputs: `evidence_chain.json`, `critique_card.md`, `params_snapshot.json`.

### 2:40-3:00 | Close
- Say: “Step 3 complete means unified execution core, deterministic artifacts, and test-backed operational readiness.”
- Mention next action: controlled online gray rollout.

## 2. Key Talking Points
- Unified core removed entry drift (CLI/Gradio/API/frontend aligned).
- Resume and multi-round are productionized, not demo-only.
- Validation gates are green across backend + frontend + demo API.

## 3. Risk Notes (If Asked)
- Real provider availability depends on upstream API/network.
- HITL UX can still be iterated without changing orchestration core.
