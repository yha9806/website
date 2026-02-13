# S2: Pipeline Integration + Cost Tracking Report

**Date**: 2026-02-08
**Baseline**: S1 complete (224 checks passing)

## Summary

Integrated `together_flux` provider into the full pipeline, extended benchmark statistics with provider-aware cost tracking, and added provider type assertions to regression tests.

## Changes

| File | Operation | Description |
|------|-----------|-------------|
| `pipeline/run_pipeline.py` | Modified | Rerun config now passes `api_key` + `provider_model` |
| `tools/run_benchmark.py` | Modified | `_summarize()` extracts provider_type; `compute_statistics()` includes provider distribution + API call count |
| `tools/validate_regression.py` | Modified | Added provider_type and provider_distribution assertions |

## Pipeline Configuration

The pipeline already accepted `draft_config` parameter. Now it correctly propagates `api_key` and `provider_model` through rerun loops:

```python
# Real provider usage
result = run_pipeline(
    PipelineInput(task_id="test-1", subject="landscape", cultural_tradition="chinese_xieyi"),
    draft_config=DraftConfig(provider="together_flux", api_key=os.environ["TOGETHER_API_KEY"]),
)
```

## Extended Statistics

New fields in `compute_statistics()`:
- `provider_distribution`: Count of tasks per provider type (e.g. `{"mock": 10}`)
- `total_api_calls`: Estimated total API calls (rounds × 4 candidates)
- Cost model: mock=$0.02/round, together_flux=$0.00/round (free tier)

## Validation Results

| Suite | Checks | Status |
|-------|--------|--------|
| validate_provider_real.py | 31/31 | PASS |
| validate_critic.py | 66/66 | PASS |
| validate_queen.py | 34/34 | PASS |
| validate_pipeline_e2e.py | 35/35 | PASS |
| validate_archivist.py | 28/28 | PASS |
| validate_fallback.py | 19/19 | PASS |
| validate_regression.py | 13/13 | PASS |
| **Total** | **226/226** | **ALL PASS** |

## Regression Benchmark (10 tasks, mock provider)

- Pass rate: 90.0% (9/10)
- Avg latency: 162.3ms
- Avg rounds: 1.1
- Decisions: accept=9, stop=1 (taboo case correctly rejected)
- Provider: mock (100%)

## Post-Plan Hook

```
post-plan-validate.sh → EXIT 0 (pass)
```
