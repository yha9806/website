# VULCA Prototype 计划 v1.1（精简执行版）

> 基于 `vulca-prototype-plan-v1.md` 压缩整理  
> 日期：2026-02-07  
> 目标：14 天内做出可演示、可复现、可控成本的原型

## 1. 核心定位（不变）

- VULCA 不是通用文生图，而是“跨文化批评驱动生成系统”。
- 三个卖点：  
  `Cultural QA`（前后校验） / `Cultural Guardrails`（L4/L5 硬门禁） / `Cultural Provenance`（证据链可追溯）。

## 2. V1.1 唯一主方案

- 五角色固定：`Queen / Scout / Draft / Critic / Archivist`。
- 编排与基础设施：
  - `CrewAI Flows`：角色流程
  - `Checkpoint（LangGraph 或等价存储）`：局部回退
  - `LiteLLM Gateway`：统一路由/回退/预算
  - `Langfuse`：成本与链路观测
- 图像侧：V1 先以 `SD 1.5` 跑通；8GB 显存不强依赖 SDXL。
- 原则：不重构主链路，只补齐“状态、网关、观测”。

## 3. 关键流程（最小闭环）

`User -> Queen -> Scout -> Draft -> Critic -> Archivist`

- Critic 必须“外部锚定”再评分（不能只靠 LLM 自评）：
  - 样本检索（FAISS/LanceDB）
  - 术语字典命中
  - 禁区规则命中
  - 结构化 L4/L5 rubric 评分

## 4. 双回退机制（这是产品差异化）

1. 基础设施回退（可用性）：  
   `DeepSeek -> GPT-4o-mini -> Claude Haiku`（超时/5xx/429 自动切换）。
2. 语义局部回退（质量）：  
   锁定用户确认维度，只重跑不满意维度；失败可回滚父 checkpoint。

核心指标：
- 已确认维度保留率 `>= 95%`
- 局部重跑成本比 `<= 35%`
- 跨维漂移率 `<= 10%`

## 5. 成本与护栏

- 单样例目标：`<= $0.08`
- Prototype 日预算：`$5`
- 默认限制：`MAX_ITERATIONS=2`、`MAX_SCOUT_PARALLEL=3`、`MAX_DRAFT_PER_ROUND=6`
- 超预算动态降级：先减并行和草图，再降模型，最后退到 text-only critique。

## 6. 两周执行（D1-D14）

- D1-D3：环境、schema、术语/禁区/素材库。
- D4-D7：Scout、Draft、Critic、Queen（预算与早停）。
- D8-D10：端到端闭环 + 回退链。
- D11-D14：Demo、20 条样例回归、封版与预算输入。

Gate：
- `D7`：至少 4 个角色可单跑，预算护栏生效
- `D10`：回退链可用，E2E 成功率 >= 70%
- `D14`：20 样例完成，DoD 指标可量化

## 7. V1 范围控制（防止失控）

- 文化流程变体首批只开 3 条：`默认 / 中国写意 / 西方学院派`。
- 其余变体保留模板，不进自动路由。
- 延期时先砍：高阶图控、额外 Persona、非关键基础设施。

## 8. 现在就开工的最小清单

1. 先修复本地阻塞：`aiosmtplib` 导入问题。  
2. 先打通 1 条 E2E 样例（含证据链和参数 JSON）。  
3. 接入 Checkpoint + LiteLLM + Langfuse。  
4. 用 10 条样例先做中期回归，再扩到 20 条。  

