# VULCA v2 文档审查报告（2026-02-10）

## 审查范围

- `wenxin-moyun/docs/vulca-prototype-plan-v2.md`
- `wenxin-moyun/docs/vulca-prototype-plan-v2-compact.md`

审查重点：
- 逻辑一致性（full vs compact）
- 可执行性（Gate/DoD 是否可测）
- 成本与时间估算是否自洽
- 与当前仓库状态是否有明显漂移

---

## 结论（先看这个）

v2 方向正确，结构完整，且比 v1 更接近“可执行工程路线”。  
但当前版本存在 **1 个高优先级问题 + 2 个中优先级问题 + 若干低优先级一致性问题**，建议先修正后再作为“唯一基线”对外汇报。

---

## Findings（按严重级别）

## 高优先级（P0）

1. 成本模型漏算 Queen 的 LLM 调用，预算明显偏乐观。  
证据：
- 文档声明 Queen 使用高成本模型且每任务 2-3 次调用：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:120-121`
- 但成本分解表未包含 Queen 成本项：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:456-467`
- compact 版本同样给出总成本但未列 Queen 成本：`wenxin-moyun/docs/vulca-prototype-plan-v2-compact.md:101-108`

影响：
- `~$0.056/task`、`35-90 次/日` 这类容量估算可能低估。  
- Gate C/D 的成本门槛可信度下降。

建议：
- 在 7.1 成本表增加 `Queen-Intent`、`Queen-Decision` 两行。  
- 给出“token 假设 + 图像输入假设 + 调用次数区间”。

## 中优先级（P1）

1. Gate/DoD 多处为“方向性描述”，缺乏可执行阈值定义。  
证据：
- “优于 Jaccard baseline”但未定义统计口径：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:530`, `:536`, `:578`
- “可量化增益（非 tie）”但未定义最小增益阈值：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:553`, `:576`

影响：
- 执行阶段易产生争议：什么算“优于”、什么算“增益达标”。

建议：
- Gate B 增加明确门槛（例如 Recall@5、MRR、Top-1 hit rate 至少提升 X%）。  
- Gate C 增加明确门槛（例如 L3/L5 人工评审一致性提升、A/B 胜率或显著性检验）。

2. 基线测试数字出现漂移，影响“状态统一”目标。  
证据：
- 文档写“17 API”：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:18`
- 当前仓库 `test_prototype_api.py` 中测试数为 18（代码现状）

影响：
- 与“Phase 0 统一单一真相”的目标冲突。

建议：
- 将测试数字改为“自动生成/引用报告文件”，避免手写常量。

## 低优先级（P2）

1. compact 与 full 信息粒度不一致，容易被误读为配置差异。  
证据：
- full 给出 8 传统权重：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:98-106`
- compact 仅列 5 条：`wenxin-moyun/docs/vulca-prototype-plan-v2-compact.md:57-63`

建议：
- compact 明确标注“仅展示核心样例，完整表见 full”。

2. 同一模型成本在不同段落缺乏调用条件解释。  
证据：
- compact 中 DeepSeek 在不同位置呈现不同数量级用途（Scout/通用低成本 LLM）：`wenxin-moyun/docs/vulca-prototype-plan-v2-compact.md:34`, `:93`

建议：
- 统一标注为“按单次调用的典型输入规模估算”，并补充区间。

3. Day 标记存在轻微歧义。  
证据：
- `0-1` 与 `0-2` 并列呈现：`wenxin-moyun/docs/vulca-prototype-plan-v2.md:499-500`

建议：
- 改为“D0-D1 / D2”或明确“包含端点”的计数方式。

---

## 建议的最小修订清单（先做这 5 条）

1. 在 7.1 成本表补 Queen 成本项。  
2. 在 Gate B/C 写死量化指标与通过阈值。  
3. 将“17 API”改为与当前测试报告一致，或改为动态引用。  
4. compact 补一句“权重表为节选，完整见 full 文档”。  
5. 统一 Day 命名（D0-D21）避免歧义。

---

## 最终评估

- 这两个文档可以作为 v2 工作主线。  
- 但在“预算可信度”和“验收可测性”上还需要一次修订。  
- 修完上述 P0/P1 项后，文档就能作为对内执行和对外汇报的稳定版本。

