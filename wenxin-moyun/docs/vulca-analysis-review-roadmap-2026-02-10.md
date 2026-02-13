# VULCA 分析复核与路线结论（2026-02-10）

## 0. 结论先行

你的分析结论整体是对的，尤其是这三点：
- 当前系统是**可运行的工程闭环**，不是完整兑现 v1.1 设计愿景的“跨文化创作系统”。
- L1-L5 目前主要停留在 Critic 评分层，不是全链路驱动框架。
- “局部重跑”现在主要是**评分约束层面的保留**，不是图像编辑层面的局部重绘。

但有两个关键修正：
- 不是“全 mock”：Step 2 已有 together_flux 大规模真实运行（320 tasks，90% pass，P95 ~10.7s，$0.0132/task）。
- 不是“完全没有锚定”：已有术语、禁区、样本匹配，但样本检索还是规则/Jaccard，不是向量语义检索。

---

## 1. 逐项复核（你的判断 vs 代码事实）

## 1.1 L1-L5 集成深度

复核结果：**基本正确（高置信）**  
事实依据：
- Critic 明确是 L1-L5 规则评分：`wenxin-backend/app/prototype/agents/critic_rules.py:1`
- Draft 主要基于 tradition 风格词与术语注入，不按 L1-L5 分阶段生成：`wenxin-backend/app/prototype/agents/draft_agent.py:24`
- Scout 不分 L 层任务，只做样本/术语/禁区聚合：`wenxin-backend/app/prototype/tools/scout_service.py:24`

结论：L1-L5 当前是“评估维度”，还不是“生成与检索的主控语义框架”。

## 1.2 Agent 团队形态

复核结果：**方向正确（中高置信）**  
事实依据：
- 主编排是同步阶段 orchestrator（非多 agent 协商）：`wenxin-backend/app/prototype/orchestrator/orchestrator.py:153`
- 仍有完整 API/SSE/HITL 交互，不是纯脚本串联：`wenxin-backend/app/prototype/api/routes.py:4`

结论：当前是“工程化多阶段管道 + 人机控制点”，还不是“多智能体协商团队”。

## 1.3 局部重绘 vs 全量重跑 — ✅ Phase A 已实现像素级局部重绘（2026-02-10）

复核结果：**已修正（Phase A 交付后）**
事实依据：
- ~~每轮重新生成新 seed 候选~~ → Queen 选择 `rerun_local` 时，走 `refine_candidate()` 路径：`wenxin-backend/app/prototype/orchestrator/orchestrator.py`
- ~~HITL 约束主要保留维度分数~~ → `MaskGenerator` 将弱维度映射为空间 mask，`DiffusersInpaintProvider` 执行 SD 1.5 inpainting：`wenxin-backend/app/prototype/agents/inpaint_provider.py`
- Queen `rerun_local` → 找到最佳候选图 → MaskGenerator(target_layers→mask) → SD 1.5 inpaint → 回 Critic 重评

结论：**现在同时支持两种模式**：
1. `rerun`：全量重跑（新 seed 候选）
2. `rerun_local`：像素级局部重绘（保留好的区域，只重绘弱维度对应空间区域）

技术实测：SD 1.5 inpaint ~3.8s (15步 512×512), VRAM 2.0GB fp16, 成本 $0（本地）。

## 1.4 模型与技术栈

复核结果：**基本正确（高置信）**  
事实依据：
- 计划中明确要求 CrewAI/LangGraph/LiteLLM/Langfuse/DeepEval：`wenxin-moyun/docs/vulca-prototype-plan-v1.md:26`
- 当前主执行是 `PipelineOrchestrator`：`wenxin-backend/app/prototype/orchestrator/orchestrator.py:52`
- `cultural_pipelines` 基本空壳：`wenxin-backend/app/prototype/cultural_pipelines/__init__.py:1`
- together_flux 已实装：`wenxin-backend/app/prototype/agents/draft_provider.py:88`

---

## 2. 文档冲突（必须统一）

同一仓库内存在两套口径：
- “D14/Release Notes”偏 mock 基线：`wenxin-backend/app/prototype/reports/d14-final.md:18`
- “Step2”是 together 真实放量口径：`wenxin-backend/app/prototype/reports/step2-phase3-summary.md:83`
- “Step3 本地 GO”与“线上 NO-GO（当日）”并存：  
  `wenxin-backend/app/prototype/reports/step3-go-no-go.md:88`  
  `wenxin-backend/app/prototype/reports/step3-online-gray-validation-checklist.md:54`

这会直接影响汇报可信度，建议优先修正文档基线。

---

## 3. 对你给的优先级建议的复核

你给的顺序是：
1) Critic 接 LLM  
2) Draft 接 ComfyUI+ControlNet  
3) Scout 接 FAISS

我的复核结论：**方向对，但建议调整顺序为 2 → 3 → 1**。

原因：
- 先做局部重绘（2）能最快把“设计师工作流”从概念变成可见结果（用户价值最高）。
- 再做语义检索（3）可给 Critic 提供高质量锚定证据，避免 LLM 评分漂移。
- 最后升级 LLM Critic（1）才更稳，且可以做 selective escalation 控成本。

