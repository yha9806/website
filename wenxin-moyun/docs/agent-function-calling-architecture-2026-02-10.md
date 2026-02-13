# VULCA Agent Function Calling 架构设计（2026-02-10）

> **实现状态**（2026-02-10 更新，Phase A+B+C+D 全部完成）：
> - ✅ §3.1 `agent_runtime.py` / `tool_registry.py` / `model_router.py` — 文件已落地 + 主链已接入
> - ✅ §3.1 `critic_llm.py` — **已创建并验证**（~260 行，28/28 mock + 25/25 with-LLM）
> - ✅ §3.2 工具 schema 5/8 — 已落地（search_cultural_references / lookup_terminology / check_cultural_sensitivity / read_layer_analysis / submit_evaluation）
> - ⬜ §3.2 工具 3/8 — 后续计划（propose_region_masks / run_local_inpaint / estimate_round_cost）
> - ✅ §3.4 LayerState / IntentCardV2 / CrossLayerSignal — 数据结构已落地
> - ✅ §4 模型路由配置已落地（DeepSeek + Gemini + fallback）
> - ✅ **主链集成完成**：orchestrator → CriticLLM → AgentRuntime 全链路打通
> - ✅ **FC 闭环完成**：tools 传递 → LLM tool_calls → 执行 → 结果写回 LayerState
> - ✅ **局部重绘**：SD 1.5 inpaint + MaskGenerator + orchestrator rerun_local 路径（Phase A 完成）
> - ✅ **Scout FAISS 语义检索**：all-MiniLM-L6-v2 + IndexFlatIP + auto fallback，Recall@5=100%（Phase B 完成）
> - ✅ **文化路由**：9 传统权重表 + 3 管道变体 + orchestrator 集成，96/96 Gate D（Phase D 完成）
> - ⬜ 跨层信号执行逻辑未实现（数据结构有，主链无调用）
> - ⬜ 动态权重调制未实现（仅用固定查表，未实现置信度/轮次/信号动态调整）

## 1. 你的判断是否正确

是正确的。当前系统是“可运行的多阶段编排”，但还不是“真正 agentic”。

当前形态（代码证据，主链 vs 支线）：
- `PipelineOrchestrator` 串行推进阶段（`orchestrator.py`）
- `CriticAgent` 为规则评分（`critic_agent.py`）
- `DraftAgent` 为 prompt + provider 调用（`draft_agent.py`）
- Agent 支线代码已存在（`agent_runtime.py` / `tool_registry.py`），但尚未接入主链

因此现在更像“workflow system”，不是“tool-using agents”。

## 2. 什么才算“Agent”

至少满足 4 点：
1. 有目标（goal）和可更新状态（state）。
2. 能自主选择工具（tool selection），而不是固定 if-else。
3. 能基于工具结果改计划（re-plan）。
4. 有预算/风险约束下的停止策略（stop policy）。

你们的 L1-L5 正好可作为 Agent 的状态空间，而不是仅仅评分维度。

## 3. 在你现有代码上的最小改造路径

### 3.1 新增运行时层（核心）

新增文件：
- `wenxin-backend/app/prototype/agents/agent_runtime.py`
- `wenxin-backend/app/prototype/agents/tool_registry.py`
- `wenxin-backend/app/prototype/agents/model_router.py`
- `wenxin-backend/app/prototype/agents/critic_llm.py`  (你提到的文件)

职责：
- `agent_runtime.py`：统一执行 `LLM -> tool calls -> tool results -> LLM` 循环。
- `tool_registry.py`：注册工具 schema 和执行函数。
- `model_router.py`：按任务类型、预算、置信度选模型。
- `critic_llm.py`：L3/L5 必跑评审 + L1/L2/L4 按需升级。

### 3.2 Tool schema（示例）

必须先定义可调用工具（JSON schema）：
- `retrieve_evidence(tradition, query, layer, top_k)`
- `judge_l3_l5(candidate_id, evidence_ids, rubric_version)`
- `judge_l1_l2_vision(image_url, reference_ids)`
- `propose_region_masks(image_url, weak_layers)`
- `run_local_inpaint(base_image, masks, prompt_delta, preserve_layers)`
- `estimate_round_cost(plan)`

