# VULCA Prototype 深度检索审计报告（2026-02-10）

## 1. 审计目的与范围

本报告用于回答一个核心问题：  
**当前 VULCA Prototype 的“设计蓝图”与“实际落地”差距到底在哪里，哪些结论可信，哪些是版本混淆。**

审计范围：
- 设计总文档：`wenxin-moyun/docs/vulca-prototype-plan-v1.md`
- 实现代码：`wenxin-backend/app/prototype/**`
- 阶段报告：`wenxin-backend/app/prototype/reports/step2-*`、`step3-*`、`d14-final.md`、`prototype-release-notes.md`

---

## 2. 一页结论（Executive Summary）

1. **你的判断大方向正确**：当前系统是“可运行、可验证”的 5-agent 原型，但尚未达到 v1.1 计划中的完整技术栈与文化创作流程深度。
2. **5 角色骨架已完整落地**：Scout/Draft/Critic/Queen/Archivist + API/SSE/HITL 已可跑通。  
3. **并非纯 mock**：Step 2 已完成 together_flux 真实调用放量验证（320 tasks，90% pass，P95 ~10.7s，$0.0132/task）。  
4. **核心差距仍明显**：CrewAI/LangGraph/LiteLLM/Langfuse/DeepEval-GEval 等计划关键组件未成为执行主链路；文化路由与 8 阶段创作模型未工程化。  
5. **文档存在“版本叠层”冲突**：D14/Release Notes 偏 mock 口径；Step2 报告是 together 真实口径；Step3 本地 GO 与线上 NO-GO（2026-02-09）同时存在。

---

## 3. 设计 vs 实现审计矩阵（核心条目）

| 设计项（v1.1） | 证据（设计） | 现状（实现） | 结论 |
|---|---|---|---|
| 5 角色固定 | `vulca-prototype-plan-v1.md:30` | Orchestrator 串联 5 阶段 | 已实现 |
| CrewAI Flows 固定 | `vulca-prototype-plan-v1.md:26` | 主链路为 `PipelineOrchestrator` | 未按计划栈实现 |
| LangGraph checkpoint（time-travel/fork） | `vulca-prototype-plan-v1.md:27`, `:169` | JSON checkpoint + resume，无 fork/time-travel 机制 | 部分实现（能力降级） |
| LiteLLM Gateway | `vulca-prototype-plan-v1.md:28` | `FallbackProvider` 自研链路 | 未按计划栈实现 |
| Langfuse + Promptfoo | `vulca-prototype-plan-v1.md:32`, `:303` | 代码主链路无观测 SDK 接入 | 未实现 |
| DeepEval G-Eval 评分 | `vulca-prototype-plan-v1.md:150`, `:309` | Critic 为规则引擎；**CriticLLM 混合模式已实现**（2026-02-10） | 部分实现 |
| Critic 外部锚定（向量检索+词典+禁区） | `vulca-prototype-plan-v1.md:147-150` | 词典+禁区+样本检索有；检索是 Jaccard/tag，加权非向量库 | 部分实现 |
| 8 阶段创作流水线 | `vulca-prototype-plan-v1.md:242-253` | 当前主流程为 Scout→Draft→Critic→Queen→Archivist | 未实现 |
| 文化路由变体 | `vulca-prototype-plan-v1.md:257-266` | `cultural_pipelines` 仅 `__init__.py` | 基本未实现 |
| 双回退机制 | `vulca-prototype-plan-v1.md:160+` | 基础设施 fallback 有；HITL 局部重跑/锁维度已接入 | 部分实现 |

---

## 4. 关键证据（代码与报告）

### 4.1 已落地的能力

- 统一编排与阶段执行：`wenxin-backend/app/prototype/orchestrator/orchestrator.py:153-184`, `:205-267`, `:268+`, `:393+`
- HITL 事件与动作（含 `lock_dimensions`、`force_accept`）：  
  `wenxin-backend/app/prototype/orchestrator/orchestrator.py:347-384`  
  `wenxin-backend/app/prototype/api/routes.py:166-170`
