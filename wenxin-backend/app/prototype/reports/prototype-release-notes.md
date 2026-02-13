# VULCA Prototype V1 — Release Notes

**Version**: 1.0.0
**Date**: 2026-02-08

---

## What's Included

### 5-Agent Pipeline
- **Scout**: Zero-cost evidence gathering (24 VULCA-Bench samples, 8 terminology dictionaries, 14 taboo rules)
- **Draft**: Deterministic candidate generation with MockProvider (8×8 PNG, seed-reproducible)
- **Critic**: Rule-based L1-L5 scoring with risk tagging and gate decisions
- **Queen**: Budget-aware decision logic (accept/rerun/stop/downgrade)
- **Archivist**: Full audit archive (evidence chain, critique card, params snapshot)

### Pipeline Features
- Multi-round Critic→Queen loop with configurable max rounds and cost limits
- Checkpoint system with per-stage persistence and resume capability
- Fallback provider chain with fault injection testing
- CLI and Gradio demo interfaces

### Benchmark
- 20 fixed tasks covering 8 cultural traditions
- 90% acceptance rate, 100% taboo detection
- Threshold sweep across 15 configurations
- All 323+ validation checks passing

## Running the Prototype

```bash
cd wenxin-backend

# Quick CLI demo
python -m app.prototype.ui.cli_demo \
    --subject "Dong Yuan landscape" \
    --tradition chinese_xieyi

# Full 20-sample benchmark
python3 app/prototype/tools/run_benchmark.py \
    --tasks app/prototype/data/benchmarks/tasks-20.json

# Complete validation suite
python3 app/prototype/tools/validate_scout.py
python3 app/prototype/tools/validate_draft.py
python3 app/prototype/tools/validate_critic.py
python3 app/prototype/tools/validate_queen.py
python3 app/prototype/tools/validate_pipeline_e2e.py
python3 app/prototype/tools/validate_archivist.py
python3 app/prototype/tools/validate_fallback.py
python3 app/prototype/tools/validate_demo_api.py
python3 app/prototype/tools/validate_regression.py
```

## Known Limitations

- MockProvider generates placeholder images only (no real image generation)
- Critic rules are heuristic-based, not LLM-driven
- Queen cost tracking uses simulated values
- Gradio UI requires separate `pip install gradio`

## Step 2 Preparation

This prototype provides the architecture for real model integration:
1. Replace MockProvider with real SD/Flux/DALL-E providers
2. Replace CriticRules with LLM-based L1-L5 evaluation
3. Connect Queen cost tracking to real API billing
4. Deploy with LiteLLM fallback for production resilience
