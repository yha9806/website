# Risk Register — VULCA Prototype V1

**Date**: 2026-02-08

---

## Active Risks

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Mock scores don't predict real model performance | High | Medium | Threshold sweep prepared; re-tune with real data in Step 2 | Dev |
| R2 | Real image generation latency >> mock latency | High | Low | Fallback chain + timeout handling already implemented | Dev |
| R3 | API rate limiting during batch runs | Medium | Medium | FallbackProvider with exponential backoff; stagger requests | Dev |
| R4 | Cultural sensitivity rules incomplete | Medium | High | 14 taboo rules cover major cases; expand with domain expert review | Research |
| R5 | L1-L5 rule-based scoring disagrees with expert ratings | Medium | High | Rules are placeholder; LLM-based scoring in Step 2 | Research |

## Mitigated Risks

| ID | Risk | Resolution |
|----|------|------------|
| M1 | Empty candidate crash | D6.1: success=False guard |
| M2 | Weight normalization error | D6.1: auto-normalize in __post_init__ |
| M3 | Budget overrun | D7: Queen agent with cost ceiling + downgrade |
| M4 | Checkpoint corruption | D8: per-stage JSON persistence + resume |
| M5 | Provider failure | D10: FallbackProvider with retry chain |
| M6 | Non-reproducible results | MockProvider: seed-deterministic PNG generation |

## Accepted Risks

| ID | Risk | Reason |
|----|------|--------|
| A1 | 8×8 pixel images not useful for visual QA | Mock mode; real providers in Step 2 |
| A2 | No real LLM integration yet | Prototype validates architecture only |
| A3 | Gradio requires separate install | Optional; CLI works without it |
