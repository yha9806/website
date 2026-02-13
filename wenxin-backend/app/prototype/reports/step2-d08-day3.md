# Step 2 D08 Day 3: Phase 3 全量

**配置**: together_flux, 512×512, steps=4, n_candidates=4, 30 tasks (20+10)
**状态**: PASS

## 合并指标 (30 tasks)

| 指标 | 值 | 门槛 | 状态 |
|------|-----|------|------|
| pass_rate | **90.0%** (27/30) | >= 85% | PASS |
| taboo 漏判 | **0** | = 0 | PASS |
| avg_cost | **$0.0132** | <= $0.08 | PASS |
| P95 latency | **10761ms** | < 30s | PASS |
| fallback 失败率 | **0%** | <= 5% | PASS |

## Decisions: accept=27, stop=3

## Taboo: bench-010 (20t) stop, bench-020 (20t) stop, bench-010 (10t) stop — 0 漏判

## Top 3 失败: 全部 taboo 正确拒绝

## 质量门: regression 13/13 + fallback 19/19 + hook exit 0

## 3 天趋势

| 指标 | Day 1 | Day 2 | Day 3 |
|------|-------|-------|-------|
| Pass Rate | 90.0% | 90.0% | 90.0% |
| P95 | 9277ms | 12122ms | 10761ms |
| Avg Latency | 5857ms | 6318ms | 5658ms |
| Avg Cost | $0.0132 | $0.0132 | $0.0132 |
| Taboo Miss | 0 | 0 | 0 |
