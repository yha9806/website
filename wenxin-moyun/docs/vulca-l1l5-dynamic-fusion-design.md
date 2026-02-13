# VULCA L1-L5 动态融合架构设计

> 日期：2026-02-10（v2.2 修订，整合联网复核版工程规格）
> 定位：v2 计划的核心技术创新，VULCA Agent 的差异化特征
> 前提：L1-L5 来自 VULCA-Bench (arXiv:2601.07986, Yu et al.)
> 工程约束来源：`l1-l5-dynamic-fusion-design-2026-02-10.md`（联网复核版）
>
> **实现状态同步（2026-02-10 更新，Phase A+B+C+D 全部完成）**：
> - 文档中的动态融合机制是目标架构，当前已完成核心子集。
> - ✅ 已落地+接入主链：`layer_state.py` / `tool_registry.py` / `model_router.py` / `agent_runtime.py` / `critic_llm.py` / `inpaint_provider.py` / `faiss_index_service.py` / `cultural_pipelines/`
> - ✅ FC 闭环已打通：orchestrator → CriticLLM → AgentRuntime → tools → LayerState 写回
> - ✅ 局部重绘已落地：MaskGenerator + SD 1.5 inpaint + orchestrator rerun_local（Phase A 完成）
> - ✅ FAISS 语义检索已落地：all-MiniLM-L6-v2 + IndexFlatIP，evidence_coverage 计算并传播（Phase B 完成）
> - ✅ 选择性升级已落地：CriticLLM 最多升级 3/5 dim（基于 should_escalate），25/25 实测通过
> - ✅ 文化路由已落地：9 传统权重表 + 3 管道变体（default/chinese_xieyi/western_academic），96/96 Gate D（Phase D 完成）
> - ⬜ 未实现：渐进深化（L1→L5 串行 + accumulated_context）
> - ⬜ 未实现：跨层信号实际执行（CrossLayerSignal 数据结构有，反哺轮逻辑未接入）
> - ⬜ 未实现：动态权重调制（compute_dynamic_weights）—— 仅用固定查表，未实现置信度/轮次/信号调制
> - ⬜ 未实现：CognitiveStateGraph 全图贯穿 pipeline

---

## 0. 核心问题

**当前 v2 计划中的 L1-L5 是"静态分配"**：每个 Agent 被预先指定在哪个 L 层工作，权重是固定的查表值。

这不够。真正的跨文化批评不是 5 个独立维度的平行评分——而是**5 层递进认知的动态交互**。

真实的艺术批评过程中：
- **看到构图后才能判断技法**（L1 → L2 依赖）
- **理解文化背景后重新审视视觉**（L3 → L1 反哺）
- **哲学洞见改变对技法的评价**（L5 → L2 重估）
- **不同传统中，层级的重要性会随作品状态动态变化**

**设计目标**：让 L1-L5 成为一个**动态认知引擎**——层级之间有信息流动、权重会随上下文自适应调整、每个阶段的 L 参与度取决于当前认知状态。

---

## 1. 设计灵感与学术基础

### 1.1 Panofsky 层级的"不可跳过性"

Panofsky 图像学三层模型的核心洞见不是"有三个维度"，而是**层级之间有严格的认知依赖**：

```
Pre-Iconographic (看到什么)
  └─ 必须先完成 ──→ Iconographic (看到的意味着什么)
                       └─ 必须先完成 ──→ Iconological (深层文化意义)
```

你无法在不理解构图的情况下评价技法，也无法在不理解文化背景的情况下做哲学批评。

**映射到 L1-L5**：
```
L1 (Visual) ──依赖链──→ L2 (Technical) ──→ L3 (Cultural) ──→ L4 (Critical) ──→ L5 (Aesthetic)
     ↑                        ↑                    ↑                               │
     └────────── 反哺链 ───────┴────────────────────┴───────────────────────────────┘
```

这不是 5 个并行维度。这是一个**有向图**。

### 1.2 中国传统建筑多 Agent 生成系统（Nature, 2025）

