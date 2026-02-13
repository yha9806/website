# D2 可执行清单（仅拆解，不实施）

> 目标对应：`vulca-prototype-plan-v1.md` 的 D2（Schema 固化）
> 验收口径：完成 `Cultural Intent Card` JSON Schema，且 3 条示例全部校验通过。

## 0. 范围与边界
- 本阶段只做 Schema 与校验链路，不接入真实多 Agent 执行。
- 输出必须覆盖已确认方向：L5→L1 分层、多轮 fallback 的“已确认内容保留”语义、人类创作阶段语义。
- 不改业务 API 合同（若发现冲突，先记录变更提案）。

## 1. Schema 设计任务
1. 定义根结构与版本字段：`schema_version`、`task_id`、`created_at`、`locale`。
2. 定义 L5→L1 五层对象：每层至少包含 `goal`、`constraints`、`evidence_refs`、`status`。
3. 定义 fallback/锁定结构：`locked_sections[]`、`rerun_targets[]`、`checkpoint_ref`。
4. 定义人类创作行为阶段：`workflow_stage`（Intent/Reference/Anchor/Sketch/Critique/Refine/Verify/Archive）。
5. 定义枚举与格式：状态枚举、日期时间格式、ID 命名规则、必填项与默认值策略。

## 2. 示例与校验任务
1. 准备正常首轮样例（全维度生成）。
2. 准备局部重跑样例（仅重跑 L5，保留已锁定 L3）。
3. 准备异常样例（字段缺失/非法枚举），用于验证错误提示质量。
4. 选定校验工具链（Node `ajv` 或 Python `jsonschema` 二选一，先本地可复现）。
5. 输出校验脚本与命令：一键跑 3 条样例并打印通过/失败原因。

## 3. D2 完成判定（DoD）
- `intent_card.schema.json` 可被本地校验器加载。
- 2 条有效样例通过，1 条无效样例按预期失败且报错可定位。
- 字段注释/README 说明“每个关键字段的用途与来源”。
- 记录执行证据：命令、结果摘要、剩余风险。

## 4. 执行顺序建议（半天~1天）
1. 先锁字段与枚举。
2. 再补样例。
3. 最后接校验脚本和 CI 钩子（可选）。
