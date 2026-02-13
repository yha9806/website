# D5 Report — Draft: Low-Cost Image Generation Pipeline

**Date**: 2026-02-08
**Status**: COMPLETE

---

## Done

1. **Data contracts** (`agents/draft_types.py`)
   - `DraftInput`, `DraftCandidate`, `DraftOutput` with full `to_dict()` serialization
   - `DraftCandidate.to_dict()` outputs exactly 10 keys for traceability

2. **Config with guardrails** (`agents/draft_config.py`)
   - `n_candidates` clamped to `[1, max_candidates]`
   - `steps` clamped to `[1, 50]`
   - `width/height` rounded up to nearest multiple of 64

3. **Provider abstraction** (`agents/draft_provider.py`)
   - `AbstractProvider` ABC with `generate()` + `model_ref` interface
   - `MockProvider`: generates deterministic 8x8 solid-colour PNG using only stdlib (`struct` + `zlib`)
   - Seed → RGB mapping: `(seed*47)%256, (seed*113)%256, (seed*197)%256`

4. **Draft Agent** (`agents/draft_agent.py`)
   - Prompt assembly: base template + cultural style keywords + terminology enrichment + taboo avoidance
   - 8 cultural traditions mapped to style/negative prompt pairs
   - Retry logic: up to `max_retries` per candidate
   - Per-request config precedence: `DraftInput.config` drives runtime generation parameters
   - Task-id path sanitization for image output paths
   - Automatic checkpoint persistence after each run

5. **Checkpoint system** (`checkpoints/draft_checkpoint.py`)
   - `save_draft_checkpoint()`: writes `run.json` + candidate metadata
   - `load_draft_checkpoint()`: reads back checkpoint by task_id
   - Path-safe task directory mapping to block traversal writes
   - Directory: `checkpoints/draft/{task_id}/run.json`

6. **Validation** (`tools/validate_draft.py`)
   - 3 test cases: chinese_xieyi, western_academic, default
   - 7 check categories: candidate count, field completeness, file existence, seed determinism, checkpoint, prompt alignment, guardrails
   - Added deep checks: path containment, config override precedence, max guardrail edge cases
   - ALL CHECKS PASSED

---

## Metrics

| Metric | Value |
|--------|-------|
| New files created | 7 (+ report) |
| Test cases | 3 end-to-end + guardrail suite |
| Total checks | 81 |
| Provider | MockProvider (zero external deps) |
| Image format | 8x8 solid PNG (placeholder) |
| Cultural traditions | 8 mapped |
| D2/D3/D4 regression | PASSED |

---

## Blockers

None blocking. Remaining risk: mock provider does not validate true model-quality behavior (expected for D5 scope).

---

## Next (D6)

- **Critique Agent**: evaluate draft candidates against VULCA rubric dimensions
- Accept `DraftOutput` as input, produce scored ranking
- Score each candidate on L1-L5 alignment using rule-based heuristics
- Output: `CritiqueOutput` with per-candidate scores + rationale
- Checkpoint: `checkpoints/critique/{task_id}/run.json`
