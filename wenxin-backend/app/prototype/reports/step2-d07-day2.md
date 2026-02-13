# Step 2 D07 Day 2: Phase 2 放量

**日期**: 2026-02-09
**配置**: together_flux, 512×512, steps=4, **n_candidates=4**
**状态**: PASS

## 指标

| 指标 | 值 | 门槛 | 状态 |
|------|-----|------|------|
| pass_rate | **90.0%** (18/20) | >= 85% | PASS |
| taboo 漏判 | **0** | = 0 | PASS |
| avg_cost | **$0.0132** | <= $0.08 | PASS |
| P95 latency | **10322ms** | < 30s | PASS |
| fallback 失败率 | **0%** | <= 5% | PASS |

## Decisions 分布

| Decision | Count |
|----------|-------|
| accept | 18 |
| stop | 2 |
| rerun | 0 |

## Taboo 检测

| Task | Decision |
|------|----------|
| bench-010 | stop |
| bench-020 | stop |

## Top 3 失败样例

| # | Task | Decision | Tradition | 原因 |
|---|------|----------|-----------|------|
| 1 | bench-010 | stop | western_academic | taboo 正确拒绝 |
| 2 | bench-020 | stop | islamic_geometric | taboo 正确拒绝 |
| 3 | — | — | — | 无其他失败 |

## 质量门

| 脚本 | 结果 |
|------|------|
| validate_pipeline_e2e.py | 35/35 PASS |
| validate_fallback.py | 19/19 PASS |
| post-plan-validate.sh | exit 0 |

## Day 1→2 对比

| 指标 | Day 1 | Day 2 |
|------|-------|-------|
| Pass Rate | 90.0% | 90.0% |
| Avg Latency | 5623ms | 5585ms |
| P95 | 11862ms | 10322ms |
| Avg Cost | $0.0132 | $0.0132 |