- API + SSE：`wenxin-backend/app/prototype/api/routes.py:4-7`, `:120-156`
- 样本检索为规则/Jaccard，而非向量库：`wenxin-backend/app/prototype/tools/sample_matcher.py:77-103`
- Critic 为规则化确定性评分：`wenxin-backend/app/prototype/agents/critic_rules.py:1`, `:27-35`, `:97-160`
- real provider（Together FLUX）已实装：`wenxin-backend/app/prototype/agents/draft_provider.py:88-183`

### 4.2 与计划偏差的直接证据

- 计划要求 CrewAI/LangGraph/LiteLLM/Langfuse/DeepEval：  
  `wenxin-moyun/docs/vulca-prototype-plan-v1.md:26-32`, `:299-303`, `:309`, `:321`
- 文化 8 阶段与路由变体：  
  `wenxin-moyun/docs/vulca-prototype-plan-v1.md:242-266`
- `cultural_pipelines` 实际为空壳：`wenxin-backend/app/prototype/cultural_pipelines/__init__.py:1`
- 依赖文件有计划栈，但主链路未体现：`wenxin-backend/requirements.prototype.txt:5-14`

### 4.3 “不是纯 mock”的直接证据

- Phase 3 真实运行稳定：  
  `wenxin-backend/app/prototype/reports/step2-phase3-summary.md:18-23`, `:83-90`, `:94`
- 回归报告显示 together 与 mock 对照：  
  `wenxin-backend/app/prototype/reports/step2-regression-report.md:12-14`, `:49-58`
- Critic 暂不升级是有意决策，不是遗漏：  
  `wenxin-backend/app/prototype/reports/step2-critic-upgrade-decision.md:8`, `:25-31`, `:70-80`

---

## 5. 文档冲突与可信度分层

### A. 高可信（反映当前系统能力）
- `step2-phase3-summary.md`
- `step2-regression-report.md`
- `step3-design-vs-implementation.md`（但有“仅本地”前提）
- 代码本身（`app/prototype/**`）

### B. 中可信（历史阶段结论，需标注时间）
- `d14-final.md`（mock口径）
- `prototype-release-notes.md`（Step2 前后语义不同步）

### C. 待确认（环境依赖）
- 线上可用性状态：`step3-online-gray-validation-checklist.md:54-63` 显示 2026-02-09 当时线上 NO-GO；需重新在线复测确认当前是否仍如此。

---

## 6. 当前系统应如何准确定义（建议对外口径）

建议口径：
> VULCA 当前版本是一个“已跑通全栈闭环的 5-agent 原型系统”，在真实图像 provider 上完成了稳定性与成本验证；其差异化核心（跨文化路由、8阶段创作模型、LLM-as-judge、统一观测网关）仍处于设计或部分实现阶段，尚未完成产品级落地。

---

## 7. 优先级建议（从“架构演示”走向“设计兑现”）

1. **P0：统一“单一真相文档”**  
   合并 D14/Step2/Step3 的冲突表述，固定“当前状态 + 已验证边界 + 未实现项”。
2. **P0：线上状态复测**  
   重新验证 `/api/v1/prototype/*` 是否已部署（修复 2026-02-09 的线上 NO-GO 不确定性）。
3. **P1：先补 Critic 外部锚定缺口**  
   在现有规则链上接入真正向量检索（FAISS/LanceDB）+证据引用质量评价。
4. **P1：文化路由最小落地**  
   至少实现 3 条可执行路由（默认/中国写意/西方学院派），不要只传 `tradition` 参数。
5. **P2：评分引擎升级试点** — ✅ 基础设施已完成（2026-02-10）
   `CriticLLM` 混合模式已实现：规则基线 + 选择性 Agent 升级（最多 3/5 dim）。
   28/28 验证通过，orchestrator 已集成（`enable_agent_critic=True`）。
   **待完成**：API key 实测 + 盲评对照实验 + 成本回填。

---

## 8. 审计结论（Final）

- 你的核心判断“**骨架已跑通，但设计创新未完全落地**”是成立的。  
- 需要修正的是“全 mock”这点：Step 2 已有真实 together_flux 放量证据。  
- 当前最重要的工程任务不是继续堆功能，而是先完成**状态统一（文档与线上）+ 核心差异化能力兑现（文化路由与锚定评分）**。