> 参考：[Multi-agent collaborative pathways for Chinese traditional architectural image generation](https://pmc.ncbi.nlm.nih.gov/articles/PMC12494968/)

关键启发：
- Assessment Agent 输出**结构化 error flags**（如"屋顶样式错误"、"符号不匹配"），而非单一总分
- Workflow Scheduler 基于 error flags **诊断根因**后动态路由——是回到语义理解层、还是回到生成层
- 文化知识库作为"全系统核心支撑"，每个 Agent 通过标准化接口查询

**我们可以借鉴的**：L1-L5 评分不应只是数字——应该是结构化的"认知报告"，包含发现、证据、置信度、和对其他层的影响建议。

### 1.3 MAJ-EVAL 多维度自适应评审（2025）

> 参考：[When AIs Judge AIs: Agent-as-a-Judge](https://arxiv.org/html/2508.02994v1)

关键启发：
- 从领域文档中**自动提取**评估维度，而非预设
- 每个维度创建一个独立 persona，各自给出评分后**交叉讨论**
- 讨论过程中维度之间会**相互影响**权重

**我们可以借鉴的**：Critic-L3 的评审结果应该能影响 Critic-L5 的提问方式；Critic-L1 的发现应该改变 Draft-Refine 的修改策略。

### 1.4 动态权重自适应（ICLR 2025, MDPI 2025）

> 参考：[Multi-Task Dynamic Weight Optimization Based on DRL](https://www.mdpi.com/2076-3417/15/5/2473)、[Learning to Optimize Multi-Objective Alignment Through Dynamic Reward Weighting](https://arxiv.org/html/2509.11452v1)

关键启发：
- 用 Actor-Critic 架构**在线学习**最优权重分配
- 权重不是静态查表，而是根据当前任务状态和历史反馈动态调整
- 引入时间注意力机制建模权重的时序变化

**我们可以借鉴的**：L1-L5 权重不应该只按传统查表，还应该根据当前轮次的评分分布、弱维度模式、和修改历史动态调整。

### 1.5 LFMDiff 动态 Rank/Alpha 机制（npj Heritage Science, 2025）

> 参考：[LFMDiff: Generation of Chinese traditional landscape paintings](https://www.nature.com/articles/s40494-025-02136-5)

关键启发：
- 在 LoRA 微调中使用**动态 rank 和动态 alpha**机制
- 自适应地在"容易学的特征"和"复杂特征"之间分配模型容量
- 全局构图用低 rank，局部纹理细节用高 rank

**我们可以借鉴的**：不同 L 层在不同创作阶段需要不同的"精度"——构图阶段 L1 高精度 / L5 低精度，精修阶段反转。

---

## 2. 动态融合架构：三个核心机制

### 机制一：L 层认知状态图（Cognitive State Graph）

**核心思想**：系统维护一个实时更新的 L1-L5 认知状态图，记录每个 L 层当前的"认知完成度"和"置信度"，以及层级之间的依赖和影响关系。

```python
@dataclass
class LayerState:
    """单个 L 层的动态状态（合并认知+运维字段）"""
    layer: str                        # "L1" ~ "L5"

    # ─── 认知字段 ───
    score: float | None = None        # 当前评分 [0, 1]（None = 尚未评审）
    confidence: float = 0.0           # 置信度 [0, 1]（评分可靠程度）
    evidence_coverage: float = 0.0    # 证据覆盖率 [0, 1]（检索+锚定的充分程度）
    volatility: float = 0.0           # 跨轮波动 [0, 1]（历轮分数标准差归一化）
    insights: list[str] = field(default_factory=list)       # 认知发现
    evidence_ids: list[str] = field(default_factory=list)   # 锚定证据 ID（可溯源）
    blockers: list[str] = field(default_factory=list)       # 依赖阻塞项

    # ─── 运维字段 ───
    locked: bool = False              # 是否被锁定（HITL 或高置信自动锁定）
    escalated: bool = False           # 是否已升级到高成本评审
    cost_spent_usd: float = 0.0       # 该层累计花费

    # ─── 跨层信号 ───
    influence_on: dict[str, str] = field(default_factory=dict)  # 对其他层的影响建议
    pending_signals: list["CrossLayerSignal"] = field(default_factory=list)  # 待处理信号

    @property
    def priority(self) -> float:
        """动态调度优先级（值越大越需要关注）"""
        if self.locked or self.score is None:
            return 0.0
        risk = max(self.volatility, 1.0 - self.evidence_coverage)
        return (1.0 - self.score) * (1.0 - self.confidence) * risk


@dataclass
class CognitiveStateGraph:
    """L1-L5 认知状态全图"""
    layers: dict[str, LayerState]
    dependency_edges: list[tuple[str, str, float]]  # (from, to, strength)
    current_focus: list[str]           # 当前阶段重点关注的 L 层
    dynamic_weights: dict[str, float]  # 实时权重（非固定查表）
    round_num: int
    tradition: str
    budget_remaining_usd: float = 5.0  # 剩余预算

    def compute_layer_budgets(self, alpha: float = 2.0) -> dict[str, float]:
        """按优先级 softmax 分配预算（向低分/低置信/高风险层倾斜）"""
        import math
        priorities = {k: v.priority for k, v in self.layers.items()}
        # softmax 归一化
        max_p = max(priorities.values()) if priorities else 0
        exp_p = {k: math.exp(alpha * (v - max_p)) for k, v in priorities.items()}
        total = sum(exp_p.values())
        if total == 0:
            return {k: self.budget_remaining_usd / 5 for k in self.layers}
        return {k: self.budget_remaining_usd * v / total for k, v in exp_p.items()}
```

**与现有代码的映射**：

| 新字段 | 当前代码对应 | 差异 |
|--------|------------|------|
| `score` | `DimensionScore.score` | 相同 |
| `confidence` | 无 | **新增**：规则评分 confidence=1.0，LLM 评分 ≤ 0.9 |
| `evidence_coverage` | 无（仅 `evidence_count`） | **新增**：= min(hits / expected_hits, 1.0) |
| `volatility` | 无 | **新增**：= std(历轮分数) / 0.5，用于检测震荡 |
| `locked` | `PlanState.human_locked_dimensions` | 升级：从 list → 每层 bool |
| `escalated` | 无 | **新增**：记录是否已用过 LLM Judge |
| `cost_spent_usd` | `BudgetState.total_cost_usd`（全局） | 升级：按层分账 |
| `evidence_ids` | 无 | **新增**：每条证据可溯源 |
| `priority` | 无 | **新增**：动态调度公式 |

**关键区别**：当前代码里 L1-L5 只有 `DimensionScore(dimension, score, rationale)`。
动态方案里每层是一个**完整状态机**：score + confidence + evidence_coverage + volatility + locked + escalated + cost + 跨层信号。

### 机制二：跨层信息流（Cross-Layer Information Flow）

**核心思想**：L 层之间不是孤立的。高层发现会"反哺"低层，低层的充分完成会"解锁"高层。

```
┌─────────────────────────────────────────────────────────────┐
│                  L1-L5 认知状态图                             │
│                                                             │
│  L1 ──依赖──→ L2 ──依赖──→ L3 ──依赖──→ L4 ──依赖──→ L5   │
│  ↑              ↑              ↑                       │    │
│  │              │              │                       │    │
│  └── 反哺 ──────┴── 反哺 ──────┴──────── 反哺 ─────────┘    │
│                                                             │
│  依赖链（向右）：低层完成解锁高层评审                         │
│  反哺链（向左）：高层洞见改变低层的评价和修改策略              │
│                                                             │
│  示例：                                                     │
│  L3 发现"此画使用了禅宗留白" → 反哺 L1："留白不是构图缺陷"  │
│  L5 发现"道家虚实相生"意境 → 反哺 L2："模糊笔法是有意为之"  │
│  L1 发现"非标准透视" → 向右传导 L2："技法分析需考虑散点透视" │
└─────────────────────────────────────────────────────────────┘
```

**具体实现**：每个 Critic-L 评审完后，除了输出分数，还输出一个 `cross_layer_signals` 结构：

```python
@dataclass
class CrossLayerSignal:
    """跨层信号：一个 L 层对另一个 L 层的认知影响"""
    source_layer: str       # 信号来源层（如 "L3"）
    target_layer: str       # 影响目标层（如 "L1"）
    signal_type: str        # "reinterpret" | "unlock" | "boost" | "suppress"
    message: str            # "留白是禅宗美学的有意选择，不应视为构图缺陷"
    weight_adjustment: float  # 建议的权重调整方向（+0.05 = 增加目标层权重）
```

**信号类型**：

| 信号类型 | 含义 | 示例 |
|---------|------|------|
| `reinterpret` | 高层发现要求重新解读低层 | L5→L1："虚实相生意味着留白是美学选择" |
| `unlock` | 低层充分完成后解锁高层 | L1→L3："构图已确认为山水范式，可以评估文化符号" |
| `boost` | 跨层发现增强某层重要性 | L3→L5："发现强烈的道家象征，L5 哲学评审应重点关注" |
| `suppress` | 跨层发现降低某层重要性 | L1→L2："构图极简，技法分析的重要性降低" |

### 机制三：动态权重与预算调度（Dynamic Weight & Budget Allocation）

**核心思想**：L1-L5 的权重和资源分配不是固定查表，而是由**四个因子**共同决定。
同时，预算按层优先级动态倾斜——"低分/低置信/高风险层"获得更多预算。

#### 3.1 动态权重公式

```
最终权重 = f(传统基线, 置信度调制, 跨层信号累积, 轮次递进)
```

```python
def compute_dynamic_weights(
    tradition: str,
    graph: CognitiveStateGraph,
    cross_signals: list[CrossLayerSignal],
    round_num: int,
) -> dict[str, float]:
    """计算当前轮次的动态 L1-L5 权重"""

    # 1. 传统基线权重（查表，作为锚点）
    base = TRADITION_WEIGHTS[tradition]  # e.g., {"L1": 0.10, ..., "L5": 0.30}

    # 2. 置信度调制：置信度低的层，权重暂时降低（信息不充分时不强行评分）
    confidence_mod = {}
    for layer, state in graph.layers.items():
        if state.confidence < 0.3:
            confidence_mod[layer] = -0.05  # 置信度极低，权重临时降低
        elif state.confidence > 0.8:
            confidence_mod[layer] = +0.02  # 置信度高，权重略增
        else:
            confidence_mod[layer] = 0.0

    # 3. 跨层信号累积：其他层的 boost/suppress 影响
    signal_mod = {f"L{i}": 0.0 for i in range(1, 6)}
    for signal in cross_signals:
        signal_mod[signal.target_layer] += signal.weight_adjustment

    # 4. 轮次递进：首轮低层权重略高，后续轮高层递增
    round_mod = {}
    for layer in ["L1", "L2", "L3", "L4", "L5"]:
        n = int(layer[1])
        round_mod[layer] = (3 - n) * 0.02 if round_num == 1 else (n - 3) * 0.02

    # 5. 合成并归一化
    raw = {}
    for layer in ["L1", "L2", "L3", "L4", "L5"]:
        raw[layer] = base[layer] + confidence_mod[layer] + signal_mod[layer] + round_mod[layer]
        raw[layer] = max(0.05, raw[layer])  # 最低 5%，不会完全忽略任何层

    total = sum(raw.values())
    return {k: v / total for k, v in raw.items()}  # 归一化到 1.0
```

#### 3.2 层级优先级公式（驱动调度和升级）

```python
# 已内嵌在 LayerState.priority 属性中
priority_d = w_d(tradition, round) × (1 - score_d) × (1 - confidence_d) × risk_d

# 其中 risk_d = max(volatility_d, 1 - evidence_coverage_d)
```

**含义**：优先级最高的层 = 权重大 + 分数低 + 置信度低 + 风险高。
这同时驱动：
- **升级触发**：priority > τ_escalate → 触发 LLM Judge
- **预算分配**：预算按 softmax(priority) 分配，向弱层倾斜
- **修改排序**：Refine 优先修改 priority 最高的层

#### 3.3 升级触发条件（Selective Escalation）

```python
def should_escalate(layer: str, state: LayerState, graph: CognitiveStateGraph) -> bool:
    """决定是否将某层从规则评审升级到 LLM 评审"""

    # 必跑层：L3/L5 始终升级
    if layer in ("L3", "L5"):
        return True

    # 优先级触发
    if state.priority > TAU_ESCALATE:  # 默认 0.15
        return True

    # 双 Judge 分歧触发
    if state.judge_disagreement > TAU_DISAGREE:  # 默认 0.3
        return True

    # 证据不足触发
    if state.evidence_coverage < TAU_COVERAGE:  # 默认 0.3
        return True

    return False

TAU_ESCALATE = 0.15    # 优先级阈值
TAU_DISAGREE = 0.30    # 双 Judge 分歧阈值
TAU_COVERAGE = 0.30    # 证据覆盖率阈值
```

#### 3.4 预算分配公式

```
B_d = B_remaining × softmax(α × priority_d)
```

```python
# 已内嵌在 CognitiveStateGraph.compute_layer_budgets() 方法中
# α=2.0: 中等倾斜度，α 越大预算越集中在最弱层
```

**与现有代码的映射**：当前 `BudgetState` 只跟踪全局 `total_cost_usd`。
动态方案按层分账，让 Queen 看到"花了多少钱在 L3 上"→ 决策更精确。

---

## 3. 动态融合在每个阶段的具体运作

### 3.0 Queen-Intent 阶段：结构化意图 + 预算规划 ★ 新增前置

```python
@dataclass
class IntentCardV2:
    """Queen 解析后的结构化创作意图"""
    # ─── 创作意图 ───
    subject: str                          # "Dong Yuan landscape"
    tradition: str                        # "chinese_xieyi"
    style_ref: str                        # "Dong Yuan hemp-fiber strokes"
    l5_anchor: str                        # "远山含黛 — 朦胧中见深远的道家意境"
    difficulty: str                       # "easy" | "medium" | "hard"

    # ─── v2.2 新增：调度规划 ───
    target_profile: dict[str, float]      # 传统权重模板（初始 w_d）
    must_pass_layers: list[str]           # 强制门禁层（如 ["L3", "L5"]）
    budget_plan: dict[str, float]         # 每层预算上限（初始估算）
    pipeline_variant: str                 # "default" | "chinese_xieyi" | "western_academic"
```

**与现有代码的映射**：当前 `QueenDecision` 只输出 `action` + `rerun_dimensions`。
IntentCardV2 让 Queen 在 pipeline 开始前就规划好"哪些层必过、预算怎么分"。

### 3.1 Scout 阶段：认知状态初始化 + 层级感知检索

```
输入：IntentCardV2 + tradition
输出：ScoutEvidence（按 L 标注） + 初始 CognitiveStateGraph

Scout 不再是"收集一堆证据然后丢给 Critic"。
Scout 的职责是**初始化认知状态图**——每个 L 层的信息是否充分。
```

**动态行为**：

```python
def scout_with_cognitive_init(intent_card: IntentCardV2, tradition: str):
    graph = CognitiveStateGraph(tradition=tradition)

    # Scout-L1: 视觉参考检索（CLIP + FAISS）
    visual_refs = faiss_visual_search(intent_card.subject, top_k=5)
    graph.layers["L1"].evidence_coverage = min(len(visual_refs) / 5, 1.0)
    graph.layers["L1"].evidence_ids = [r.id for r in visual_refs]

    # Scout-L3: 文化证据检索（术语 + FAISS + Wikidata）
    term_hits = terminology_search(tradition, intent_card.subject)
    sample_matches = faiss_text_search(intent_card.subject, tradition)
    taboo = taboo_check(intent_card.subject, tradition)
    graph.layers["L3"].evidence_coverage = min((len(term_hits) + len(sample_matches)) / 8, 1.0)
    graph.layers["L3"].evidence_ids = [t.id for t in term_hits] + [s.id for s in sample_matches]

    # Scout-L5: 哲学定锚
    if intent_card.l5_anchor:
        phil_refs = faiss_text_search(intent_card.l5_anchor, "philosophy")
        phil_summary = deepseek_summarize(phil_refs)
        graph.layers["L5"].evidence_coverage = 0.6 if phil_refs else 0.2
        graph.layers["L5"].evidence_ids = [r.id for r in phil_refs]

    # 动态决策：如果 L3 证据不足，追加检索
    if graph.layers["L3"].evidence_coverage < 0.4:
        # 证据不足 → 扩大检索范围（放宽 tradition 约束）
        extra = faiss_text_search(intent_card.subject, "general")
        graph.layers["L3"].evidence_ids += [r.id for r in extra]
        graph.layers["L3"].evidence_coverage = min(graph.layers["L3"].evidence_coverage + 0.2, 1.0)
        graph.layers["L3"].insights.append("L3 证据不足，已扩大检索范围")

    # 设置依赖边
    graph.dependency_edges = [
        ("L1", "L2", 0.8),   # L2 强依赖 L1
        ("L2", "L3", 0.5),   # L3 中等依赖 L2
        ("L3", "L4", 0.7),   # L4 强依赖 L3
        ("L3", "L5", 0.6),   # L5 中等依赖 L3
        ("L1", "L5", 0.3),   # L5 弱依赖 L1（美学需要视觉基础）
    ]

    return evidence, graph
```

### 3.2 Draft 阶段：按认知状态调整生成策略

```
输入：ScoutEvidence + CognitiveStateGraph
输出：候选图 × N + 更新的 CognitiveStateGraph

Draft 读取认知状态图，根据当前各层的完成度决定生成策略。
```

**动态行为**：

```python
def draft_with_cognitive_awareness(evidence, graph, round_num):

    # 首轮：重点关注 L1-L2（确保基本构图和技法）
    if round_num == 1:
        graph.current_focus = ["L1", "L2"]
        prompt_strategy = "structure_first"
        # Compose 权重高，Style 权重低（先把形状画对）
        compose_weight = 0.7
        style_weight = 0.3

    # 后续轮：根据认知状态图的弱层动态调整
    else:
        weak_layers = [
            layer for layer, state in graph.layers.items()
            if state.score is not None and state.score < 0.5
        ]
        graph.current_focus = weak_layers

        if "L3" in weak_layers:
            # L3 弱 → 增强文化符号的 prompt 权重
            prompt_strategy = "cultural_emphasis"
            # ControlNet inpaint 重点修改文化符号区域
        elif "L5" in weak_layers:
            # L5 弱 → 增强意境/氛围的 prompt 权重
            prompt_strategy = "atmosphere_emphasis"
            # IP-Adapter 微调整体情绪
        elif "L1" in weak_layers:
            # L1 弱 → 构图问题，全量重来
            prompt_strategy = "composition_reset"

    # 跨层影响应用：如果 L5 有 reinterpret 信号影响 L1
    for signal in graph.pending_signals:
        if signal.target_layer == "L1" and signal.signal_type == "reinterpret":
            # L5 说"留白是美学选择" → 修改 negative prompt，不再惩罚空白区域
            negative_prompt = remove_keyword(negative_prompt, "empty", "blank")
            graph.layers["L1"].insights.append(
                f"L5 反哺：{signal.message} → 调整构图评价标准"
            )

    candidates = generate(prompt, negative_prompt, strategy=prompt_strategy)
    return candidates, graph
```

### 3.3 Critic 阶段：渐进深化 + 跨层对话

**这是动态融合最核心的部分。**

Critic 不是 5 个并行评分器——而是一个**渐进深化的对话过程**：

```
Step 1: L1 评审 → 输出发现 + 跨层信号
Step 2: L2 评审（读取 L1 发现）→ 输出发现 + 跨层信号
Step 3: L3 评审（读取 L1+L2 发现）→ 输出发现 + 跨层信号（可能反哺 L1）
Step 4: L4 评审（读取 L1-L3 发现）→ 输出发现
Step 5: L5 评审（读取 L1-L4 发现 + 哲学锚定）→ 输出发现 + 反哺信号
Step 6: 反哺轮（可选）：L5 的反哺信号是否需要重新评审 L1/L2？
```

```python
def critic_progressive_deepening(candidate, evidence, graph: CognitiveStateGraph):
    """渐进深化的 L1-L5 评审（含选择性升级 + 证据溯源 + 双 Judge 分歧检测）"""

    all_signals = []
    accumulated_context = {}

    # ─── Step 1: L1 视觉感知 ───
    # 先跑规则 Critic（$0），再决定是否升级 LLM
    l1_rule = critic_rule_l1(candidate, evidence.visual_refs)
    graph.layers["L1"].score = l1_rule.score
    graph.layers["L1"].confidence = 1.0  # 规则评分置信度=1.0

    if should_escalate("L1", graph.layers["L1"], graph):
        l1_llm = critic_llm_l1(candidate, evidence.visual_refs)
        # 双 Judge 分歧检测
        disagreement = abs(l1_rule.score - l1_llm.score)
        if disagreement > TAU_DISAGREE:
            graph.layers["L1"].insights.append(
                f"双 Judge 分歧 {disagreement:.2f}，标记待人工审核"
            )
        graph.layers["L1"].score = l1_llm.score  # LLM 评分优先
        graph.layers["L1"].confidence = min(0.9, 1.0 - disagreement)
        graph.layers["L1"].escalated = True
        graph.layers["L1"].cost_spent_usd += 0.01

    l1_result = CriticLayerResult(
        score=graph.layers["L1"].score,
        confidence=graph.layers["L1"].confidence,
        evidence_citation_ids=graph.layers["L1"].evidence_ids,  # ★ 证据溯源
    )
    accumulated_context["L1"] = l1_result

    # L1 可能发出信号
    if l1_result.findings.get("non_standard_perspective"):
        all_signals.append(CrossLayerSignal(
            source_layer="L1", target_layer="L2",
            signal_type="reinterpret",
            message="检测到非标准透视（可能是中国画散点透视），L2 技法分析应考虑",
            weight_adjustment=0.0,
        ))

    # ─── Step 2: L2 技法分析（读取 L1 发现）───
    l2_result = critic_l2(
        candidate, evidence.terminology,
        prior_context=accumulated_context,  # L2 看到 L1 的发现
    )
    accumulated_context["L2"] = l2_result
    graph.layers["L2"].score = l2_result.score

    # ─── Step 3: L3 文化语境（读取 L1+L2，可能反哺）───
    l3_result = critic_l3(
        candidate, evidence.cultural_refs,
        prior_context=accumulated_context,
    )
    accumulated_context["L3"] = l3_result
    graph.layers["L3"].score = l3_result.score

    # L3 的关键反哺：文化语境改变视觉评价
    if l3_result.findings.get("intentional_emptiness"):
        all_signals.append(CrossLayerSignal(
            source_layer="L3", target_layer="L1",
            signal_type="reinterpret",
            message=f"留白是{graph.tradition}传统的美学选择，不是构图缺陷",
            weight_adjustment=+0.03,  # 提升 L1 权重（视觉评价需重新校准）
        ))

    if l3_result.findings.get("strong_cultural_symbols"):
        all_signals.append(CrossLayerSignal(
            source_layer="L3", target_layer="L5",
            signal_type="boost",
            message="检测到强烈文化符号系统，L5 哲学评审应重点分析其深层含义",
            weight_adjustment=+0.05,
        ))

    # ─── Step 4: L4 批评解读 ───
    l4_result = critic_l4(candidate, accumulated_context)
    accumulated_context["L4"] = l4_result
    graph.layers["L4"].score = l4_result.score

    # ─── Step 5: L5 哲学美学（综合所有层）───
    l5_result = critic_l5(
        candidate, evidence.philosophy_anchor,
        prior_context=accumulated_context,  # L5 看到 L1-L4 的全部发现
    )
    accumulated_context["L5"] = l5_result
    graph.layers["L5"].score = l5_result.score

    # L5 的关键反哺
    if l5_result.findings.get("philosophical_reframing"):
        all_signals.append(CrossLayerSignal(
            source_layer="L5", target_layer="L2",
            signal_type="reinterpret",
            message=l5_result.findings["philosophical_reframing"],
            # 例如："道家'拙朴'美学意味着粗糙笔法可能是刻意追求"
            weight_adjustment=+0.03,
        ))

    # ─── Step 6: 反哺轮（条件触发）───
    reinterpret_signals = [s for s in all_signals if s.signal_type == "reinterpret"]

    if reinterpret_signals and _should_reinterpret(reinterpret_signals, graph):
        # 有重要的反哺信号 → 重新评审受影响的层
        for signal in reinterpret_signals:
            target = signal.target_layer
            old_score = graph.layers[target].score

            # 重新评审时，注入反哺信号作为上下文
            new_result = re_evaluate_layer(
                target, candidate, evidence,
                reinterpretation_context=signal.message,
                prior_context=accumulated_context,
            )
            graph.layers[target].score = new_result.score
            graph.layers[target].insights.append(
                f"反哺重评：{old_score:.2f} → {new_result.score:.2f}（因 {signal.source_layer} 信号）"
            )

    # ─── 动态权重计算 ───
    dynamic_weights = compute_dynamic_weights(
        graph.tradition, graph, all_signals, graph.round_num
    )

    weighted_total = sum(
        dynamic_weights[f"L{i}"] * graph.layers[f"L{i}"].score
        for i in range(1, 6)
    )

    return CritiqueResult(
        scores=graph.layers,
        dynamic_weights=dynamic_weights,
        weighted_total=weighted_total,
        cross_signals=all_signals,
        cognitive_graph=graph,
    )
```

### 3.4 Queen 阶段：认知状态驱动的智能决策 ★ 核心升级

决策目标从"是否 rerun"升级为**"rerun 什么、花多少钱、改哪里、预期增益多大"**。

```python
@dataclass
class QueenDecisionV2:
    """v2.2 升级版 Queen 决策"""
    action: str              # "accept" | "rerun_local" | "rerun_global" | "reject" | "downgrade"
    target_layers: list[str]      # 本轮要修复的层
    preserve_layers: list[str]    # 必须保持不退化的层
    region_plan: dict[str, str]   # 每层对应修改策略
    expected_gain_per_cost: float # 预期增益/成本比（> 1.0 才值得 rerun）
    strategy: str                 # 修改策略名
    dynamic_weights: dict[str, float]
    reason: str = ""


def queen_cognitive_decision(critique_result, plan_state, budget):
    """基于认知状态图做决策，而非仅看总分"""

    graph = critique_result.cognitive_graph
    signals = critique_result.cross_signals

    # 1. 认知完成度检查：是否所有层都有足够信息？
    incomplete_layers = [
        layer for layer, state in graph.layers.items()
        if state.evidence_coverage < 0.4 and not state.locked
    ]
    if incomplete_layers:
        return QueenDecisionV2(
            action="rerun_local",
            target_layers=incomplete_layers,
            preserve_layers=[l for l in graph.layers if l not in incomplete_layers],
            region_plan={l: "expand_scout" for l in incomplete_layers},
            expected_gain_per_cost=_estimate_gain(graph, incomplete_layers),
            strategy="expand_scout",
            reason=f"认知不完整：{incomplete_layers} 的证据不足",
        )

    # 2. 反哺冲突检查
    conflicting = _find_conflicts(graph, signals)
    if conflicting:
        target = [c.target_layer for c in conflicting]
        return QueenDecisionV2(
            action="rerun_local",
            target_layers=target,
            preserve_layers=[l for l in graph.layers if l not in target],
            region_plan={l: "reinterpret" for l in target},
            expected_gain_per_cost=_estimate_gain(graph, target),
            strategy="reinterpret_first",
            reason=f"跨层认知冲突：{conflicting}",
        )

    # 3. 弱层模式识别 + rerun_local vs rerun_global 分流
    weak_pattern = _classify_weakness_pattern(graph)
    weak_layers = [l for l, s in graph.layers.items() if s.score and s.score < 0.5]
    strong_layers = [l for l, s in graph.layers.items() if s.locked or (s.score and s.score >= 0.6)]

    match weak_pattern:
        case "surface_weak":       # L1/L2 弱 → 结构层失真 → 全量重跑
            action = "rerun_global"
            strategy = "composition_reset"
            region_plan = {l: "full_regenerate" for l in weak_layers}
        case "culture_weak":       # L3 弱 → 局部重绘
            action = "rerun_local"
            strategy = "cultural_inpaint"
            region_plan = {"L3": "mask_inpaint_symbols"}
        case "depth_weak":         # L4/L5 弱 → 意境微调
            action = "rerun_local"
            strategy = "atmosphere_refine"
            region_plan = {"L5": "ip_adapter_mood"}
        case "cross_layer_gap":    # 低层好但高层差
            action = "rerun_local"
            strategy = "bridge_layers"
            region_plan = {l: "targeted_enhancement" for l in weak_layers}
        case "all_strong":
            action = "accept"
            strategy = "accept"
            region_plan = {}

    # 4. 文化管道覆盖
    if graph.tradition == "chinese_xieyi" and action == "rerun_local":
        action = "rerun_global"  # 写意画不做局部修改
        strategy = "composition_reset"
        region_plan = {l: "full_regenerate" for l in weak_layers}

    # 5. 成本效益检查
    gain = _estimate_gain(graph, weak_layers)
    cost = _estimate_cost(graph, region_plan)
    gain_per_cost = gain / max(cost, 0.001)

    if gain_per_cost < 1.0 and action.startswith("rerun"):
        # 预期增益不足以覆盖成本 → 降级或接受
        if graph.budget_remaining_usd < cost:
            action = "downgrade"
        else:
            action = "accept"  # 接受当前结果

    return QueenDecisionV2(
        action=action,
        target_layers=weak_layers,
        preserve_layers=strong_layers,
        region_plan=region_plan,
        expected_gain_per_cost=gain_per_cost,
        strategy=strategy,
        dynamic_weights=critique_result.dynamic_weights,
    )
```

**与现有代码的映射**：

| v2.2 新增 | 当前代码 | 差异 |
|-----------|---------|------|
| `rerun_local` / `rerun_global` | 仅 `"rerun"` | **拆分**：局部 vs 全量两条执行链 |
| `preserve_layers` | `human_locked_dimensions` | 升级：不只人工锁定，自动锁定高置信层 |
| `region_plan` | 无 | **新增**：每层对应修改方式（mask/inpaint/ip_adapter） |
| `expected_gain_per_cost` | 无 | **新增**：成本效益驱动决策 |

### 3.5 Refine 阶段：局部重绘协议 + 认知状态指导 ★ 核心升级

#### 3.5.1 LocalRerunRequest 协议

```python
@dataclass
class LocalRerunRequest:
    """局部重绘请求（由 Queen rerun_local 决策生成）"""
    base_candidate_id: str                 # 在哪张图上修改
    target_layers: list[str]               # 要修复的层
    preserve_layers: list[str]             # 必须保持不退化的层
    mask_specs: list[MaskSpec]             # 每层的修改区域
    prompt_delta: str                      # 增量提示词（只描述要改的部分）
    negative_delta: str                    # 增量负面提示词
    structure_constraints: dict            # 结构保持约束


@dataclass
class MaskSpec:
    """单个层的修改区域规格"""
    layer: str                             # 对应的 L 层
    mask_path: str | None                  # mask 文件路径（None = 自动生成）
    strength: float                        # 修改强度 [0, 1]（0.3=轻微, 0.8=大幅）
    mode: str                              # "inpaint" | "ip_adapter" | "controlnet_depth"
```

#### 3.5.2 验收硬指标

| 指标 | 阈值 | 含义 |
|------|------|------|
| **锁定层保真** | ≥ 0.95 | preserve_layers 分数变化 ≤ 5%（含跨维漂移） |
| **跨维漂移** | ≤ 0.10 | 修改 L3 后 L1/L2 分数偏移 ≤ 10% |
| **局部重绘成本比** | ≤ 0.35 | 局部重绘成本 / 全量重跑成本 ≤ 35% |

#### 3.5.3 Refine 执行逻辑

```python
def refine_with_cognitive_guidance(
    candidate, graph: CognitiveStateGraph,
    queen_decision: QueenDecisionV2,
) -> tuple[RefinedCandidate, CognitiveStateGraph]:

    # 1. 保护清单：locked 或高置信+好分数的层
    protected = [
        layer for layer, state in graph.layers.items()
        if state.locked or (state.confidence > 0.7 and state.score and state.score > 0.6)
    ]
    # 合并 Queen 指定的 preserve_layers
    protected = list(set(protected) | set(queen_decision.preserve_layers))

    # 2. 修改清单（从 Queen 决策继承）
    targets = queen_decision.target_layers

    # 3. 副作用预测：修改一个层可能影响另一个层
    side_effects = []
    for target in targets:
        affected = [
            edge[1] for edge in graph.dependency_edges
            if edge[0] == target and edge[1] in protected
        ]
        if affected:
            side_effects.append((target, affected))
            # 例：修改 L1 构图可能影响已确认的 L2 技法 → 需要约束

    # 4. 构建 LocalRerunRequest
    mask_specs = []
    for target in targets:
        region = queen_decision.region_plan.get(target, "mask_inpaint_symbols")

        if region == "mask_inpaint_symbols":
            mask = generate_cultural_mask(candidate, graph.layers["L3"])
            mask_specs.append(MaskSpec(layer=target, mask_path=mask, strength=0.6, mode="inpaint"))
        elif region == "ip_adapter_mood":
            mask_specs.append(MaskSpec(layer=target, mask_path=None, strength=0.3, mode="ip_adapter"))
        elif region == "full_regenerate":
            mask_specs.append(MaskSpec(layer=target, mask_path=None, strength=1.0, mode="inpaint"))

    request = LocalRerunRequest(
        base_candidate_id=candidate.id,
        target_layers=targets,
        preserve_layers=protected,
        mask_specs=mask_specs,
        prompt_delta=_build_delta_prompt(targets, graph),
        negative_delta=_build_negative_delta(targets, graph),
        structure_constraints={
            "preserve_depth": any(l in protected for l in ["L1", "L2"]),
            "side_effects": side_effects,
        },
    )

    # 5. 执行修改
    refined = execute_refine(candidate, request)

    # 6. 验收检查
    for layer in protected:
        old_score = graph.layers[layer].score or 0
        new_score = _re_evaluate_quick(refined, layer)
        drift = abs(new_score - old_score)
        if drift > 0.10:
            graph.layers[layer].insights.append(
                f"⚠️ 跨维漂移 {layer}: {old_score:.2f} → {new_score:.2f} (drift={drift:.2f})"
            )

    return refined, graph
```

---

## 4. 动态融合的完整信息流

```
Round 1:

  Queen ─── Intent Card ───→ Scout
                               │
                  初始化认知状态图
                  L1: completion=0.8, confidence=0.0
                  L3: completion=0.6, confidence=0.0
                  L5: completion=0.4, confidence=0.0
                               │
                          ┌────▼────┐
                          │  Draft  │  graph.current_focus = ["L1", "L2"]
                          │ 首轮策略 │  → 重构图、轻风格
                          └────┬────┘
                               │
                          ┌────▼────┐
                          │ Critic  │  渐进深化 L1→L2→L3→L4→L5
                          │ 含反哺  │  L3 发现"禅宗留白" → 反哺 L1
                          │         │  L5 发现"道家拙朴" → 反哺 L2
                          └────┬────┘
                               │
                    认知状态图更新：
                    L1: score=0.7 → 反哺后重评 → 0.85
                    L2: score=0.6 → 反哺后重评 → 0.75
                    L3: score=0.5, confidence=0.8
                    L5: score=0.4, confidence=0.7

                    动态权重（vs 静态）：
                    静态: L1=0.10, L2=0.15, L3=0.25, L4=0.20, L5=0.30
                    动态: L1=0.08, L2=0.12, L3=0.27, L4=0.18, L5=0.35
                    （L5 被 L3 的 boost 信号提升）
                               │
                          ┌────▼────┐
                          │  Queen  │  弱层模式：depth_weak (L5=0.4)
                          │ 认知决策 │  策略：atmosphere_refine
                          │         │  但 tradition=chinese_xieyi → 全量重来
                          └────┬────┘
                               │
Round 2:
                          ┌────▼────┐
                          │  Draft  │  graph.current_focus = ["L5"]
                          │ 二轮策略 │  → prompt 强化意境词
                          │         │  + L5 反哺信号注入 Draft 上下文
                          └────┬────┘
                               │
                          ┌────▼────┐
                          │ Critic  │  L5 从 0.4 → 0.7
                          │ 渐进深化 │  动态权重微调（轮次递进：高层权重+0.04）
                          └────┬────┘
                               │
                          ┌────▼────┐
                          │  Queen  │  加权总分达标 → accept
                          └─────────┘
```

---

## 5. 与静态方案的对比

| 维度 | 静态方案（当前 v2） | 动态融合方案 |
|------|---------------------|-------------|
| **权重** | 按传统查表，固定不变 | 基线查表 + 置信度调制 + 跨层信号 + 轮次递进 |
| **评审顺序** | L1-L5 并行或固定顺序 | 渐进深化：L1→L2→...→L5→反哺轮 |
| **层间关系** | 独立，互不影响 | 依赖链 + 反哺链，有向图 |
| **Scout** | 按 L 分工检索 | 检索后初始化认知状态图，不足时动态扩展 |
| **Draft** | 按 L 分工生成 | 读取认知状态图决定生成策略和 prompt 重心 |
| **Critic** | 按 L 分工评审 | 渐进深化 + 跨层信号 + 条件反哺重评 |
| **Queen** | 看总分 + 弱维度 | 认知模式识别 + 修改策略选择 + 副作用预测 |
| **Refine** | 弱层 → 修改对应区域 | 保护清单 + 修改清单 + 副作用预测 |
| **信息** | score + rationale | score + confidence + evidence_count + insights + cross_signals |

---

## 6. 为什么这是我们的差异化特征

### 6.1 与现有工作的区别

**vs Nature 2025 中国建筑生成系统**：
他们有 5 个 Agent 和反馈循环，但评审是单一维度（aesthetic + cultural）。
我们的 L1-L5 是**5 层递进认知**，有跨层依赖和反哺——这反映了真实艺术批评的认知过程。

**vs MAJ-EVAL 多维度评审**：
他们的维度是从文档自动提取的、平行的。
我们的 L 层是**学术定义的、有层级依赖的**（基于 Panofsky + Feldman），且层级之间有信息流动。

**vs 通用 LLM-as-Judge**：
通用框架是"给一个 rubric，打一个分"。
我们是"5 层渐进深化，每层读取前层发现，可以反哺修改前层评价"——这模拟了人类批评家的真实思考过程。

### 6.2 学术叙事

> VULCA 的核心贡献不是"多维度评分"（这很多人做），
> 而是**将 Panofsky 图像学的层级依赖关系工程化为动态认知引擎**，
> 使 AI 系统第一次能够模拟"先看形式、再理解文化、最后体悟哲学、
> 然后用哲学洞见重新审视形式"这一人类批评家的认知循环。

---

## 6.5 三类质量门（可测阈值）

### 6.5.1 融合质量门（L1-L5 动态性验证）

| 指标 | 阈值 | 测量方式 |
|------|------|---------|
| 动态权重触发率 | ≥ 80% 的 run 中权重发生变化 | 对比 round 1 vs round 2 权重 |
| 低置信升级命中率 | ≥ 70% 的升级带来分数改善 | 升级前后分数 delta > 0 |
| 非必要升级率 | ≤ 20% | 升级后分数变化 < 0.05 的比例 |
| 层级状态完整度 | 100% 的 LayerState 字段非空 | schema 验证 |

### 6.5.2 编辑质量门（局部重绘有效性）

| 指标 | 阈值 | 测量方式 |
|------|------|---------|
| 锁定层保真 | ≥ 95% | preserve_layers 分数 delta ≤ 5% |
| 目标层提升中位数 | ≥ +0.10 | target_layers 分数 delta 中位数 |
| 跨维漂移 | ≤ 10% | 非目标层分数偏移 |
| 局部重绘成本比 | ≤ 35% vs 全量重跑 | cost_local / cost_global |
| rerun_local 使用率 | ≥ 60% of rerun 决策 | rerun_local / (rerun_local + rerun_global) |

### 6.5.3 评审质量门（Judge 可信度）

| 指标 | 阈值 | 测量方式 |
|------|------|---------|
| L3 与人工标注相关性 | Spearman ρ ≥ 0.5 | 10 样例人工标注 |
| L5 与人工标注相关性 | Spearman ρ ≥ 0.4 | 10 样例人工标注 |
| 双 Judge 分歧率 | ≤ 15% | 规则 vs LLM 分歧 > 0.3 的比例 |
| Taboo 漏判 | = 0 | 必须零漏判 |
| 证据溯源覆盖率 | ≥ 90% | LLM 评审输出中含 evidence_citation_ids |

### 6.5.4 与 v2 Gate 的映射

| v2 Gate | 对应质量门 |
|---------|-----------|
| Gate B (D11) | 融合质量门中的"层级状态完整度" + 编辑质量门无关（FAISS 阶段） |
| Gate C (D16) | 评审质量门全部 + 融合质量门全部 |
| Gate D (D21) | 编辑质量门全部 + 全链路回归 |

---

## 7. 实现优先级

| 优先级 | 机制 | 工程量 | Phase | 当前代码切入点 |
|--------|------|--------|-------|--------------|
| **P0** | `LayerState` 数据结构（替代 `DimensionScore`） | 小 | Phase B | `critic_types.py` |
| **P0** | `CognitiveStateGraph` + 贯穿 pipeline | 中 | Phase B | `queen_types.py` 的 `PlanState` |
| **P0** | Critic 渐进深化（L1→...→L5 串行 + accumulated_context） | 中 | Phase C | `critic_agent.py` |
| **P0** | `rerun_local` / `rerun_global` 分流 | 中 | Phase A | `queen_agent.py` + `orchestrator.py` |
| **P1** | 动态权重（置信度调制 + 轮次递进 + 信号累积） | 小 | Phase C | `critic_config.py` 的 `weights` → `weights_strategy` |
| **P1** | `LocalRerunRequest` 协议 + ComfyUI inpaint 对接 | 大 | Phase A | `draft_agent.py` 新增 refine 子阶段 |
| **P1** | 选择性升级触发（priority + disagreement + coverage） | 中 | Phase C | `critic_agent.py` |
| **P1** | CrossLayerSignal + 反哺轮 | 中 | Phase C | 新建 `critic_signals.py` |
| **P2** | `IntentCardV2` + Queen 预算规划 | 中 | Phase D | `queen_types.py` |
| **P2** | Scout evidence_coverage 写回 LayerState | 小 | Phase B | `scout_service.py` |
| **P2** | 双 Judge 分歧检测 + 第三评审触发 | 中 | Phase C+ | 新建 `critic_disagreement.py` |
| **P2** | 三类质量门自动评测脚本 | 中 | Phase D | 新建 `validate_dynamic_fusion.py` 等 |
| **P3** | 完整反哺链（L5→L1 重评 + L3→L2 重评） | 大 | Phase D+ | `critic_agent.py` |
| **P3** | Langfuse 按层成本追踪 | 中 | Phase D | 新接入 |

### 当前代码最该改的 5 件事（优先级排序）

1. **`CriticConfig.weights` → `weights_strategy`**：从固定 dict 改为 `compute_dynamic_weights(tradition, round, graph)` 动态计算
2. **`PlanState` 增加 `layer_states` + `region_plan`**：让 Queen 决策可执行
3. **`rerun` 拆为 `rerun_local` / `rerun_global`**：两条执行链，对应 `LocalRerunRequest` 协议
4. **引入 `evidence_coverage` + `judge_disagreement`**：驱动选择性升级
5. **新增三个自动评测脚本**：`validate_dynamic_fusion.py`、`validate_local_rerun.py`、`validate_judge_alignment.py`

### 最小可行版本（Phase C 结束时 = D16）

1. `LayerState` 替代 `DimensionScore`，贯穿 pipeline
2. Critic L1→L5 串行渐进（每层读取前层 context）
3. L3/L5 能产生 reinterpret 信号
4. 动态权重 = 基线 + 置信度调制 + 轮次递进
5. `rerun_local` / `rerun_global` 分流就位
6. 三类质量门中的"评审质量门"全部通过

### 完整版本（Phase D+ = D21 后）

加入 IntentCardV2 预算规划、完整反哺链、双 Judge 分歧第三评审、Langfuse 按层追踪。

---

## 8. 参考文献

### 学术基础
- Panofsky, E. (1939). Studies in Iconology（层级认知依赖）
- Feldman, E.B. (1994). Practical Art Criticism（四步渐进批评法）
- Yu et al. VULCA-Bench arXiv:2601.07986 (L1-L5 五层定义)
- Yu et al. VULCA Framework, EMNLP 2025 Findings (五维度评测框架)
- [Modelling Art Interpretation and Meaning](https://arxiv.org/pdf/2106.12967) (2021, Panofsky computational)

### 多 Agent 与评审
- [Multi-agent collaborative pathways for Chinese traditional architecture](https://pmc.ncbi.nlm.nih.gov/articles/PMC12494968/) (Nature Sci Reports, 2025)
- [When AIs Judge AIs: Agent-as-a-Judge](https://arxiv.org/html/2508.02994v1) (2025, MAJ-EVAL)
- [LLMs-as-Judges: Comprehensive Survey](https://arxiv.org/html/2412.05579v2) (2024-2025)
- [Mixture-of-Agents](https://arxiv.org/abs/2406.04692) (2024, MoA 分层聚合)
- [G-Eval: NLG Evaluation using GPT-4](https://arxiv.org/abs/2303.16634) (2023, LLM-as-judge rubric)

### 迭代反馈与自纠偏
- [Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/abs/2303.17651) (2023)
- [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) (2023)
- [Tree of Thoughts](https://arxiv.org/abs/2305.10601) (2023, 多路径搜索/回溯)

### 动态权重与生成
- [Multi-Task Dynamic Weight Optimization Based on DRL](https://www.mdpi.com/2076-3417/15/5/2473) (MDPI, 2025)
- [Learning to Optimize Multi-Objective Alignment](https://arxiv.org/html/2509.11452v1) (2025)
- [LFMDiff: Chinese traditional landscape painting generation](https://www.nature.com/articles/s40494-025-02136-5) (npj Heritage Science, 2025)
- [Evaluating Multimodal LLMs in Culturally Situated Tasks](https://arxiv.org/html/2509.23208) (2025)
- [Embodied Intelligence: Three-Layer Framework](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2025.1668910/full) (Frontiers, 2025)

### 工具链与工程约束
- [ControlNet](https://arxiv.org/abs/2302.05543) (2023, 空间条件控制)
- [IP-Adapter](https://arxiv.org/abs/2308.06721) (2023, 图像提示风格迁移)
- [CLIP](https://arxiv.org/abs/2103.00020) (2021, 图文对齐检索)
- [FAISS](https://github.com/facebookresearch/faiss) (大规模向量检索)
- [ComfyUI Inpaint](https://docs.comfy.org/tutorials/basic/inpaint) (局部重绘工作流)
- [LangGraph Persistence + Interrupts](https://docs.langchain.com/oss/python/langgraph/persistence) (checkpoint + HITL)
- [LiteLLM](https://docs.litellm.ai/) (多模型路由/fallback/预算)
- [Langfuse](https://langfuse.com/) (trace/eval/cost 观测)
- [Together.ai Pricing](https://www.together.ai/pricing) (FLUX 图像计费)
