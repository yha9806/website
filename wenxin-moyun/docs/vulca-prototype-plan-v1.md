# VULCA Agent + 生成系统 Prototype 计划 v1.1

> 最后更新：2026-02-07
> 状态：执行版（已统一主方案，含实证修正）
> 目标：先交付可演示原型，再输出可上线预算。

---

## 1. 项目定位

**VULCA 不是通用文生图工具，而是跨文化批评驱动的生成系统。**

核心价值固定为三点：
- Cultural QA：生成前后都有文化一致性问答与校验。
- Cultural Guardrails：L4/L5 作为硬门禁，避免“漂亮但文化错误”。
- Cultural Provenance：输出证据链和可复现参数，不做黑盒结果。

---

## 2. 执行边界与唯一主方案

### 2.1 统一决策（V1.1）

| 维度 | 决策 |
|------|------|
| 编排框架 | **CrewAI Flows（V1 固定）** |
| 状态与回退层 | **LangGraph Checkpoint（time-travel/fork）或等价 checkpoint store** |
| 网关层 | **LiteLLM Gateway（统一路由/回退/预算）** |
| 架构模式 | **轻蜂群 + 模型级联**（不是大规模无上限 swarm） |
| 角色数量 | V1 固定 5 角色：Queen/Scout/Draft/Critic/Archivist |
| 图像执行 | ComfyUI 工作流（V1 可先不启用 Partial Execution） |
| 观测评测 | Langfuse（P0）+ Promptfoo（P1） |

### 2.2 非目标（V1 不做）
- 不做通用 Agent 平台化（不追求 50-100 子 Agent）。
- 不做完整 SaaS 权限计费系统。
- 不做重训练流程（LoRA/全量微调）作为首阶段依赖。

### 2.3 实施原则（降低工作量）

1. 不替换现有主链路，只补齐“状态、路由、观测”三块基础设施。
2. 优先接入现成组件，避免自研通用编排器和通用回退框架。
3. 所有增强按 P0/P1 分层上线，先保证闭环稳定，再追求上限质量。

---

## 3. 交付目标与 DoD（Definition of Done）

### 3.1 Step 1: Working Prototype

交付物：
1. 用户输入主题后，系统输出 2D 候选图（草图 -> 精修）。
2. 每个候选输出 L1-L5 批评卡、风险标签、证据链、参数 JSON。
3. 支持 1-2 轮自动纠偏（基于 L4/L5 门禁）。

验收指标（必须同时满足）：

| 指标 | 门槛 | 测量方式 |
|------|------|----------|
| 固定样例覆盖 | 20 条样例全部可运行 | 回归任务集 |
| L4/L5 通过率 | 首轮 >= 70%，最多 1 轮纠偏后 >= 85% | Critic Gate 统计 |
| 可复现率 | >= 95% | 同输入重复运行对比参数与解释一致性 |
| 已确认维度保留率 | >= 95% | Checkpoint diff（locked 维度前后比对） |
| 局部重跑成本比 | <= 35% | 同任务“局部重跑 vs 全量重跑”成本对照 |
| 跨维漂移率 | <= 10% | 未请求重跑维度的内容差异统计 |
| 单样例成本 | 目标 <= $0.08（级联方案） | 成本日志 |
| P95 时延 | <= 180s | 端到端埋点 |

### 3.2 Step 2: 预算报价文档

交付内容：
1. 成本拆分（LLM、图像生成、存储、人工运维）。
2. 三档预算（最低可行/推荐/增强）。
3. 上线前资源建议（并发、GPU、API 配额）。

---

## 4. 本地可运行基线

### 4.1 硬件现状

| 项目 | 规格 | 评估 |
|------|------|------|
| CPU | i7-10875H (WSL2) | 够用 |
| RAM | 11GB（建议 14GB） | 偏紧 |
| GPU | RTX 2070 Max-Q 8GB VRAM | 关键约束 |

本地生成策略：
- Draft 阶段使用 SD 1.5（优先）。
- SDXL/ControlNet 作为可选，不作为 V1 依赖。
- **云端免费替代**：Together.ai Flux.1 Schnell（免费 API，生产级质量，消除本地 VRAM 依赖）。
- **本地轻量替代**：KOALA-Lightning 700M（NeurIPS 2024，原生 8GB VRAM，4x 快于 SDXL，蒸馏自 SDXL）。

### 4.2 软件前置条件（执行前检查）

