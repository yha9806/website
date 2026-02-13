# Step 2 Go/No-Go 决策文档

**日期**: 2026-02-09
**决策者**: Yu, Haorui
**Provider**: Together.ai FLUX.1-schnell

---

## Decision: **GO**

---

## 量化依据

### 1. Pass Rate

| 指标 | 门槛 | 实测 | 裕度 |
|------|------|------|------|
| 单次 pass_rate | >= 85% | **90.0%** | +5pp |
| 跨日一致性 | 无连续 2 天 < 75% | **9/9 runs = 90.0%** | 零波动 |

- 140 次 together_flux tasks，pass_rate 恒定 90.0%，标准差 = 0
- 与 mock baseline 零 decision drift (0/20)

### 2. Taboo 检测

| 指标 | 门槛 | 实测 |
|------|------|------|
| 漏判 | = 0 | **0/14** |

- bench-010: 8/8 次正确 stop
- bench-020: 6/6 次正确 stop
- 跨 provider、跨配置、跨日期全部正确

### 3. 成本

| 指标 | 门槛 | 实测 | 裕度 |
|------|------|------|------|
| avg_cost_usd | <= $0.08 | **$0.0132** | 83% |
| 连续 2 天 > $0.08 | 不可触发 | **从未触发** | CLEAR |

### 4. 延迟

| 指标 | 门槛 | 实测 | 裕度 |
|------|------|------|------|
| P95 | < 30s | **6628ms (avg)** | 78% |
| P95 最差单次 | < 30s | **16207ms** | 46% |
| 连续 2 天 P95 > 30s | 不可触发 | **从未触发** | CLEAR |

### 5. Fallback 失败率

| 指标 | 门槛 | 实测 |
|------|------|------|
| 未恢复失败率 | <= 5% | **0%** |

- 真实 benchmark: 0% fallback 触发（together_flux 100% 成功）
- 故障注入: 19/19 checks pass，fallback chain 正常工作

### 6. 验证套件

| 脚本 | Checks | 状态 |
|------|--------|------|
| validate_provider_real.py | 35/35 | PASS |
| validate_critic.py | 66/66 | PASS |
| validate_queen.py | 34/34 | PASS |
| validate_pipeline_e2e.py | 35/35 | PASS |
| validate_archivist.py | 28/28 | PASS |
| validate_fallback.py | 19/19 | PASS |
| validate_regression.py | 13/13 | PASS |
| validate_demo_api.py | 18/18 | PASS |
| post-plan-validate.sh | exit 0 | PASS |
| **总计** | **248/248** | **ALL PASS** |

### 7. Hard Gates

| # | 条件 | 状态 |
|---|------|------|
| 1 | taboo 漏判 > 0 | **CLEAR** (0/14) |
| 2 | 连续 2 天 pass_rate < 75% | **CLEAR** (恒定 90%) |
| 3 | 连续 2 天 cost > $0.08 | **CLEAR** ($0.0132) |
| 4 | fallback 未恢复率 > 5% | **CLEAR** (0%) |
| 5 | 连续 2 天 P95 > 30s | **CLEAR** (max 16.2s) |

**所有 5 条 Hard Gates 均未触发。**

---

## 放量策略

### Phase 1: 10% (当前)

| 项目 | 值 |
|------|-----|
| 样本量 | 10-20 tasks/run |
| n_candidates | 2 |
| 分辨率 | 512×512 |
| 频次 | 每日 1 run |
| 回退条件 | 任意 Hard Gate 触发 |

**状态**: 已完成验证 (D2-D6)，稳定通过。

### Phase 2: 50%

| 项目 | 值 |
|------|-----|
| 样本量 | 20 tasks/run, n_candidates=4 |
| 分辨率 | 512×512 |
| 频次 | 每日 1-2 runs |
| 进入条件 | Phase 1 连续 3 天 pass_rate >= 85% |
| 回退条件 | 任意 Hard Gate 触发 → 回退 Phase 1 |

### Phase 3: 100%

| 项目 | 值 |
|------|-----|
| 样本量 | 全量 tasks, n_candidates=4 |
| 分辨率 | 512×512 |
| 频次 | 按需 |
| 进入条件 | Phase 2 连续 3 天 pass_rate >= 85% + cost < $0.08 |
| 回退条件 | 任意 Hard Gate 触发 → 回退 Phase 2 |

### 回退流程

1. 触发 Hard Gate → 立即回退到上一 Phase
2. 记录故障详情到当日 step2-dNN.md
3. 修复后重新验证 3 天才可恢复
4. taboo 漏判 → 立即停止所有真实调用，回退到 mock-only

---

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Together.ai API 不可用 | 低 | 中 | fallback chain → mock |
| 成本飙升 | 极低 | 低 | 固定定价 $0.003/image |
| 延迟飙升 | 低 | 低 | P95 裕度 78%，30s 上限 |
| Taboo 漏判 | 极低 | 高 | 14/14 正确，回退条件覆盖 |
| Credit 耗尽 | 中 | 中 | 剩余 $2.16，~8 runs |

---

## 总结

基于 D2-D6 连续 5 天、140+ 真实 API tasks、15 配置 sweep、3 轮稳定性验证的数据：

- **质量**: 恒定 90% pass_rate，零波动，零 taboo 漏判
- **成本**: $0.0132/task，远低于 $0.08 上限
- **延迟**: P95 典型 6-8s，远低于 30s 上限
- **稳定性**: CV=0% (质量)，CV=4.4% (延迟)
- **Fallback**: 100% 正常工作，0% 触发率
- **参数敏感性**: 零敏感，默认配置即最优

**结论: GO — 建议进入 Phase 2 放量 (50%)**
