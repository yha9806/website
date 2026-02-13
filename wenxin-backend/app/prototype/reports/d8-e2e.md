# D8 Report: End-to-End Pipeline (Scout → Draft → Critic → Queen)

**Date**: 2026-02-08
**Status**: PASSED

---

## Done

- [x] `pipeline/pipeline_types.py` — PipelineInput / StageResult / PipelineOutput with to_dict()
- [x] `pipeline/run_pipeline.py` — Full pipeline runner with multi-round Critic→Queen loop
- [x] `checkpoints/pipeline_checkpoint.py` — Per-stage checkpoint save/load + pipeline output
- [x] `tools/validate_pipeline_e2e.py` — 4 test cases, 35/35 checks passed

## Pipeline Execution Flow

```
1. Scout: gather_evidence(subject, tradition) → evidence
2. Draft: run(DraftInput) → candidates
3. Critic → Queen loop:
   a. Critic: score(candidates, evidence) → scored + rerun_hint
   b. Queen: decide(critique, plan_state) → action
   c. If action == "rerun": re-draft with new seeds → repeat from (a)
   d. If action in (accept, stop, downgrade): exit loop
4. Save pipeline output checkpoint
```

## Test Case Results

| Case | Scenario | Final Decision | Rounds | Checks |
|------|----------|---------------|--------|--------|
| 1 | chinese_xieyi normal | accept | 1 | 21/21 |
| 2 | Taboo triggers rerun | stop | 2 | 6/6 |
| 3 | Resume from critic | accept | 1 | 6/6 |
| 4 | Resume missing checkpoint | fail gracefully | 0 | 2/2 |

## Checkpoint Layout

```
checkpoints/pipeline/{task_id}/
├── stage_scout.json
├── stage_draft.json
├── stage_critic.json
├── stage_queen.json
└── pipeline_output.json
```

## Metrics

| Metric | Value |
|--------|-------|
| validate_pipeline_e2e.py checks | 35/35 PASSED |
| D7 regression (validate_queen.py) | 34/34 PASSED |
| D6.1 regression (validate_critic.py) | 66/66 PASSED |
| D5 regression (validate_draft.py) | 81/81 PASSED |
| D4 regression (validate_scout.py) | 31/31 PASSED |
| New files created | 4 |
| Lines of code (new) | ~320 |

## Blockers

None.

## Next (D9)

- Archivist Agent: evidence chain, critique card, params snapshot archival