1. `Node >= 20.19.4`, `npm >= 10`
2. Python 虚拟环境可用（建议 3.10/3.11）
3. 后端依赖完整安装：
```bash
cd wenxin-backend
./venv/bin/pip install -r requirements.txt -c constraints.txt
```
4. 前端与后端启动：
```bash
cd wenxin-backend && ./venv/bin/python -m uvicorn app.main:app --reload --port 8001
cd wenxin-moyun && npm run dev
```

### 4.3 当前已知阻塞

- 本地曾出现：`ModuleNotFoundError: aiosmtplib`，会导致 `app.main` 导入失败。  
  触发链：`app/services/__init__.py` -> `app/services/email.py`。

---

## 5. V1.1 架构（轻蜂群 + 级联）

```
User Input
  -> Queen (计划/预算/停止条件)
    -> Scout (并行检索文化证据)
    -> Draft (低成本草图)
    -> Critic (L4/L5 门禁 + 纠偏建议)
    -> Archivist (证据链 + 参数 + 日志)
```

角色定义：

| 角色 | 职责 | 默认模型层级 | 硬限制 |
|------|------|--------------|--------|
| Queen | 任务拆解、预算控制、早停 | 中档模型 | 每任务最多 2 轮 |
| Scout | 证据检索、禁区规则、术语对齐 | 低成本模型 | 并行上限 3 |
| Draft | 草图生成（低分辨率） | 本地 SD 1.5 | 每轮最多 6 张 |
| Critic | L4/L5 评分、风险标签（**必须外部锚定**） | 低->中->高 级联 | 高价模型升级率 <= 15% |
| Archivist | 输出批评卡、证据链、参数 JSON | 低成本模型 | 必须落日志 |

### 5.1 Critic Gate 外部锚定机制（实证修正）

> **背景**：RefineBench (arXiv:2511.22173) 实测表明，LLM 纯自我纠偏仅提升 +1.8%。
> TACL 2024 确认：无外部反馈时 LLM 无法有效自我纠正。
> 因此 Critic 不能仅依赖 LLM 判断，必须配备外部锚定工具。

Critic 必须调用以下外部工具，而非纯靠 LLM 输出评分：

| 锚定工具 | 功能 | 实现方式 |
|----------|------|----------|
| VULCA 样本检索 | 从 7,410 样本中检索同主题/同文化 few-shot 对比 | 向量检索（本地 FAISS 或 LanceDB） |
| 术语词典匹配 | 检查输出中的文化术语准确率 | 规则匹配（JSON 词典，¥0 成本） |
| 禁区规则命中 | 检测是否触犯文化禁忌（硬规则） | 正则 + 关键词表（¥0 成本） |
| 结构化 L4/L5 评分 | 基于证据锚点打分，非开放式判断 | DeepEval G-Eval rubric（P0） |
| 视觉分析锚定 | 绘画作品的构图/色彩/笔法分析 | GalleryGPT 或 VLM few-shot（P1） |
| 文化实体查询 | 图像学符号、文化传统关联检索 | Getty IA + Wikidata SPARQL（P1） |

工作流程：
1. Critic 收到 Draft 输出 → 先调用 3 个外部工具获取锚定数据。
2. 将锚定结果（匹配样本、术语命中率、禁区命中）注入 prompt。
3. LLM 基于锚定数据做结构化评分（非自由发挥）。
4. 若 L4/L5 不通过，纠偏建议也必须引用具体证据。

### 5.2 多轮局部回退机制

> **核心问题**：用户在多轮迭代中，可能对部分维度满意、部分不满意。
> 全部重跑浪费 60-80% token 且引发已确认维度的"漂移"。
> 需要保留已确认部分，仅重跑不满意的部分。

> **学术依据**：
> - ReAgent (EMNLP 2025, arXiv:2503.06951)：本地/全局双层可逆推理，GPT-4o 基线上超越 O1/O3。
> - SagaLLM (VLDB 2025, arXiv:2503.11951)：将分布式事务 Saga 模式引入 LLM Agent，每个操作配对补偿操作。
> - LangGraph Checkpoint：time-travel + fork，支持从任意历史节点分支重跑。

**用户交互流程**：

```
用户输入主题 → 系统生成 L5→L1 全维度评估
  → 用户查看结果
  → "L3 的文化关联分析很好，但 L5 的哲学深度不够"
  → 系统锁定 L3，仅重跑 L5（L3 结果作为硬约束注入）
  → 用户再次查看 → 确认或继续迭代
```

**每轮自动 Checkpoint**：

