# VULCA L1-L5 动态融合设计（联网复核版，2026-02-10）

## 1. 目标与结论

本设计用于把 L1-L5 从“静态评分标签”升级为“全链路动态控制变量”。

结论先行：
- 你当前系统已经具备可运行骨架（Scout/Draft/Critic/Queen/Archivist + HITL + rerun）。
- 关键缺口是“动态性”：目前 L1-L5 仅在 Critic 内部静态加权，其他阶段没有同层级状态驱动。
- 建议采用“分层 MoA + 选择性升级 + 局部重绘”路线：先把 L1-L5 状态对象贯穿 pipeline，再接入 LLM/VLM 与 ComfyUI inpaint，不重写主编排。

## 2. 当前基线（基于本地代码）

当前实现（已落地）：
- 静态权重与门禁：`wenxin-backend/app/prototype/agents/critic_config.py`
- 规则 Critic 主体：`wenxin-backend/app/prototype/agents/critic_agent.py`
- HITL 决策与保留逻辑：`wenxin-backend/app/prototype/orchestrator/orchestrator.py`
- Draft 仍是“提示词拼装 + provider 出图”：`wenxin-backend/app/prototype/agents/draft_agent.py`

当前问题（影响“深度融合”质量）：
- L1-L5 权重是全局固定值，不随传统/轮次/证据质量变化。
- HITL 的“锁维度”目前主要保留分数，不是对图像区域做真实局部编辑约束。
- Queen 决策主要看阈值与预算，缺少“单位成本增益”驱动的动态调度。

## 3. 设计原则（v2.1）

1. L1-L5 必须是状态机，不是常量。
2. 每阶段都读取并更新 L1-L5 状态（不仅 Critic）。
3. 优先低成本确定性层（规则/检索），只在“不确定”时升级高成本模型。
4. rerun 默认局部重绘，只有在“结构层失真”时才全量重跑。
5. 所有判断必须可溯源到证据与参数（Cultural Provenance）。

## 4. L1-L5 动态状态模型（核心）

定义每一层 `LayerState(d)`（d∈{L1..L5}）：
- `score`: 当前层分数 [0,1]
- `confidence`: 当前层置信度 [0,1]
- `evidence_coverage`: 证据覆盖率 [0,1]
- `volatility`: 跨轮波动 [0,1]
- `locked`: 是否锁定
- `escalated`: 是否已升级到高成本评审
- `cost_spent_usd`

定义优先级（用于动态调度）：

`priority_d = w_d(tradition, round) * (1-score_d) * (1-confidence_d) * risk_d`

定义升级触发：
- `priority_d > tau_escalate`
- 或 `judge_disagreement_d > tau_disagree`
- 或 `evidence_coverage_d < tau_coverage`

定义预算分配：

`B_d = B_remaining * softmax(alpha * priority_d + beta * business_weight_d)`

含义：预算不再均分，而是向“低分/低置信/高风险层”倾斜。

## 5. 每阶段的动态融合

### 5.1 Queen-Intent（新增前置）

输入：subject + tradition + 用户约束。
输出：`IntentCardV2`：
- `target_profile`: 传统权重模板（初始 w_d）
- `must_pass_layers`: 如 L4/L5 强制门禁
- `budget_plan`: 每层预算上限
- `pipeline_variant`: 默认/写意/学院派

### 5.2 Scout（分层检索）

- L1: CLIP/视觉检索（构图、光影、形态）
- L3: 术语词典 + FAISS 文本检索 + Wikidata SPARQL
- L5: 哲学/美学文献检索与摘要
- Taboo: 规则硬门禁（不可绕过）

对每层产出 `evidence_coverage_d`，直接写回 `LayerState`。

### 5.3 Draft（四子阶段）

- Compose: 先解决 L1（构图骨架）
- Style: 解决 L2（技法/材质）+ L3（符号风格）
- Refine: 根据低分层只改局部区域（mask inpaint）
- HiRes: 仅在门禁通过后触发，避免无效高成本渲染

关键点：
- 若 `L1 locked=true`，Refine 不得破坏几何结构（结构保持约束）。
- 若 `L3 low` 且 `L1/L2 high`，优先“符号区域局部重绘”。

