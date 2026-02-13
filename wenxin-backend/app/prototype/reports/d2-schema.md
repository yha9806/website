# D2 Report: Schema 固化

**Date**: 2026-02-08
**Status**: Done

---

## Done

- [x] `intent_card.schema.json` — JSON Schema Draft 2020-12，定义 Cultural Intent Card 全部字段
- [x] 4 条示例数据文件（2 valid + 2 invalid）
- [x] `validate_schema.py` — 一键校验脚本，验证 schema 自身合法性 + 示例校验
- [x] Schema 可被 `Draft202012Validator.check_schema()` 成功加载
- [x] `example_full_generation.json` 通过校验（首轮完整生成）
- [x] `example_partial_rerun.json` 通过校验（第 2 轮局部重跑）
- [x] `example_invalid.json` 按预期失败，4 个错误精确定位
- [x] `example_invalid_format.json` 按预期失败，4 个格式错误精确定位

## Metrics

| 指标 | 值 |
|------|-----|
| Schema 字段数 (root) | 14 |
| 枚举定义数 | 4 (cultural_tradition, workflow_stage, dimension_status, severity) |
| L1-L5 层属性数 | 10 per layer |
| $defs 子模式数 | 9 (DimensionEntry, Dimensions, Checkpoint, SampleMatch, TerminologyHit, TabooViolation, RubricScores, Evidence, Metadata) |
| 示例 1 (full) | PASS — 5 layers generated, round 1, critique stage |
| 示例 2 (rerun) | PASS — L3 confirmed+locked, L5 rejected, round 2, refine stage |
| 示例 3 (invalid) | FAIL (expected) — 4 errors: missing task_id, bad enum ×2, confidence > 1 |
| 示例 4 (invalid_format) | FAIL (expected) — 4 errors: bad uuid ×2, bad date-time ×2 |

## Schema Design Decisions

1. **Draft 2020-12**: 选择最新 draft 以支持 `$defs`、`oneOf` nullable 模式
2. **additionalProperties: false**: 所有层级严格约束，防止字段拼写错误滑过校验
3. **Nullable 字段**: 使用 `oneOf: [{type: "string"}, {type: "null"}]` 而非 `type: ["string", "null"]`（后者在 Draft 2020-12 中仍有效但前者语义更明确）
4. **locked_sections / rerun_targets**: 使用 enum 限定为 5 个维度 ID，避免拼写错误
5. **prompt_hash**: 强制 SHA-256 格式（64 位十六进制），支持后续 prompt 追踪

## Post-Review Hardening (2026-02-08)

1. **严格 format 校验**：`validate_schema.py` 启用 `format_checker`，并增加运行时兜底校验（UUID / ISO 8601 date-time），避免环境差异导致漏检。
2. **锁定与重跑一致性约束**：schema 新增跨字段规则，强制以下关系：
   - `locked_sections` 包含某维度 => 对应 `dimensions.*.locked` 必须为 `true`
   - `dimensions.*.locked = true` => `locked_sections` 必须包含该维度
   - `rerun_targets` 包含某维度 => 对应 `dimensions.*.locked` 必须为 `false`
   - 同一维度不可同时出现在 `locked_sections` 和 `rerun_targets`

## Blockers

无。

## Next (D3)

D3 目标：**素材库骨架**
- 基于 schema 中的 `evidence` 结构，构建样本检索器 (SampleMatcher)
- 构建术语词典加载器 (TerminologyLoader)
- 构建禁区规则引擎 (TabooRuleEngine)
- 准备 L4/L5 rubric 评分模板

## Files Created

| 文件 | 说明 |
|------|------|
| `app/prototype/data/intent_card.schema.json` | JSON Schema (Draft 2020-12) |
| `app/prototype/data/samples/example_full_generation.json` | 首轮完整生成示例 |
| `app/prototype/data/samples/example_partial_rerun.json` | 第 2 轮局部重跑示例 |
| `app/prototype/data/samples/example_invalid.json` | 故意错误示例 (4 errors) |
| `app/prototype/data/samples/example_invalid_format.json` | 故意格式错误示例 (4 errors) |
| `app/prototype/validate_schema.py` | 一键校验脚本 |
| `app/prototype/reports/d2-schema.md` | 本报告 |