```python
@dataclass
class RoundCheckpoint:
    checkpoint_id: str              # UUID
    parent_id: str | None           # 支持 fork 分支
    round: int                      # 第几轮
    dimensions: dict[str, DimensionState]   # L1-L5 各维度状态

@dataclass
class DimensionState:
    status: Literal["pending", "generated", "confirmed", "rejected"]
    content: Any                    # 该维度的生成结果
    locked: bool                    # 用户是否已确认锁定
    model_used: str                 # 生成该维度时使用的模型
    prompt_hash: str                # 输入 prompt 的 hash（用于可复现）
    evidence_refs: list[str]        # 证据引用列表
```

**三层锁定策略**：

| 层级 | 触发方式 | 效果 |
|------|----------|------|
| 显式锁定 | 用户主动确认（"L3 很好"） | L3 结果冻结，重跑其他维度时作为硬约束注入 prompt |
| 依赖锁定 | L5 依赖 L3，L3 已被锁 | 重跑 L5 时 L3 输出作为不可变上下文传入 |
| 软锁定 | 用户未提及的维度 | 作为软约束传入 prompt，防止无关维度漂移 |

**级联处理规则**：
- 修改低层维度（如 L1 视觉感知）时，所有依赖它的上层未锁定维度标记为 `stale`。
- 系统提示用户决定：保留已锁定维度 / 解锁全部重跑 / 逐一选择。
- 已锁定维度不会被级联影响，除非用户显式解锁。

**选择性重跑的 Prompt 注入**：
```
【硬约束 — 不可改变】
L3 文化语境分析（用户已确认）：{locked_L3_content}

【软约束 — 保持一致】
L1 视觉感知：{L1_content}
L2 技术分析：{L2_content}

【重新生成目标】
请重新分析 L5 哲学美学层面，要求哲学深度显著提升，
同时与已确认的 L3 文化语境保持呼应。
```

**成本收益**：局部重跑 1 个维度 ≈ 全部重跑的 20-25%（含约束注入的额外 token 开销）。

### 5.3 人类创作者行为模型

> **核心理念**：将人类画家、设计师、艺术批评家的真实工作流步骤，
> 嵌入为 Agent 内部的运行逻辑和通信协议。
> 系统不是"AI 生成黑盒"，而是模拟人类创作者的思维过程。

> **调研来源**：
> - 概念艺术 12 阶段模型 (Neil Blevins, 2025)
> - Feldman 四步批评法 (Description→Analysis→Interpretation→Judgment)
> - Panofsky 图像学三层 (Pre-Iconographic→Iconographic→Iconological)
> - 跨文化创作差异（中国画"意在笔先"、水彩不可逆、油画 Fat-over-Lean 层叠法）

**统一 8 阶段创作-批评流水线**：

| # | 阶段 | 对应人类行为 | Agent 角色 | 可回退 |
|---|------|-------------|-----------|--------|
| 1 | Intent（立意） | 构思 / 灵感收集 / 解读 brief | Queen | Yes |
| 2 | Reference（取材） | 参考素材检索 / 情绪板 | Scout | Yes |
| 3 | Anchor（定锚） | 意在笔先 / L5 哲学锚定 | Queen + Scout | Yes |
| 4 | Sketch（起稿） | 缩略草图 / 构图研究 | Draft | Yes |
| 5 | Critique（评审） | 形式分析 + 图像学分析 | Critic（外部锚定） | Yes |
| 6 | Refine（精修） | 基于评审反馈纠偏 | Draft + Critic | Yes |
| 7 | Verify（终审） | 最终校验 / 价值判断 | Critic 二次验证 | No* |
| 8 | Archive（归档） | 题款钤印 / 输出证据链 | Archivist | No |

*阶段 7-8 标记为"不可逆"——一旦归档即为最终版本，修改需新建轮次。

**文化路由**（不同文化传统使用不同流水线变体）：

| 文化传统 | 流水线变体 | 关键特征 |
|----------|-----------|----------|
| 中国写意 | Intent→Reference→Anchor→**原子执行**→Critique | "一气呵成"：预规划完毕后打包为原子事务 |
| 中国工笔 | Intent→Reference→Anchor→Sketch→Layer1..N→Critique | 多层精细叠加，每层可独立回退 |
| 西方学院派 | Intent→Reference→Sketch→**明暗研究→色彩研究**→渲染→Critique | 经典 Value Study→Color Study 两步 |
| 伊斯兰几何 | Intent→**圆分割→网格构建→图案推导→镶嵌**→Critique | 纯算法驱动，确定性最高 |
| 水彩 | Intent→Reference→Sketch→**不可逆渲染**→Critique | 从亮到暗不可逆，执行前必须 checkpoint |
| 默认 | Intent→Reference→Anchor→Sketch→Critique→Refine→Verify→Archive | 完整 8 阶段 |