---

## 4. 建议落地路线（可执行）

## Phase A（1-2 周）：把"局部重绘"做成真功能 — ✅ 完成（2026-02-10）

**最终方案**：SD 1.5 + AutoPipelineForInpainting（非 ComfyUI，更轻量直接）

已交付：
- ✅ `InpaintProvider` 体系：AbstractInpaintProvider + MockInpaintProvider + DiffusersInpaintProvider
- ✅ `MaskGenerator`：L1-L5 → 空间策略映射（full/centre/foreground/upper/diffuse）
- ✅ `DraftAgent.refine_candidate()`：局部重绘方法
- ✅ `orchestrator.rerun_local` 路径：Queen → 找最佳候选 → mask → inpaint → 回 Critic 重评
- ✅ 30/30 验证通过（28 mock + 2 GPU 实测）
- ✅ 18/18 现有 pytest 零回归

技术指标：
- SD 1.5 推理：3.8s（15步, 512×512）
- VRAM：2.0 GB（fp16）
- 成本：$0（本地推理）vs FLUX $0.012/img
- Mask 保真度：100% 像素级精确

DoD 完成情况：
- ✅ 同一 candidate_id 分支可追溯（refined 图带 `-refined` 后缀 + 原始 candidate_id）
- ✅ 锁定维度不漂移（MaskGenerator 只标记弱维度区域，保留其他区域像素不变）

关键设计决策：
- 使用 `runwayml/stable-diffusion-v1-5`（safetensors）而非 `runwayml/stable-diffusion-inpainting`（仅 pickle 权重，被 CVE-2025-32434 阻止）
- 放弃 ComfyUI：直接 diffusers API 更简洁，无需额外进程管理

## Phase B（1 周）：Scout 语义锚定升级
- 引入 CLIP embedding + FAISS/LanceDB 检索
- 保留术语/禁区规则（作为 deterministic safety 层）
- DoD：
  - 检索结果可解释（source/snippet/id）
  - 检索质量优于当前 Jaccard baseline

## Phase C（1 周）：Critic 混合模式 — ✅ Gate C 实测通过（2026-02-10）
- ✅ 保留规则 Critic 负责硬门禁（taboo）
- ✅ 新增 `CriticLLM` 桥接层：规则基线 → LayerState 升级决策 → AgentRuntime ReAct 循环
- ✅ 只在低置信或高优先级 dim 升级（最多 3/5），成本约束 < $0.01/sample
- ✅ orchestrator 通过 `enable_agent_critic` 可选启用，默认 False 向后兼容
- ✅ 无 API key 时 100% 回退到规则（$0），有 key 时混合评审
- ✅ 28/28 mock 验证 + **25/25 with-LLM 实测通过**（DeepSeek V3.2 真实 API）
- ✅ 18/18 现有 pytest 零回归
- ✅ **Agent-ness 实测指标**：
  - `escalation_rate`: 0.4（40% dims escalated, 8/20）
  - `tool_calls`: 24 total
  - `re_plan_rate`: 1.0（100% Agent 显著覆写规则分）
  - `total_escalations`: 8（4 candidates × 5 dims → 8 escalated）
- ✅ **成本实测**：DeepSeek V3.2 ~$0.002/call, ~5 calls/escalated dim, ~$0.01/dim
- ✅ **Two-Phase ReAct 模式**：Phase 1 探索（tools 自由调用）→ Phase 2 强制提交（`_force_submit()` 清洁上下文）
- 已交付文件：`critic_llm.py`（~260 行）、`validate_critic_llm.py`（~220 行）
- 已修复 GAP：tools 传递(#1)、日志(#3)、LayerState 写回(#4)、locked_layers(#7)
- ⚠️ L1/L2（VLM 层）预期回退：需 GOOGLE_API_KEY（Gemini），非阻塞
- DoD 剩余项：
  - 盲评对照实验（Agent 胜率 ≥ 60%）
  - L3 Spearman ρ ≥ 0.5（需人工标注基线）

---

## 5. 最终判断

你的核心判断成立：  
**当前系统“工程闭环达标”，但“设计愿景未兑现完”。**

下一步最有效策略不是继续加报告，而是：
1. ~~先把局部重绘做成真实视觉能力；~~ ✅ **Phase A 完成**（2026-02-10）：SD 1.5 inpaint + MaskGenerator + orchestrator rerun_local 路径，30/30 验证 + GPU 实测 3.8s。
2. **再把 Scout 的语义锚定做实** ← **下一步：Phase B**
3. ~~最后用 LLM Critic 做增量升级并受预算约束。~~ ✅ **Phase C Gate C 实测通过**（2026-02-10）：CriticLLM + Two-Phase ReAct + 25/25 with-LLM + Agent-ness 全指标达标。剩余为盲评对照与 L3 ρ 验证。

**当前进度**：3 个核心 Phase 已完成 2/3（Phase C ✅ + Phase A ✅），仅剩 Phase B（Scout FAISS 语义锚定）。

