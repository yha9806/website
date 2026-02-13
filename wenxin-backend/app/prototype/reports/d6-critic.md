# D6 Report: Critic Agent — L1-L5 Scoring & Gate

**Date**: 2026-02-08
**Status**: PASSED

---

## Done

- [x] `critic_types.py` — CritiqueInput / DimensionScore / CandidateScore / CritiqueOutput with to_dict()
- [x] `critic_config.py` — CriticConfig with L1-L5 weights (L3=0.25 highest), pass_threshold=0.4, min_dimension_score=0.2
- [x] `critic_rules.py` — Rule-based L1-L5 scorer using evidence signals (terminology, samples, taboo)
- [x] `critic_risk.py` — RiskTagger with 5 tag types (taboo_critical/high, low_evidence, no_terminology, style_mismatch)
- [x] `critic_agent.py` — CriticAgent orchestrating score→risk→gate→sort→rerun_hint→checkpoint
- [x] `critic_checkpoint.py` — Checkpoint persistence (checkpoints/critique/{task_id}/run.json)
- [x] `validate_critic.py` — 4 test cases, 98/98 checks passed

## Metrics

| Metric | Value |
|--------|-------|
| validate_critic.py checks | 98/98 PASSED |
| D5 regression (validate_draft.py) | 81/81 PASSED |
| D4 regression (validate_scout.py) | 31/31 PASSED |
| D2 regression (validate_schema.py) | ALL PASSED |
| D3 regression (validate_resources.py) | ALL PASSED |
| post-plan-validate.sh | exit 0 |
| New files created | 7 |
| Lines of code (new) | ~420 |

### Test Case Results

| Case | Subject | Tradition | gate_passed | weighted_total | Risk Tags |
|------|---------|-----------|-------------|----------------|-----------|
| 1 | Dong Yuan landscape | chinese_xieyi | TRUE | ~0.72 | none |
| 2 | Caravaggio chiaroscuro | western_academic | TRUE | ~0.73 | none |
| 3 | Cross-cultural analysis | default | TRUE | ~0.72 | none |
| 4 | primitive/tribal/savage | western_academic | **FALSE** | ~0.36 | taboo_critical, taboo_high |

### Gate Logic Summary

- **Soft gate**: weighted_total < 0.4 → reject
- **Hard gate**: any dimension score < 0.2 → reject
- **Critical risk**: taboo_critical tag → reject
- Case 4 triggered all three: L4 score=0.0 (taboo_critical), weighted_total < 0.4, and critical risk tag

### Rerun Hint

- Case 4: `rerun_hint = ["critical_interpretation"]` — L4 scored 0.0 due to critical taboo violation

## Post-Review Fixes (D6.1)

**Date**: 2026-02-08

### Fixes Applied

1. **`critic_config.py` — weights auto-normalization**: Added `__post_init__` that detects non-normalized weights (sum != 1.0) and auto-normalizes them. Prevents weighted_total from exceeding [0,1].

2. **`critic_agent.py` — empty candidates guard**: When `candidates=[]`, immediately returns `CritiqueOutput(success=False, error="no candidates provided")` with checkpoint saved.

3. **`critic_agent.py` — top_k truncation**: After sorting, `scored = scored[:cfg.top_k]` ensures output respects the configured top_k limit.

### New Test Cases

| Case | Scenario | Expected | Result |
|------|----------|----------|--------|
| 5 | `candidates=[]` | `success=False`, checkpoint saved | PASS |
| 6 | Non-normalized weights (sum=20) | Auto-normalize, weighted_total in [0,1] | PASS |
| 7 | `top_k=1` with 4 candidates | `scored_candidates` length == 1 | PASS |
| 7b | `top_k=2` with 4 candidates | `scored_candidates` length == 2 | PASS |

### Updated Metrics

| Metric | Value |
|--------|-------|
| validate_critic.py checks | 66/66 PASSED |
| D5 regression | 81/81 PASSED |
| D4 regression | 31/31 PASSED |

## Blockers

None.

## Next (D7)

- Queen Agent: budget guardrails, round control, early stop decisions
- Integration with Critic output for accept/rerun/stop/downgrade decisions