**V1 范围控制（避免复杂度爆炸）**：
1. 首批仅启用 `默认 / 中国写意 / 西方学院派` 三条变体。
2. 其余变体先保留为模板，不进入自动路由。
3. 通过 20 条样例回归后，再逐步开放更多文化变体。

**Agent 间通信消息格式**：

```python
@dataclass
class ArtifactMessage:
    stage: str                    # 当前阶段名
    artifact_type: str            # "sketch" | "critique" | "evidence" | "rendering"
    content: Any                  # 阶段产出物
    cultural_context: str         # 文化传统标识
    constraints: list[str]        # 约束标签：如 "irreversible", "fat_over_lean"
    confidence: float             # 0-1 置信度
    reversible: bool              # 该步骤是否可回退
    parent_artifact_id: str       # 上游依赖
    locked_dimensions: list[str]  # 已锁定的维度列表（传递给下游）
```

**与局部回退的集成**：
- 每个阶段完成后自动创建 Checkpoint。
- 用户可在任意阶段暂停查看，确认满意的维度后继续。
- 回退时跳回目标阶段的 Checkpoint，已锁定维度作为约束传入。
- 不可逆阶段（7-8）执行前自动触发 Critic 预审，预审不通过则阻止执行。

### 5.4 技术栈落地映射（直接减少工作量）

| 能力 | 推荐栈 | 在本项目中的职责 | 预计收益 |
|------|--------|------------------|----------|
| 角色编排 | CrewAI Flows | 五角色流程与人工确认节点 | 少写编排样板代码 |
| 状态回退 | LangGraph Checkpoint | 维度级 checkpoint / fork / replay | 少写状态机与恢复逻辑 |
| 模型网关 | LiteLLM Gateway | 多供应商路由、统一回退、预算限额 | 少写多家 SDK glue code |
| 图像局部执行 | ComfyUI Partial Execution | 只重跑受影响节点 | 降低无效渲染与重跑成本 |
| 观测评测 | Langfuse + Promptfoo | Trace/成本追踪 + 自动回归评测 | 缩短定位和验收时间 |

**补充工具栈（可直接减少自研工作量）**：

| 能力 | 推荐栈 | 在本项目中的职责 | 优先级 |
|------|--------|------------------|--------|
| 评分引擎 | DeepEval G-Eval | L1-L5 结构化 rubric 评分，替代自研评分逻辑 | P0 |
| 视觉分析 | GalleryGPT（ACM MM 2024 Oral） | 绘画构图/色彩/笔法分析，Critic 视觉锚定 | P1 |
| 评测架构参考 | Evaluation-Agent（ACL 2025 Oral + SAC Award） | 多轮 promptable 评测框架，与 VULCA L1-L5 对齐 | 参考 |
| 引用评估 | ALCE（arXiv:2305.14627） | 证据链可追溯性评估（Archivist 输出质量） | P1 |
| 文化知识库 | Getty IA + Wikidata SPARQL | 图像学符号查询、文化实体关联（Scout 增强） | P1 |
| 图像生成（免费） | Together.ai Flux.1 Schnell | V1 原型期间零成本图像生成，替代本地 SD 1.5 | P0 备选 |
| 图像生成（本地轻量） | KOALA-Lightning 700M | 原生 8GB VRAM，4x 快于 SDXL，离线可用 | P1 备选 |
| Demo UI | Daggr（Gradio team, 2026.01） | 多步骤 DAG 可视化 + 单节点重跑，替代纯 Gradio | P1 |
| 成本优化 | Anthropic Prompt Caching | 缓存 system prompt 90% 折扣，降低 Critic 成本 | P0 |
| 批量优化 | OpenAI Batch API | 非实时任务 50% 成本折扣（回归评测适用） | P1 |

V1 接入顺序（防止一次性过载）：
1. **P0（必须）**：CrewAI Flows + LiteLLM + Checkpoint + Langfuse + DeepEval G-Eval + Prompt Caching。
2. **P1（增强）**：Promptfoo 自动评测 + ComfyUI Partial Execution + Getty IA/Wikidata + Daggr Demo。
3. **P2（v1.2）**：RouteLLM MF 分类器 + GalleryGPT 视觉锚定 + 更细粒度路由策略。

---

## 6. 成本模型（假设 + 公式 + 实测）

### 6.1 成本假设（V1 默认）

| 项目 | 默认值 |
|------|--------|
| 样例集 | 20 条固定样例 |
| 最大迭代轮次 | 2 轮 |
| 草图数 | 每轮 6 张，最多保留 2 张进精修 |
| Critic 数 | 2 个并行 |
| Opus 升级比例 | 目标 <= 15% |
| 缓存命中率（初期） | 20-40% |