### 5.4 Critic（混合评审）

基础层（必跑）：
- Rule Critic + Taboo gate（确定性、低成本）

升级层（按层触发）：
- L3/L5：默认必跑 LLM Judge（有锚定证据）
- L1/L2/L4：仅在优先级高或分歧高时升级

防漂移机制：
- Judge 必须输出 “score + rationale + evidence_citation_ids”。
- 双 Judge 分歧过大时触发第三评审或人工审核。

### 5.5 Queen（动态决策）

决策目标从“是否 rerun”升级为“rerun 什么、花多少钱、改哪里”。

输出：
- `action`: accept / rerun_local / rerun_global / reject / downgrade
- `target_layers`: 本轮要修复的层
- `preserve_layers`: 必须保持不退化的层
- `region_plan`: 每层对应 mask 区域
- `expected_gain_per_cost`

### 5.6 Archivist（分层证据链）

按 L1-L5 存档：
- 每层的评分轨迹（跨轮）
- 每层的证据引用（检索来源ID）
- 每层的模型调用与成本
- 每轮局部编辑参数（seed/mask/steps）

## 6. 多 Agent 团队形态（建议）

采用“分层 MoA（Mixture-of-Agents）”而不是单链路串行：
- Layer-1：Scout 子代理并行产出证据
- Layer-2：Draft 子代理并行产出候选及局部编辑方案
- Layer-3：Critic 子代理并行评审
- Aggregator：Queen 汇总冲突并决策

这和你要的“蜂群”一致，但要加预算上限与并行上限，避免成本爆炸。

## 7. 局部重绘协议（必须落地）

新增 `LocalRerunRequest`：
- `base_candidate_id`
- `target_layers` / `preserve_layers`
- `mask_specs`: [{layer, mask_path, strength}]
- `prompt_delta` / `negative_delta`
- `structure_constraints`

新增验收指标：
- `locked_layer_preservation >= 0.95`
- `cross_layer_drift <= 0.10`
- `local_rerun_cost_ratio <= 0.35`（相对全量重跑）

## 8. 模型与部署分工（本地+云）— v2.2 更新

建议矩阵：
- 本地：SD1.5 / IP-Adapter / ControlNet / FAISS（低成本、可控）
- 云端：FLUX 高清渲染（Together.ai）；LLM Agent 评审（见下表）
- 网关：LiteLLM（路由、重试、fallback、预算）
- 观测：Langfuse（trace/cost/eval 数据回流）

**v2.2 模型分配**（参见 vulca-prototype-plan-v2.md §6.2）：

| 任务 | 模型 | 部署 | 成本/次 | FC | VLM | 备注 |
|------|------|------|---------|:--:|:---:|------|
| Queen-Intent | DeepSeek V3.2 | API (LiteLLM) | $0.002 | ✅ | ❌ | 意图解析 → IntentCardV2 |
| L1/L2 VLM Agent | Gemini 2.5 Flash-Lite | API (LiteLLM) | $0.001 | ✅ | ✅ | 按需升级（`priority_d` 高时触发） |
| L3/L4/L5 Agent | DeepSeek V3.2 | API (LiteLLM) | $0.002 | ✅ | ❌ | L3+L5 必跑，L4 按需 |
| Fallback LLM | Qwen2.5-72B (DeepInfra) | API (LiteLLM) | $0.0007 | ✅ | ❌ | 预算不足时降级 |
| Fallback 备选 | GPT-4o-mini | API (LiteLLM) | $0.0009 | ✅ | ✅ | 最后兜底 |
| Draft 生成 | SD1.5 + IP-Adapter | 本地 ComfyUI | $0 | - | - | 4 变体 |
| Draft 高清 | FLUX (Together.ai) | API | $0.003 | - | - | 已验证 320 tasks |

关键策略：
- 高成本模型只在 `priority_d` 高时触发（选择性升级，非全量调用）。
- 先检索锚定（FAISS），再做 LLM 评审，降低"无依据主观评分"。
- Fallback 链：DeepSeek V3.2 → Qwen2.5-72B → GPT-4o-mini → 规则引擎。
- 单样例混合模式成本 ~$0.008（较旧方案 $0.086 节省 91%）。

