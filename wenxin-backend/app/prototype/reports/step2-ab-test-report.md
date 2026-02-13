# A/B Blind Test: One-shot vs Agent Pipeline

**日期**: D8+1 (Phase 3 稳定后)
**配置**: together_flux, 512×512, steps=4, n_candidates=4, 20 tasks

---

## 测试设计

| 属性 | Arm A (One-shot) | Arm B (Agent) |
|------|-----------------|---------------|
| 候选生成 | 同一批 4 candidates | 同一批 4 candidates |
| 评分 | 无 (取 candidate[0]) | Critic L1-L5 评分 + risk tag |
| 选择 | 第一个候选 | 最高分且通过 gate |
| Taboo 检测 | 无 | 有 (risk tagger + gate) |
| Queen 决策 | 无 | accept/stop/rerun |
| 额外 API 成本 | $0 | $0 (使用同一组图) |

---

## 结果汇总

| 指标 | 值 |
|------|----|
| 总 tasks | 20 |
| Agent wins | 2 (10.0%) |
| One-shot wins | 0 |
| Ties | 18 (90.0%) |
| Safety overrides | 2 |

### 得分对比

| 指标 | Agent | One-shot |
|------|-------|----------|
| 平均得分 | 0.7366 | 0.7809 |
| 得分差 (avg) | -0.0442 | — |

> Agent 平均得分更低，因为 taboo 任务得分 = 0.0 (正确拒绝)。
> 排除 taboo 后，两组得分完全相同。

### Taboo 安全性

| 指标 | Agent | One-shot |
|------|-------|----------|
| Taboo tasks | 2 | 2 |
| 正确拦截 | **2/2 (100%)** | **0/2 (0%)** |

---

## 核心发现

### 1. 规则 Critic 无法区分候选图片

18/18 非 taboo 任务全部 **tie**。原因：

```
CriticRules.score(candidate, evidence, tradition)
  → score = f(prompt, tradition, evidence)
  → NOT f(image_content)
```

所有 4 个候选来自同一 task，共享相同 prompt/tradition/evidence，因此获得**完全相同的分数**。规则 Critic 从未看过图片像素。

### 2. Agent 的唯一实际价值 = Taboo 安全网

Agent pipeline 在非 taboo 任务上**零选择增益** (0% win rate)，但在 taboo 任务上提供 **100% 拦截率** (2/2)。

### 3. One-shot 在功能上等价于 Agent (除安全性)

| 维度 | One-shot | Agent | 差异 |
|------|----------|-------|------|
| 选择质量 | 随机 | 确定性最优 | **0** (规则 Critic 无法区分) |
| Taboo 安全 | 无 | 100% | **关键差异** |
| 延迟 | ~5s (1 round) | ~5-12s (1-2 rounds) | Agent 更慢 |
| 成本 | $0.012 | $0.013 | 相同 |

---

## 结论

**规则 Critic 已到天花板。** 其价值仅限于 taboo 检测。如需真正的候选选择能力，必须升级为 VLM/LLM Critic，使其能分析图片内容。

---

## 下一步建议

见 `step2-critic-upgrade-decision.md`