### 6.2 成本公式

```text
TaskCost = LLMCost + ImageCost + StorageCost

LLMCost = sum_i((input_tokens_i / 1e6) * in_price_i + (output_tokens_i / 1e6) * out_price_i)
ImageCost = draft_count * draft_unit_cost + refine_count * refine_unit_cost
StorageCost = output_images * avg_size * storage_price
```

说明：
- 本文中的金额是目标区间，不作为最终报价。
- Step 2 只认实测日志，不认估算口径。

### 6.3 预算区间（用于排期，不用于签约）

| 场景 | 20 条样例预算 | 特征 |
|------|---------------|------|
| Baseline（高价模型为主） | $2.5-$5.0 | 快但不省钱 |
| 推荐（级联蜂群） | **$0.6-$1.6** | 成本/质量平衡 |
| 极限降本（本地优先） | $0-$0.6 | 质量波动风险高 |

---

## 7. 预算护栏参数（必须上线前配置）

建议默认值：
1. `MAX_ITERATIONS = 2`
2. `MAX_SCOUT_PARALLEL = 3`
3. `MAX_DRAFT_PER_ROUND = 6`
4. `MAX_REFINE = 2`
5. `MAX_OPUS_RATE = 0.15`
6. `MAX_COST_PER_TASK = $0.10`
7. `DAILY_BUDGET_CAP = $5`（prototype 阶段）

升级与降级规则：
- 当 `L4/L5 < gate_threshold` 且 `critic disagreement > threshold` 时允许升级模型。
- 当接近预算上限时，自动降级到低成本模式并减少草图数。

### 7.1 动态降级顺序（固定执行）

当 `task_cost >= 0.8 * MAX_COST_PER_TASK` 时，按顺序逐级降级（命中即停）：
1. `MAX_SCOUT_PARALLEL: 3 -> 2 -> 1`
2. `MAX_DRAFT_PER_ROUND: 6 -> 4 -> 2`
3. 关闭高价复核（仅保留 1 个 Critic）
4. 模型降级一档（如 Sonnet -> mini/haiku）
5. 图像分辨率降级（仅保留草图与 text-only critique）

若执行到第 5 步仍超预算，返回 `budget_soft_fail`，并保留当前最佳结果供用户选择“继续付费重跑”或“接受当前版本”。

### 7.2 路由策略（实证修正）

> **背景**：RouteLLM (ICLR 2025) 验证有效的路由器是 BERT 级别的矩阵分解分类器，
> 而非通用 3B LLM。通用小模型做路由无生产级证据。
> VULCA 的文化主题是有限集合（8 个文化传统 × 有限主题类型），适合规则路由。

V1 路由方案（按优先级）：

| 方案 | 原理 | 成本 | 可靠性 | 适用阶段 |
|------|------|------|--------|----------|
| 规则路由（V1 首选） | 关键词/主题匹配，文化传统分类 | ¥0 | 100% | V1 立即可用 |
| RouteLLM MF 分类器 | 轻量矩阵分解，ICLR 2025 验证 | 极低 | 高 | V1.2 可选增强 |
| 通用 3B LLM | ~~作为路由器~~ | - | - | **不采用**（无生产证据） |

规则路由实现示例：
```python
def route_model(task_type: str, cultural_tradition: str, complexity: str) -> str:
    """基于任务类型和文化传统的规则路由"""
    # 高复杂度或跨文化对比 → 中档模型
    if complexity == "high" or "cross-cultural" in task_type:
        return "claude-sonnet"
    # 简单术语/证据检索 → 低成本模型
    if task_type in ["terminology", "evidence_retrieval"]:
        return "deepseek-v3"
    # 默认 → 低成本模型
    return "deepseek-v3"
```

---

## 8. 回退与容错策略

| 失败场景 | 自动回退 | 结果影响 |
|----------|----------|----------|
| LLM 超时/429 | **按回退链自动切换**（见 8.1） | 质量轻微下降，流程不中断 |
| 图像生成失败 | 回退到 text-only critique + 参数保留，标记可重跑 | 不中断验收链路 |
| Critic 结论冲突大 | 触发一次高阶复核（仅 1 次） | 增加少量成本 |
| 无证据可追溯 | 结果降级为"不通过" | 强制防止幻觉上线 |

### 8.1 基础设施回退链（Provider Failover）

> **背景**：DeepSeek 过去一年有 63+ 次服务中断记录，不能作为唯一依赖。
> 必须设计自动回退链保证流程不中断。

回退链（按成本从低到高）：

