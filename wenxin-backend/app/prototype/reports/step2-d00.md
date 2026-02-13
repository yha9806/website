# Step 2 D00: 基线冻结报告

**日期**: 2026-02-09
**Tag**: `v1.0-prototype` (fcc87ae)
**状态**: PASS

## 基线确认

| 项目 | 值 |
|------|-----|
| Git Tag | `v1.0-prototype` → fcc87ae |
| Provider | MockProvider (mock-v1) |
| 数据集 | tasks-10.json (10 tasks) |

## 全量回归结果

| 验证脚本 | 通过/总数 | 状态 |
|----------|----------|------|
| validate_provider_real.py | 31/31 | PASS |
| validate_critic.py | 66/66 | PASS |
| validate_queen.py | 34/34 | PASS |
| validate_pipeline_e2e.py | 35/35 | PASS |
| validate_archivist.py | 28/28 | PASS |
| validate_fallback.py | 19/19 | PASS |
| validate_regression.py | 13/13 | PASS |
| post-plan-validate.sh | — | PASS (exit 0) |
| **总计** | **226/226** | **ALL PASS** |

## Benchmark 基线指标 (mock)

| 指标 | 值 |
|------|-----|
| Pass Rate | 90.0% (9/10) |
| Avg Latency | 173.7ms |
| Max Latency | 289ms |
| Avg Rounds | 1.1 |
| Avg Cost | $0.022 |
| Total Cost | $0.22 |
| Total API Calls | 44 |
| Decisions | accept=9, stop=1 |

## 已验证能力

- TogetherFluxProvider 实例化成功 (validate_provider_real T7/T8)
- 真实 API 调用已验证 (~726ms, 5600 bytes JPEG) — 需 TOGETHER_API_KEY
- Fallback chain: together_flux → mock 路径已验证

## 核心缺口 (D1 解决)

1. `run_benchmark.py` 和 `run_threshold_sweep.py` 硬编码 `provider="mock"`
2. 无 CLI 参数支持 `--provider together_flux`
3. 无 P95 延迟计算
4. 无真实成本模型
5. 无自动化每日运行脚本

## 结论

基线冻结完成，226/226 checks 全部通过。准备进入 D1 CLI 真实化。