## 9. 质量门（你最关心）

必须新增 3 组质量门：

1) 融合质量门（L1-L5 动态性）
- 动态权重触发率 >= 80%
- 低置信升级命中率 >= 70%
- 非必要升级率 <= 20%

2) 编辑质量门（局部重绘有效性）
- 锁定层保真 >= 95%
- 目标层提升中位数 >= +0.10
- 局部重绘成本 <= 全量重跑 35%

3) 评审质量门（Judge 可信度）
- L3/L5 与专家标注 Spearman ρ >= 0.5
- 双 Judge 分歧率 <= 15%
- taboo 漏判 = 0

## 10. 分阶段执行（建议 3 周）

Week 1（动态状态打通）
- 落 `LayerState` / `IntentCardV2` / 动态权重与预算调度
- Queen 决策改为 `rerun_local/rerun_global`
- 不改模型栈，先跑通数据链

Week 2（局部重绘真实化）
- 接 ComfyUI inpaint + mask 管线
- 把 HITL 的锁维度映射到真实 `preserve_layers`
- 新增 drift/preservation 自动评测

Week 3（混合 Critic 与观测）
- L3/L5 必跑 LLM Judge（带检索证据）
- L1/L2/L4 选择性升级
- 接 Langfuse + Promptfoo/DeepEval 回归

## 11. 你现在最该改的 5 件事（优先级）

1. 把 `CriticConfig.weights` 改为 `weights_strategy`（按 tradition/round 动态计算）。
2. 在 `PlanState` 增加 `layer_states` 与 `region_plan`，让 Queen 决策可执行。
3. 把 `rerun` 拆为 `rerun_local` / `rerun_global` 两条执行链。
4. 引入 `evidence_coverage` 与 `judge_disagreement`，驱动选择性升级。
5. 新增三类自动评测脚本：`validate_dynamic_fusion.py`、`validate_local_rerun.py`、`validate_judge_alignment.py`。

## 12. 联网证据（用于方案约束）

以下资料用于“可行性约束”，不是逐字照搬实现：
- ControlNet（空间条件控制，适合保结构局部修改）：https://arxiv.org/abs/2302.05543
- IP-Adapter（图像提示与风格适配，参数轻量）：https://arxiv.org/abs/2308.06721
- CLIP（图文对齐检索基础）：https://arxiv.org/abs/2103.00020
- FAISS（大规模向量检索与索引权衡）：https://github.com/facebookresearch/faiss
- Self-Refine（迭代反馈优于一次生成）：https://arxiv.org/abs/2303.17651
- Reflexion（基于语言反馈的多轮改进）：https://arxiv.org/abs/2303.11366
- Tree of Thoughts（多路径搜索/回溯）：https://arxiv.org/abs/2305.10601
- Mixture-of-Agents（分层多代理聚合）：https://arxiv.org/abs/2406.04692
- G-Eval（LLM-as-judge 相关性与偏置提醒）：https://arxiv.org/abs/2303.16634
- LangGraph Persistence/Interrupt（checkpoint + HITL 设计参考）：
  - https://docs.langchain.com/oss/python/langgraph/persistence
  - https://docs.langchain.com/oss/python/langgraph/interrupts
- ComfyUI Inpaint 与 Server 通信：
  - https://docs.comfy.org/tutorials/basic/inpaint
  - https://docs.comfy.org/development/comfyui-server/comms_overview
- LiteLLM（多模型路由、fallback、预算/限流治理）：https://docs.litellm.ai/
- Langfuse（trace/eval/metrics 一体观测）：https://langfuse.com/
- Together 定价与图像计费公式（预算约束输入）：
  - https://www.together.ai/pricing
  - https://docs.together.ai/docs/serverless-models
- Wikidata WDQS/SPARQL（结构化文化知识检索）：https://www.wikidata.org/wiki/Help%3AData_access

## 13. 最终判断

你的判断是对的：VULCA 的差异化不在“再做一个生成器”，而在“L1-L5 动态融合 + 证据驱动 + 可控局部重绘 + HITL 可执行”。

当前系统已经证明“可跑”，下一步应证明“动态融合确实带来质量增益”。