```
DeepSeek V3（主力，$0.028/M input）
  ↓ 超时 >10s 或 HTTP 5xx
GPT-4o-mini（回退 1，$0.15/M input，自动切换）
  ↓ 同样失败
Claude Haiku（回退 2，$1/M input，最后保底）
```

触发条件：
- **超时**：单次请求 >10s 未响应，自动切换到下一级。
- **HTTP 5xx**：服务端错误，立即切换（不重试）。
- **HTTP 429**：限流，延迟 2s 重试 1 次，仍失败则切换。
- **连续失败**：同一供应商 3 次连续失败，本任务剩余请求全部走下一级。

### 8.2 语义局部回退链（用户不满意时）

触发条件：
- 用户明确指出“不满意维度”（例如仅 L5 不满意，L3 已确认）。
- 或系统检测到 `跨维漂移率 > 10%`。

执行流程：
1. 读取最近可用 checkpoint，锁定 `confirmed` 维度。
2. 仅对目标维度重跑，并注入已锁定内容为硬约束。
3. 运行后计算 `已确认维度保留率 / 局部重跑成本比 / 跨维漂移率`。
4. 若不达标，自动回滚到父 checkpoint，并触发一次模型升级重试。
5. 仍失败则交给用户二选一：接受当前结果 / 解锁更多维度后重跑。

原则：
- 8.1 处理“服务可用性问题”，8.2 处理“语义质量问题”。
- 两类回退链互不替代，但共享同一 checkpoint 日志体系。

---

## 9. 执行计划（20-28 天）

| # | 任务 | 工期 | 依赖 |
|---|------|------|------|
| 1 | 定义 Cultural Intent Card schema | 2 天 | 无 |
| 2 | 建立素材库与证据索引 | 3 天 | #1 |
| 3 | 搭建 CrewAI 5 角色骨架 | 2 天 | #1 |
| 4 | 跑通本地 Draft（SD 1.5） | 2 天 | 无 |
| 5 | 实现 Scout -> Draft -> Critic 闭环 | 4 天 | #2-4 |
| 6 | 接入级联路由 + 预算护栏 | 3 天 | #5 |
| 7 | 接入 Archivist（证据链+参数+日志） | 2 天 | #5 |
| 8 | Gradio demo 页面与脚本 | 3 天 | #6-7 |
| 9 | 20 样例回归与调参 | 3 天 | #8 |
| 10 | Step 2 预算文档 | 2 天 | #9 |

---

## 10. 风险与合规

### 10.1 技术风险

| 风险 | 影响 | 控制 |
|------|------|------|
| 8GB VRAM 边界 | SDXL 组合受限 | V1 锁 SD 1.5，云端仅作增强 |
| 多角色调试成本 | 排障慢 | 固定 5 角色，不做动态爆炸扩展 |
| 成本漂移 | 超预算 | Queen 强制预算护栏 + 日报 |
| LLM 自纠偏失效 | Critic 判断不可靠 | 外部锚定工具（§5.1），不依赖纯 LLM 自我修正 |
| DeepSeek 服务中断 | 流程阻塞 | 三级回退链（§8.1）：DeepSeek → GPT-4o-mini → Haiku |
| 多弱模型混合质量不稳定 | 输出不一致 | 采用 Self-MoA（同模型多次采样）而非混合多弱模型 |

### 10.2 实证依据（V1.1 新增）

| 来源 | 发现 | 对本项目的影响 |
|------|------|----------------|
| RefineBench (arXiv:2511.22173) | LLM 自纠偏仅 +1.8% | Critic 必须外部锚定 |
| TACL 2024 | 无外部反馈时 LLM 无法自我纠正 | 同上 |
| Self-MoA (arXiv:2502.00674) | 单强模型多次 > 多弱模型混合，+6.6% | 优先 Self-MoA 策略 |
| RouteLLM (ICLR 2025) | BERT 级分类器路由有效，非通用 LLM | 规则路由优先 |
| DeepSeek 运维记录 | 63+ 次/年服务中断 | 必须设计回退链 |
| ReAgent (EMNLP 2025, arXiv:2503.06951) | 双层可逆推理超越 O1/O3 约 6% | 局部回退机制的理论基础 |
| SagaLLM (VLDB 2025, arXiv:2503.11951) | Saga 事务补偿 + 依赖图管理 | 维度级 checkpoint 的工程参考 |
| GalleryGPT (ACM MM 2024 Oral) | 绘画视觉分析专用模型 | Critic 视觉锚定工具 |
| Evaluation-Agent (ACL 2025 Oral + SAC Award) | 多轮 promptable 评测框架 | L1-L5 结构化评测架构参考 |
| DeepEval G-Eval | LLM-as-judge 结构化 rubric 评分 | 替代自研 L4/L5 评分逻辑 |
| KOALA-Lightning (NeurIPS 2024) | 700M 参数，8GB VRAM，4x 快于 SDXL | 本地轻量图像生成替代方案 |

