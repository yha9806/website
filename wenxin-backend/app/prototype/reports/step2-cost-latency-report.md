# Step 2 成本与延迟报告

**生成日期**: 2026-02-09
**Provider**: Together.ai FLUX.1-schnell (`black-forest-labs/FLUX.1-schnell`)
**定价模型**: $0.003/image (b64_json, 512×512, steps=4)

## 成本模型

### Per-Image 成本

| Provider | 成本/image | 格式 | 分辨率 |
|----------|-----------|------|--------|
| mock | $0.00 | PNG (synthetic) | any |
| together_flux | $0.003 | JPEG (b64_json) | 512×512 |

### Per-Task 成本

默认配置: n_candidates=2, avg_rounds=1.1

```
per_task = avg_rounds × n_candidates × cost_per_image
         = 1.1 × 2 × $0.003
         = $0.0066
```

实测 per_task: **$0.0132**（因 n_candidates=4 时 4 张/轮；实际 CLI 用 n_candidates=2）

### Per-Run 成本 (20 tasks)

```
per_run = 20 × $0.0132 = $0.264
```

## 历史成本跟踪

| 日期 | 运行内容 | Images | 消耗 | 累计 |
|------|---------|--------|------|------|
| D2 | 10t canary + provider val | ~47 | $0.14 | $0.14 |
| D3 | 20t together + 20t mock | ~88 | $0.26 | $0.40 |
| D4 | 3×20t stability | ~264 | $0.79 | $1.19 |
| D5 | 20t + 10t canary | ~132 | $0.40 | $1.59 |
| D6 | 20t baseline + 15×10t sweep | ~418 | $1.25 | $2.84 |
| **总计** | | **~949** | **$2.84** | |

### 剩余预算

| 项目 | 值 |
|------|-----|
| 初始 credit | $5.00 |
| 已消耗 | ~$2.84 |
| 剩余 | **~$2.16** |
| 可支撑 20t runs | ~8 runs |

## 延迟分析

### 汇总统计 (together_flux, 所有 D2-D6 runs)

| 指标 | 值 |
|------|-----|
| 总 tasks | 140 |
| Avg Latency 范围 | 2870ms – 5967ms |
| P95 范围 | 4654ms – 16207ms |
| 典型 Avg Latency | ~3000ms |
| 典型 P95 | ~6000-8000ms |

### Per-Day 延迟趋势

| Day | Avg Latency | P95 Latency | 备注 |
|-----|-------------|-------------|------|
| D2 | 3129ms | 4654ms | 首次真实调用 |
| D3 | 5967ms | 16207ms | 异常高，可能 API 侧抖动 |
| D4 run1 | 3179ms | 7933ms | — |
| D4 run2 | 3125ms | 5807ms | — |
| D4 run3 | 2870ms | 6143ms | — |
| D5 20t | 2966ms | 7643ms | — |
| D5 10t | 2944ms | 5042ms | — |
| D6 | 3154ms | 7480ms | — |

### 延迟分布特征

- **单轮 accept 任务**: 1.9s – 7.2s（中位 ~2.5s）
- **双轮 stop 任务**: 4.0s – 16.2s（含 2 次推理 + critic + queen）
- **P95 尖峰**: D3 的 16.2s 为孤立事件，后续 5 天稳定在 5-8s

### 延迟 vs Hard Gate

| 门槛 | 限值 | 实际最差 | 裕度 |
|------|------|---------|------|
| P95 < 30s | 30000ms | 16207ms | **46%** |
| 连续 2 天 P95 > 30s | — | 从未触发 | **CLEAR** |

## 成本 vs Hard Gate

| 门槛 | 限值 | 实际值 | 裕度 |
|------|------|--------|------|
| avg_cost <= $0.08 | $0.08 | $0.0132 | **83%** |
| 连续 2 天 cost > $0.08 | — | 从未触发 | **CLEAR** |

## 成本优化建议

1. **当前配置已接近最优** — $0.003/image 是 FLUX.1-schnell 最低价
2. **降低 n_candidates 可线性降成本** — 从 4→2 已实施，节省 50%
3. **steps=4 为最低推荐值** — 进一步降低会影响图像质量
4. **256×256 可降成本约 30%** — 但可能影响 critic 判断

## 结论

- 成本可控：$0.0132/task，远低于 $0.08 上限
- 延迟稳定：P95 典型 6-8s，最差 16s，远低于 30s 上限
- 预算充足：剩余 $2.16 可支撑约 8 次 20-task run
