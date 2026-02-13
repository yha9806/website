# D11 Report: Demo Interfaces (CLI + Gradio)

**Date**: 2026-02-08
**Status**: PASSED

---

## Done

- [x] `ui/cli_demo.py` — Full CLI entry point with argparse, progress display, and archive output
- [x] `ui/gradio_demo.py` — Gradio Web UI (launches when gradio is installed)
- [x] `tools/validate_demo_api.py` — 3 test cases, 18/18 checks passed

## CLI Usage

```bash
cd wenxin-backend
python -m app.prototype.ui.cli_demo \
    --subject "Dong Yuan landscape" \
    --tradition chinese_xieyi \
    --output-dir ./output

# Output:
# [1] Scout: ✓ (5ms)
# [2] Draft: ✓ (32ms)
# [3] Critic: ✓ (2ms)
# [4] Queen: ✓ (0ms)
# Result: ACCEPT
# Best candidate: draft-cli-xxx-0
# → output/evidence_chain.json
# → output/critique_card.md
# → output/params_snapshot.json
# → output/pipeline_output.json
```

## Gradio UI

```bash
pip install gradio  # from requirements.prototype.txt
python -m app.prototype.ui.gradio_demo
# Opens browser with input fields and L1-L5 results
```

## Test Case Results

| Case | Scenario | Checks |
|------|----------|--------|
| 1 | CLI full output (chinese_xieyi) | 11/11 |
| 2 | CLI different tradition | 2/2 |
| 3 | Gradio run_demo() function | 5/5 |

## Metrics

| Metric | Value |
|--------|-------|
| validate_demo_api.py checks | 18/18 PASSED |
| New files created | 3 |
| Lines of code (new) | ~320 |

## Next (D12)

- 10 fixed benchmark tasks covering 8 cultural traditions
- Batch runner with statistics