### 10.3 合规风险

1. 参考图与馆藏素材必须有使用许可记录。
2. 所有生成结果保留来源与提示词快照。
3. 用户输入与日志脱敏存储，不落敏感个人信息。

---

## 11. 版本路线

| 版本 | 目标 | 变化 |
|------|------|------|
| v1.1（当前） | 可演示、可复现、可控成本 | 固定 5 角色 + CrewAI |
| v1.2 | 提升稳定性与质量 | 优化 Critic Gate、缓存与回归 |
| v2 | 强图控制与复杂流程 | 评估迁移 LangGraph + 更多节点 |

---

## 12. Day 1-Day 14 执行拆解（基于 v1.1）

### 12.1 两周目标

1. 跑通 `Queen -> Scout -> Draft -> Critic -> Archivist` 最小闭环。
2. 形成 20 条固定样例的首轮成本与质量基线。
3. 确保 Step 1 的核心 DoD 指标有可追踪数据。

### 12.2 每日计划（D1-D14）

| Day | 当日目标 | 关键动作 | 当日交付 | 通过标准 |
|-----|----------|----------|----------|----------|
| D1 | 环境就绪 | 修复后端依赖、确认前后端可启动 | 启动记录 + 依赖清单 | 后端/前端均可运行 |
| D2 | Schema 固化 | 完成 `Cultural Intent Card` JSON schema | `intent_card.schema.json` | 3 条示例均通过 schema 校验 |
| D3 | 素材准备 | 建立文化术语、禁区规则、参考作品最小库 | 初版素材库 | 可检索 8 个文化传统核心条目 |
| D4 | Scout 实装 | 实现证据检索与术语对齐接口 | Scout API/函数 | 召回结果可返回来源和片段 |
| D5 | Draft 跑通 | 接通 SD 1.5 草图流（低分辨率） | Draft 产图链路 | 单请求可稳定出 4-6 张草图 |
| D6 | Critic v1 | 实现 L4/L5 打分与风险标签 | Critic 评分输出 | 能给出通过/不通过和原因 |
| D7 | Queen v1 | 加预算护栏、轮次控制、早停机制 | Queen 控制器 | 超预算可自动降级/停止 |
| D8 | 闭环串联 | 连通 Scout -> Draft -> Critic -> Queen | 首条端到端样例 | 1 条样例全链路成功 |
| D9 | Archivist v1 | 输出证据链、批评卡、参数 JSON | 日志与输出模板 | 每次运行均有可复现记录 |
| D10 | 回退链实装 | 接入 LLM 回退链和错误策略 | fallback 逻辑 | 模拟 429/超时可自动切换 |
| D11 | Demo 接口 | 组装 Gradio 页面与任务入口 | Demo 页可操作版本 | 可输入主题并看到阶段状态 |
| D12 | 10 条样例回归 | 批量跑前 10 条固定样例 | 中间评测报告 | 通过率和成本有统计数据 |
| D13 | 20 条样例回归 | 跑满 20 条并调优阈值 | 完整回归报告 | 达到或接近 DoD 门槛 |
| D14 | 封版与总结 | 固化参数、整理 Step 2 输入数据 | v1.1 prototype 总结包 | 输出预算输入表 + 风险清单 |

### 12.3 每日固定输出模板

1. `Done`：今天完成项（最多 5 条，必须可验证）。
2. `Metrics`：成本、时延、通过率、回退次数。
3. `Blockers`：阻塞项与预计解决时间。
4. `Next`：明日 3 个最高优先级动作。

### 12.4 两周验收门槛（Gate）

| Gate | 时间点 | 必过条件 |
|------|--------|----------|
| Gate A | D7 结束 | 五角色中至少四角色可单独运行；预算护栏生效 |
| Gate B | D10 结束 | 回退链可用；端到端样例成功率 >= 70% |
| Gate C | D14 结束 | 20 样例完成；DoD 指标有实测数据；可产出 Step 2 输入 |

### 12.5 若延期的降级策略

1. 暂停 Persona 扩展，仅保留五角色主链。
2. 暂停高阶图控（ControlNet/IP-Adapter），先保稳定闭环。
3. 先提交 10 样例版报告，再补齐 20 样例。

### 12.6 技术栈接入节奏（对应 P0/P1）

