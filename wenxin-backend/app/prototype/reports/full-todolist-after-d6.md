# Full TodoList (After D6): 从当前到收官

> 基线：D1-D6 已完成并通过回归  
> 更新时间：2026-02-08  
> 目标：一次性跑完剩余工作，达到 D14 Gate C

## 0) D6.1 稳定性修复（先做，P0）

### 0.1 Critic 配置一致性
- [ ] 修复 `top_k` 配置未生效（当前评分输出未按 `top_k` 收敛）。
- [ ] 增加 `weights` 归一化/校验（防止 `weighted_total > 1`）。
- [ ] 定义空候选行为：`candidates=[]` 时 `success=False` 且给出明确错误。

### 0.2 Critic 校验补强
- [ ] 在 `validate_critic.py` 增加 3 条回归：
- [ ] `top_k=1` 时输出候选数量与选择逻辑一致。
- [ ] 非归一化权重输入触发校验或自动归一并可验证。
- [ ] 空候选输入触发失败态且 checkpoint 正确落盘。

### 0.3 D6 报告更新
- [ ] 在 `d6-critic.md` 增加“Post-Review Fixes”段。
- [ ] 更新校验数字与残余风险。

DoD:
- [ ] `validate_critic.py` 通过且覆盖新增场景。
- [ ] D2-D5 回归仍全绿。

## 1) D7: Queen v1（预算护栏 / 轮次控制 / 早停）

- [ ] 新建 `agents/queen_types.py`（PlanState / BudgetState / StopDecision）。
- [ ] 新建 `agents/queen_config.py`（预算上限、轮次上限、早停阈值、降级策略）。
- [ ] 新建 `agents/queen_agent.py`：
- [ ] 输入 Critic 结果后决定 `accept / rerun / stop / downgrade`。
- [ ] 支持“保留已确认维度，仅重跑不满意维度”。
- [ ] 新建 `tools/validate_queen.py`（至少 6 用例：超预算、达标早停、局部重跑、全拒绝、降级成功、降级失败）。
- [ ] 新建 `reports/d7-queen.md`。

DoD:
- [ ] Queen 可单独运行并输出确定性决策。
- [ ] 预算超限可自动停止或降级。

## 2) D8: 端到端闭环（Scout→Draft→Critic→Queen）

- [ ] 新建 `pipeline/run_pipeline.py`（单任务完整执行入口）。
- [ ] 接入 checkpoint 恢复能力（从任意阶段恢复）。
- [ ] 输出统一运行摘要（每阶段时延、状态、失败原因）。
- [ ] 新建 `tools/validate_pipeline_e2e.py`（至少 3 条样例，含 1 条 partial-rerun）。
- [ ] 新建 `reports/d8-e2e.md`。

DoD:
- [ ] 至少 1 条样例全链路成功。
- [ ] partial-rerun 可保留已确认维度，不重跑已通过维度。

## 3) D9: Archivist v1（证据链 / 批评卡 / 参数快照）

- [ ] 新建 `agents/archivist_types.py`。
- [ ] 新建 `agents/archivist_agent.py`。
- [ ] 输出：
- [ ] `evidence_chain.json`
- [ ] `critique_card.md`
- [ ] `params_snapshot.json`
- [ ] 新建 `tools/validate_archivist.py`（检查可追溯字段完整性）。
- [ ] 新建 `reports/d9-archivist.md`。

DoD:
- [ ] 每次运行都有可复现、可审计的完整归档。

## 4) D10: Fallback 链与错误策略

- [ ] 在 Provider 层接入多级 fallback（主模型→备选模型→mock）。
- [ ] 支持超时/429/5xx 分类重试策略（指数退避 + 最大重试）。
- [ ] 记录 fallback 路由日志（触发原因、切换次数、最终状态）。
- [ ] 新建 `tools/validate_fallback.py`（故障注入：429、timeout、provider down）。
- [ ] 新建 `reports/d10-fallback.md`。

DoD:
- [ ] 模拟故障下流程可自动切换并继续执行。
- [ ] Gate B 达成：E2E 成功率 >= 70%（固定样例集）。

## 5) D11: Demo 接口（可操作）

- [ ] 新建后端 demo API（启动任务、查询阶段状态、获取最终产物）。
- [ ] 新建最小前端页面（输入主题、显示阶段进度、展示结果与证据）。
- [ ] 新建 `tools/validate_demo_api.py` + 最小 E2E 用例。
- [ ] 新建 `reports/d11-demo.md`。

DoD:
- [ ] 用户可输入主题并看到完整阶段状态与输出。

## 6) D12: 10 样例回归（中期）

- [ ] 固定 `benchmarks/tasks-10.json`（覆盖 8 traditions）。
- [ ] 运行批量回归脚本并输出统计：
- [ ] 通过率、平均时延、平均成本、fallback 触发率、rerun 比例。
- [ ] 新建 `reports/d12-regression-10.md`。

DoD:
- [ ] 指标可复现，且有失败样例分析与改进动作。

## 7) D13: 20 样例回归 + 阈值调优

- [ ] 扩展 `benchmarks/tasks-20.json`。
- [ ] 做阈值扫参与 A/B（pass_threshold、min_dimension_score、early_stop）。
- [ ] 固化推荐参数组（成本/质量最优折中）。
- [ ] 新建 `reports/d13-regression-20.md`。

DoD:
- [ ] 达到或接近 Gate C 要求；核心指标稳定。

## 8) D14: 封版与交付包

- [ ] 固化配置版本（含 hash/日期/参数快照）。
- [ ] 生成最终收官包：
- [ ] `prototype-release-notes.md`
- [ ] `budget-input-table.csv`
- [ ] `risk-register-final.md`
- [ ] `runbook.md`（本地一键跑通 + 排障）
- [ ] 新建 `reports/d14-final.md`。

DoD:
- [ ] Gate C 达成：20 样例完成，DoD 指标可量化，Step 2 输入可直接使用。

## 9) 每个里程碑的强制质量门（不允许跳过）

- [ ] `venv/bin/python app/prototype/tools/validate_critic.py`（D6+）
- [ ] `venv/bin/python app/prototype/tools/validate_draft.py`
- [ ] `venv/bin/python app/prototype/tools/validate_scout.py`
- [ ] `venv/bin/python app/prototype/tools/validate_resources.py`
- [ ] `venv/bin/python app/prototype/validate_schema.py`
- [ ] `bash .claude/hooks/post-plan-validate.sh`
- [ ] 对应里程碑专属验证脚本（queen/pipeline/archivist/fallback/demo/regression）

执行规则：
- [ ] 任一质量门失败即里程碑保持 open，不允许标记完成。
- [ ] 修复后必须重跑受影响校验，记录命令与结果。

## 10) 建议执行顺序（最短收官路径）

1. D6.1 稳定性修复  
2. D7 Queen  
3. D8 E2E 闭环  
4. D9 Archivist  
5. D10 Fallback  
6. D11 Demo  
7. D12 10 样例回归  
8. D13 20 样例回归  
9. D14 封版
