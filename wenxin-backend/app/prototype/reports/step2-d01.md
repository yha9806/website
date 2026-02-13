# Step 2 D01: CLI 真实化报告

**日期**: 2026-02-09 (与 D0 同日完成)
**状态**: PASS

## 变更清单

### 1. `tools/run_benchmark.py` — CLI 参数化 + P95 + 成本模型

| 变更 | 详情 |
|------|------|
| CLI 参数 | `--provider`, `--api-key`, `--width`, `--height`, `--steps`, `--n-candidates`, `--output` |
| API key 校验 | `together_flux` 无 key 时 → stderr + exit(1) |
| P95 延迟 | `sorted_latencies[int(0.95*n)]` |
| 成本模型 | mock=$0.00/image, together=$0.003/image, 4 candidates/round |
| JSON 输出 | `--output path.json` → `{provider, stats, results}` |
| 向后兼容 | 无参数默认 = mock，行为不变 |

### 2. `tools/run_threshold_sweep.py` — draft_config 传递

| 变更 | 详情 |
|------|------|
| `run_sweep()` | 新增 `draft_config` 参数 |
| `_run_config()` | 新增 `draft_config` 参数 |
| CLI 参数 | 与 run_benchmark.py 相同 7 个参数 |
| 输出文件名 | `sweep-{provider}-results.json` |

### 3. `tools/run_daily.sh` — 每日自动化

4 步流程：Provider 验证 → 全量回归 (6 脚本) → Benchmark → Hook

## 验证结果

### 回归测试

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

### CLI 功能验证

| 测试 | 结果 |
|------|------|
| `run_benchmark.py` (无参数 = mock) | PASS — 90% pass rate |
| `run_benchmark.py --provider together_flux` (无 key) | PASS — exit(1) + stderr |
| `run_benchmark.py --output /tmp/test.json` | PASS — JSON 含 provider/stats/results |
| `run_threshold_sweep.py --tasks tasks-10.json` | PASS — 15 configs, sweep-mock-results.json |
| `run_threshold_sweep.py --provider together_flux` (无 key) | PASS — exit(1) |
| `run_daily.sh mock d00-test` | PASS — 4/4 steps completed |

### Benchmark 指标 (mock, 与 D0 对比)

| 指标 | D0 基线 | D1 |
|------|---------|-----|
| Pass Rate | 90.0% | 90.0% |
| Avg Latency | 173.7ms | ~168ms |
| P95 Latency | (未计算) | ~193ms |
| Avg Rounds | 1.1 | 1.1 |
| Avg Cost | $0.022 | $0.00 |
| Total API Calls | 44 | 44 |

> 成本模型更新：D0 使用 mock=$0.02/round，D1 改为 mock=$0.00/image（mock 无实际成本）。

## 新建文件

| 文件 | 用途 |
|------|------|
| `tools/run_daily.sh` | 每日自动化运行脚本 |
| `reports/step2-d00.md` | D0 基线冻结报告 |
| `reports/step2-d01.md` | 本报告 |

## D2 预告

- 新建 `tools/run_canary.py` — 真实 API 冒烟测试
- 从 tasks-10.json 随机选 5 个 task，使用 together_flux
- 需要 TOGETHER_API_KEY 环境变量