| 阶段 | 时间窗 | 必做项 | 可延后项 |
|------|--------|--------|----------|
| P0 | D1-D10 | CrewAI Flows、LiteLLM、Checkpoint、Langfuse 埋点 | Promptfoo、ComfyUI Partial Execution |
| P1 | D11-D14 | Promptfoo 自动回归、ComfyUI 局部执行 | RouteLLM MF 分类器 |
| v1.2 | D15+ | RouteLLM MF、细粒度路由 A/B | 更多文化变体自动路由 |

执行约束：
1. 每天最多新增 1 个基础设施组件，避免排障耦合。
2. 新组件接入当天必须补 1 条端到端样例回归。
3. 若当天回归失败率 > 30%，立即冻结新接入，优先修复主链。

---

## 附录 A：可变参数说明

为避免文档快速过时，以下信息不写死为结论：
1. 各模型单价（按供应商实时价格表更新）。
2. 开源项目 star 数（仅供参考，不作为决策依据）。
3. 第三方框架性能结论（必须以本项目实测为准）。

---

## 附录 B：参考资源

- CrewAI: https://github.com/crewAIInc/crewAI
- LangGraph: https://github.com/langchain-ai/langgraph
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python
- CascadeFlow: https://github.com/lemony-ai/cascadeflow
- RouteLLM: https://lmsys.org/blog/2024-07-01-routellm/
- Anthropic Prompt Caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- ComfyUI: https://github.com/comfyanonymous/ComfyUI
- IP-Adapter: https://github.com/tencent-ailab/IP-Adapter
- ControlNet: https://arxiv.org/abs/2302.05543
- DeepSeek API: https://api-docs.deepseek.com/
- Qwen: https://huggingface.co/Qwen
- VULCA-Bench: arXiv:2601.07986
- Art Critique: arXiv:2601.07984
- RefineBench: arXiv:2511.22173 (LLM 自纠偏实证)
- Self-MoA: arXiv:2502.00674 (单模型多采样 > 多模型混合)
- RouteLLM: ICLR 2025 (模型路由验证)
- TACL 2024: LLMs Cannot Self-Correct Without External Feedback
- ReAgent: arXiv:2503.06951 (EMNLP 2025, 可逆多 Agent 推理)
- SagaLLM: arXiv:2503.11951 (VLDB 2025, Saga 事务补偿)
- Feldman Art Criticism Model (四步批评法: Description→Analysis→Interpretation→Judgment)
- Panofsky Iconographic Analysis (图像学三层: Pre-Iconographic→Iconographic→Iconological)
- ComfyUI Partial Execution: https://docs.comfy.org/interface/features/partial-execution
- LangGraph Time Travel: https://docs.langchain.com/oss/python/langgraph/use-time-travel
- CrewAI Flows: https://docs.crewai.com/concepts/flows
- LiteLLM Docs: https://docs.litellm.ai/docs/
- Langfuse Docs: https://langfuse.com/docs
- Promptfoo Docs: https://www.promptfoo.dev/docs/intro/
- Arize Phoenix: https://arize.com/docs/phoenix
- OpenAI Prompt Caching: https://platform.openai.com/docs/guides/prompt-caching
- OpenAI Batch API: https://platform.openai.com/docs/guides/batch
- OpenAI Background mode: https://platform.openai.com/docs/guides/background
- Anthropic Message Batches: https://docs.anthropic.com/en/docs/build-with-claude/message-batches
- Anthropic Rate Limits: https://docs.anthropic.com/en/api/rate-limits
- Diffusers ControlNet: https://huggingface.co/docs/diffusers/en/using-diffusers/controlnet
- Diffusers IP-Adapter: https://huggingface.co/docs/diffusers/en/using-diffusers/ip_adapter
- GalleryGPT: https://github.com/BinZhu-ece/GalleryGPT (ACM MM 2024 Oral, 绘画视觉分析)
- Evaluation-Agent: arXiv:2501.12708 (ACL 2025 Oral + SAC Award, 多轮 promptable 评测)
- DeepEval: https://github.com/confident-ai/deepeval (G-Eval rubric 评分框架)
- ALCE: arXiv:2305.14627 (引用与证据链评估基准)
- KOALA-Lightning: NeurIPS 2024 (700M 蒸馏模型, 8GB VRAM)
- Together.ai Flux.1 Schnell: https://api.together.xyz/playground/image (免费图像生成 API)
- Daggr: https://github.com/gradio-app/daggr (Gradio 团队, 多步骤 DAG 可视化)
- Getty Iconography Authority: https://www.getty.edu/research/tools/vocabularies/
- Wikidata SPARQL: https://query.wikidata.org/ (文化实体关联查询)