### 3.3 Orchestrator 接入点

改造点：`wenxin-backend/app/prototype/orchestrator/orchestrator.py`
- Scout 阶段：可选转为 `ScoutAgentRuntime`（允许动态检索和补证据）
- Critic 阶段：先跑规则，再进入 `critic_llm.py` 选择性升级
- Queen 阶段：将 `rerun` 拆成 `rerun_local` / `rerun_global`

### 3.4 L1-L5 动态融合（关键）

在 `PlanState` 增加：
- `layer_states[L1..L5]`
- `priority_by_layer`
- `preserve_layers`
- `target_layers`
- `region_plan`

让每轮决策从“是否 rerun”变成“修哪层、在哪改、花多少钱”。

## 4. Claude 太贵：可替代方案

## 4.1 结论

可以不用 Claude。建议“分层多模型”，不是单模型全包。

### 推荐组合（成本优先）
- Queen/Scout-L5/L3-L5 文本评审：`DeepSeek`（低成本）
- L1/L2 视觉评审：`Gemini 2.5 Flash`（视觉 + function calling）
- 复杂争议样本 fallback：`Claude Sonnet` 或 `OpenAI` 仅少量触发

### 推荐组合（稳定优先）
- Queen + Critic L3/L5：`OpenAI`（Responses + tool calling）
- L1/L2：`Gemini 2.5 Flash` 或 `Mistral` 视觉模型
- fallback：`Claude Haiku/Sonnet`

## 4.2 是否“必须”具备这些能力

按角色拆分：
- Tool calling：对 Queen、Critic、Scout 强烈建议（否则会回到僵硬流程）
- 视觉能力：仅 Critic-L1/L2 必需
- 集群/多 Agent 能力：不是模型内建要求，编排层实现即可

换言之：
- “集群 agents”应由你的 orchestrator/runtime 实现。
- 模型只要支持结构化输出 + 工具调用（部分角色需要视觉）就足够。

## 5. Function Calling 执行循环（标准形态）

每个 agent 采用统一循环：
1. 读入状态（L1-L5、预算、证据覆盖率、历史）
2. 让模型输出：`tool_calls` 或 `final_decision`
3. 执行工具并回填结果
4. 模型基于新结果继续决策
5. 命中 stop policy（预算、收益、门禁）即停止

这一步是“agent 感”的核心，不是 UI。

## 6. 如何证明它不是“僵硬系统”

增加 4 个验收指标：
- Tool-autonomy rate：至少 70% 轮次由模型自主选择工具，不是固定模板。
- Re-plan rate：至少 40% 轮次发生“检索后改计划”。
- Local-rerun efficiency：局部重绘成本 <= 全量重跑 35%。
- L3/L5 quality gain：对比 one-shot，盲评胜率 >= 60%。

## 7. 分两周落地清单

Week 1：先让 Critic 变成“可调用工具的评审代理”
- 完成 `critic_llm.py`
- 完成 `tool_registry.py`
- 接入 `orchestrator.py` 的 Critic 阶段
- 新增 `validate_critic_llm.py`

Week 2：打通局部重绘与动态决策
- `rerun_local` / `rerun_global`
- mask 生成工具 + ComfyUI inpaint 工具
- `PlanState` 动态层状态
- 新增 `validate_local_rerun.py` 和 drift 指标

## 8. 外部依据（联网）

- OpenAI Responses API（工具调用）：https://platform.openai.com/docs/guides/function-calling
- Anthropic Tool Use：https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
- Gemini Function Calling：https://ai.google.dev/gemini-api/docs/function-calling
- Mistral Function Calling：https://docs.mistral.ai/capabilities/function_calling/
- Mistral Vision：https://docs.mistral.ai/capabilities/vision/
- DeepSeek Function Calling：https://api-docs.deepseek.com/guides/function_calling
- ControlNet：https://arxiv.org/abs/2302.05543
- IP-Adapter：https://arxiv.org/abs/2308.06721
- Mixture-of-Agents：https://arxiv.org/abs/2406.04692
- G-Eval：https://arxiv.org/abs/2303.16634
- Together Pricing：https://www.together.ai/pricing
