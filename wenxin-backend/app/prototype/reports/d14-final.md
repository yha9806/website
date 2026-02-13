# D14 Final Report: VULCA Prototype V1

**Date**: 2026-02-08
**Status**: GATE C ACHIEVED

---

## Executive Summary

The VULCA Prototype V1 is a complete, validated pipeline for cultural artwork evaluation. It implements a 5-agent architecture (Scout → Draft → Critic → Queen → Archivist) with budget guardrails, multi-round rerun logic, fallback chains, and full audit archival. All 20 benchmark tasks complete successfully with 90% acceptance rate (2 taboo cases correctly rejected).

## Gate C Checklist

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| 20 samples completed | 20 | 20 | ✅ |
| L4/L5 first-round pass rate | ≥ 70% | 90% | ✅ |
| Reproducibility | ≥ 95% | 100% (deterministic mock) | ✅ |
| Confirmed dimension retention | ≥ 95% | 100% | ✅ |
| Per-sample simulated cost | ≤ $0.08 | $0.022 | ✅ |
| P95 latency | ≤ 180s | < 1s | ✅ |
| Step 2 budget input ready | yes | yes | ✅ |

## Architecture Overview

```
                    ┌─────────┐
                    │  Input  │ (subject + tradition)
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  Scout  │ Evidence gathering (zero LLM cost)
                    │  (D4)   │ SampleMatcher + TerminologyLoader + TabooRuleEngine
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  Draft  │ Candidate generation (MockProvider / FallbackProvider)
                    │  (D5)   │ 4 candidates × prompt + negative_prompt + seed
                    └────┬────┘
                         │
               ┌─────────▼─────────┐
               │                   │
          ┌────▼────┐         ┌────▼────┐
          │ Critic  │────────►│  Queen  │ Budget-aware decision
          │  (D6)   │ L1-L5  │  (D7)   │ accept / rerun / stop / downgrade
          └────┬────┘ scores  └────┬────┘
               │                   │
               │    ◄──rerun───────┘
               │
          ┌────▼────┐
          │Archivist│ Audit archive generation
          │  (D9)   │ evidence_chain.json + critique_card.md
          └─────────┘
```

## Component Summary

| Day | Component | Files | Tests | Status |
|-----|-----------|-------|-------|--------|
| D1 | Environment | - | - | ✅ |
| D2 | Intent Card Schema | 1 | validate_schema.py | ✅ |
| D3 | Data Resources | 3 | validate_resources.py | ✅ |
| D4 | Scout Agent | 5 | 31/31 checks | ✅ |
| D5 | Draft Agent | 5 | 81/81 checks | ✅ |
| D6 | Critic Agent | 6 | 66/66 checks (D6.1) | ✅ |
| D7 | Queen Agent | 4 | 34/34 checks | ✅ |
| D8 | Pipeline E2E | 4 | 35/35 checks | ✅ |
| D9 | Archivist | 3 | 28/28 checks | ✅ |
| D10 | Fallback Chain | 3 | 19/19 checks | ✅ |
| D11 | Demo UI | 3 | 18/18 checks | ✅ |
| D12 | 10-Sample Regression | 3 | 11/11 checks | ✅ |
| D13 | 20-Sample + Sweep | 2 | sweep complete | ✅ |
| D14 | Final Package | 5 | this report | ✅ |

## Total Validation

| Validation Suite | Checks |
|-----------------|--------|
| validate_scout.py | 31 |
| validate_draft.py | 81 |
| validate_critic.py | 66 |
| validate_queen.py | 34 |
| validate_pipeline_e2e.py | 35 |
| validate_archivist.py | 28 |
| validate_fallback.py | 19 |
| validate_demo_api.py | 18 |
| validate_regression.py | 11 |
| validate_schema.py | pass |
| validate_resources.py | pass |
| **Total** | **323+ checks** |

## Key Metrics (20-Sample Benchmark)

| Metric | Value |
|--------|-------|
| Pass rate | 90.0% |
| Correctly rejected taboo | 2/2 (100%) |
| Avg latency | 436ms |
| P95 latency | < 1s |
| Avg simulated cost | $0.022 |
| Avg rounds | 1.1 |
| Cultural traditions covered | 8/8 |

## Configuration (Frozen)

```python
# Critic
CriticConfig(
    weights={"visual_perception": 0.15, "technical_analysis": 0.20,
             "cultural_context": 0.25, "critical_interpretation": 0.20,
             "philosophical_aesthetic": 0.20},
    pass_threshold=0.4,
    min_dimension_score=0.2,
    critical_risk_blocks=True,
    top_k=1,
)

# Queen
QueenConfig(
    max_rounds=2,
    max_cost_usd=0.10,
    accept_threshold=0.6,
    early_stop_threshold=0.8,
    min_improvement=0.05,
    downgrade_at_cost_pct=0.8,
    mock_cost_per_round=0.02,
)
```

## Deliverables

1. **This report** (`d14-final.md`)
2. **Release notes** (`prototype-release-notes.md`)
3. **Budget input table** (`budget-input-table.csv`)
4. **Risk register** (`risk-register-final.md`)
5. **Runbook** (`runbook.md`)
