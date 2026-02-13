# D4 Report: Scout Minimal Loop

**Date**: 2026-02-08
**Status**: COMPLETE

---

## Done

### Files Created (6)
| File | Lines | Description |
|------|-------|-------------|
| `tools/scout_types.py` | 72 | 4 dataclasses: SampleMatchResult, TerminologyHitResult, TabooViolationResult, ScoutEvidence |
| `tools/sample_matcher.py` | 85 | Keyword-based VULCA-Bench sample retrieval (Jaccard + tag weighting) |
| `tools/terminology_loader.py` | 82 | Three-tier terminology matching: exact (1.0) > alias (0.9) > fuzzy (0.7) |
| `tools/taboo_rule_engine.py` | 44 | Trigger-pattern substring matching against cultural taboo rules |
| `tools/scout_service.py` | 39 | Aggregation service combining all 3 tools into ScoutEvidence |
| `tools/validate_scout.py` | 148 | 3 test cases, 27 assertions covering structure, non-emptiness, taboo, schema alignment |

### Design Decisions
- **Zero-cost**: All matching is local (regex, substring, Jaccard). No LLM API calls.
- **Pure stdlib**: Only `json`, `re`, `pathlib`, `dataclasses` used. No external dependencies.
- **Schema-aligned**: `to_dict()` outputs match `intent_card.schema.json` `$defs` (SampleMatch, TerminologyHit, TabooViolation) exactly.
- **Tradition fallback**: SampleMatcher falls back to `default` tradition when no candidates found.
- **Taboo scope**: Wildcard (`*`) rules apply to all traditions; `default` rules also included.

---

## Metrics

### Validation Results
| Validation | Result |
|-----------|--------|
| `validate_scout.py` | 31/31 checks PASSED |
| `validate_schema.py` (D2 regression) | ALL CHECKS PASSED |
| `validate_resources.py` (D3 regression) | ALL CHECKS PASSED |
| `post-plan-validate.sh` | exit 0 |

### Test Case Coverage
| # | Tradition | Samples | Terms | Taboo | Status |
|---|-----------|---------|-------|-------|--------|
| 1 | chinese_xieyi | 3 hits (top: vulca-bench-0001, sim=0.28) | hemp-fiber texture stroke (conf=1.0) | 0 | PASS |
| 2 | western_academic | 3 hits (top: vulca-bench-0005, sim=0.13) | chiaroscuro (conf=1.0) | 1 (taboo-universal-002, critical) | PASS |
| 3 | default | 3 hits (top: vulca-bench-0011, sim=0.27) | composition + color theory (conf=1.0) | 0 | PASS |

### Matching Quality
- SampleMatcher: Jaccard similarity range [0.03, 0.28] — expected for keyword-based matching without embeddings
- TerminologyLoader: All exact matches at conf=1.0; fuzzy tier (0.7) available but not triggered in test cases
- TabooRuleEngine: Correctly triggers on "primitive art"/"tribal art" via universal rule

### Post-Review Fixes (2026-02-08)
- `TabooRuleEngine`: substring matching upgraded to boundary-aware regex for Latin phrases to reduce false positives (`oriental` no longer matches `orientalism`).
- `SampleMatcher`: added `top_k` guards (`top_k <= 0 -> []`, non-int raises `TypeError`).
- `validate_scout.py`: assertion counting corrected to avoid over-counting passes; added regression checks for `top_k` guard and taboo false-positive case.

---

## Blockers

None.

---

## Next (D5)

D5 目标：实现 **8-stage pipeline skeleton** + Intent Card round-trip。

关键任务：
1. Pipeline stage definitions (8 stages: intent → reference → anchor → sketch → critique → refine → verify → archive)
2. Stage transition logic with Intent Card state machine
3. Scout integration at `anchor` stage — `ScoutService.gather_evidence()` writes to Intent Card `evidence` field
4. Checkpoint management for rollback support
