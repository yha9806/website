# D7 Report: Queen Agent — Budget Guardrails & Decision Logic

**Date**: 2026-02-08
**Status**: PASSED
**Gate A**: ACHIEVED (4/5 agents can run independently: Scout, Draft, Critic, Queen)

---

## Done

- [x] `queen_types.py` — BudgetState / PlanState / QueenDecision / QueenOutput with to_dict()
- [x] `queen_config.py` — QueenConfig with budget limits, round caps, thresholds, downgrade policy
- [x] `queen_agent.py` — 8-priority decision logic: early_stop → over_rounds → over_budget → downgrade → threshold_accept → rerun_hint → insufficient_improvement → default_rerun
- [x] `validate_queen.py` — 8 test cases, 34/34 checks passed

## Decision Logic (Priority Order)

| # | Condition | Action |
|---|-----------|--------|
| 1 | gate_passed AND score >= early_stop_threshold (0.8) | ACCEPT |
| 2 | rounds_used >= max_rounds | STOP |
| 3 | total_cost >= max_cost_usd | STOP |
| 4 | total_cost >= max_cost * downgrade_at_cost_pct | DOWNGRADE |
| 5 | gate_passed AND score >= accept_threshold (0.6) | ACCEPT |
| 6 | has rerun_hint AND rounds < max | RERUN |
| 7 | improvement < min_improvement | STOP |
| 8 | default | RERUN |

## Test Case Results

| Case | Scenario | Expected | Actual | Checks |
|------|----------|----------|--------|--------|
| 1 | High score 0.85 | accept (early stop) | accept | 6/6 |
| 2 | Medium score 0.65 | accept (threshold) | accept | 3/3 |
| 3 | Low score + rerun_hint | rerun | rerun | 4/4 |
| 4 | Over budget | stop | stop | 3/3 |
| 5 | Over rounds | stop | stop | 4/4 |
| 6 | Cost >= 80% limit | downgrade | downgrade | 3/3 |
| 7 | Data contracts | all keys present | all keys | 6/6 |
| 8 | History tracking | stop (insufficient improvement) | stop | 5/5 |

## Metrics

| Metric | Value |
|--------|-------|
| validate_queen.py checks | 34/34 PASSED |
| D6.1 regression (validate_critic.py) | 66/66 PASSED |
| D5 regression (validate_draft.py) | 81/81 PASSED |
| D4 regression (validate_scout.py) | 31/31 PASSED |
| New files created | 4 |
| Lines of code (new) | ~310 |

## Gate A Status

- [x] Scout — standalone ✓
- [x] Draft — standalone ✓
- [x] Critic — standalone ✓
- [x] Queen — standalone ✓
- [ ] Archivist — D9

**4/5 agents can run independently. Budget guardrails verified.**

## Blockers

None.

## Next (D8)

- Pipeline orchestration: Scout → Draft → Critic → Queen end-to-end
- Checkpoint recovery from any stage
- Unified run summary with per-stage latency
