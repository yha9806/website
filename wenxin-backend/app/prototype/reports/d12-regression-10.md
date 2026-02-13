# D12 Report: 10-Sample Benchmark Regression

**Date**: 2026-02-08
**Status**: PASSED

---

## Done

- [x] `data/benchmarks/tasks-10.json` — 10 fixed tasks covering 8 cultural traditions
- [x] `tools/run_benchmark.py` — Batch runner with statistics computation
- [x] `tools/validate_regression.py` — 11/11 checks passed

## Benchmark Coverage

| # | Task ID | Tradition | Subject | Decision |
|---|---------|-----------|---------|----------|
| 1 | bench-001 | chinese_xieyi | Dong Yuan landscape | accept |
| 2 | bench-002 | chinese_gongbi | Song Huizong flower-and-bird | accept |
| 3 | bench-003 | western_academic | Caravaggio chiaroscuro | accept |
| 4 | bench-004 | western_academic | Vermeer domestic interior | accept |
| 5 | bench-005 | islamic_geometric | Alhambra tessellation | accept |
| 6 | bench-006 | african_traditional | Benin Bronze | accept |
| 7 | bench-007 | south_asian | Mughal miniature | accept |
| 8 | bench-008 | watercolor | Turner landscape | accept |
| 9 | bench-009 | default | Cross-cultural composition | accept |
| 10 | bench-010 | western_academic | **Taboo case** | **stop** |

## Statistics

| Metric | Value |
|--------|-------|
| Pass rate | 90.0% (9/10) |
| Avg latency | 278.9ms |
| Max latency | < 10s |
| Avg rounds | 1.1 |
| Avg simulated cost | $0.022 |
| Total simulated cost | $0.22 |
| Decisions | accept: 9, stop: 1 |

## Per-Tradition Results

| Tradition | Passed/Total |
|-----------|-------------|
| chinese_xieyi | 1/1 |
| chinese_gongbi | 1/1 |
| western_academic | 2/3 (taboo case correctly rejected) |
| islamic_geometric | 1/1 |
| african_traditional | 1/1 |
| south_asian | 1/1 |
| watercolor | 1/1 |
| default | 1/1 |

## Next (D13)

- Expand to 20 samples with edge cases
- Threshold sweep for parameter optimization
