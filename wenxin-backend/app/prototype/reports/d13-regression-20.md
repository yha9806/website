# D13 Report: 20-Sample Regression + Threshold Sweep

**Date**: 2026-02-08
**Status**: PASSED

---

## Done

- [x] `data/benchmarks/tasks-20.json` — 20 fixed tasks (10 original + 10 new edge cases)
- [x] `tools/run_threshold_sweep.py` — One-at-a-time parameter sweep (15 configurations)
- [x] `reports/d13-sweep-results.json` — Full sweep data

## 20-Sample Benchmark Results

| Metric | Value |
|--------|-------|
| Total tasks | 20 |
| Pass rate | 90.0% (18/20) |
| Correctly rejected (taboo) | 2/2 |
| Avg latency | 436ms |
| Avg simulated cost | $0.022 |
| Avg rounds | 1.1 |

### Tradition Coverage (20 tasks)

| Tradition | Tasks | Passed |
|-----------|-------|--------|
| chinese_xieyi | 3 | 3/3 |
| chinese_gongbi | 2 | 2/2 |
| western_academic | 4 | 3/4 (1 taboo) |
| islamic_geometric | 3 | 2/3 (1 taboo) |
| african_traditional | 2 | 2/2 |
| south_asian | 2 | 2/2 |
| watercolor | 2 | 2/2 |
| default | 2 | 2/2 |

## Threshold Sweep Results

15 configurations tested (baseline + 4 pass_threshold + 4 min_dim_score + 3 accept_threshold + 3 early_stop_threshold):

| Parameter | Sweep Range | Impact on Pass Rate |
|-----------|-------------|---------------------|
| pass_threshold | [0.3, 0.4, 0.5, 0.6] | No change (90%) |
| min_dimension_score | [0.1, 0.15, 0.2, 0.25] | No change (90%) |
| accept_threshold (Queen) | [0.5, 0.6, 0.7] | No change (90%) |
| early_stop_threshold (Queen) | [0.7, 0.8, 0.9] | No change (90%) |

**Key Finding**: The 2 failing cases (bench-010, bench-020) are rejected by **hard rules** (taboo_critical risk tag → auto reject), not by threshold tuning. This confirms the rule engine is correctly separating cultural sensitivity violations from borderline quality issues.

## Recommended Configuration (unchanged from defaults)

```python
CriticConfig(
    pass_threshold=0.4,
    min_dimension_score=0.2,
)

QueenConfig(
    accept_threshold=0.6,
    early_stop_threshold=0.8,
)
```

**Rationale**: Baseline config is already optimal. Thresholds affect borderline cases, but mock mode produces consistently high scores for valid subjects. Real model integration (Step 2) will create more score variance, at which point threshold tuning will become meaningful.

## Next (D14)

- Final report package
- Budget input table for Step 2
- Risk register and runbook
