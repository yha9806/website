# Step 2 D08 Day 1: Phase 3 全量

**配置**: together_flux, 512×512, steps=4, n_candidates=4, 30 tasks (20+10)
**状态**: PASS

## 合并指标 (30 tasks)

| 指标 | 值 | 门槛 | 状态 |
|------|-----|------|------|
| pass_rate | **90.0%** (27/30) | >= 85% | PASS |
| taboo 漏判 | **0** | = 0 | PASS |
| avg_cost | **$0.0132** | <= $0.08 | PASS |
| P95 latency | **9277ms** | < 30s | PASS |
| fallback 失败率 | **0%** | <= 5% | PASS |

## Decisions 分布

| Decision | 20t | 10t | 合计 |
|----------|-----|-----|------|
| accept | 18 | 9 | 27 |
| stop | 2 | 1 | 3 |

## Taboo: bench-010 (20t) stop, bench-020 (20t) stop, bench-010 (10t) stop — 0 漏判

## Top 3 失败样例

1. bench-010 (20t): stop — taboo 正确拒绝
2. bench-020 (20t): stop — taboo 正确拒绝
3. bench-010 (10t): stop — taboo 正确拒绝

## 质量门: regression 13/13 + fallback 19/19 + hook exit 0
