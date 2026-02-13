# D3 Report: Resource Library Skeleton

**Date**: 2026-02-08
**Status**: COMPLETE

---

## Done

### 1. Terminology Dictionary (`terms.v1.json`)
- Created `app/prototype/data/terminology/terms.v1.json`
- **31 术语条目**覆盖 8 个文化传统
- V1 首批 3 个传统 (chinese_xieyi: 6, western_academic: 5, default: 5) 均 >= 5 条
- 其余 5 个传统各 3 条
- 字段对齐 D2 schema `TerminologyHit`: `term` / `matched` / `confidence` / `dictionary_ref`
- 每条目包含: id, term_zh, term_en, definition, category, l_levels, aliases, source

### 2. Taboo Rules (`taboo_rules.v1.json`)
- Created `app/prototype/data/terminology/taboo_rules.v1.json`
- **14 条规则**: 3 通用 (*) + 11 传统特定
- 覆盖所有 8 个文化传统 (直接规则 + 通配符规则)
- 字段对齐 D2 schema `TabooViolation`: `rule_id` / `description` / `severity`
- 每规则包含: rule_id, cultural_tradition, description, severity, trigger_patterns, explanation, l_levels, source

### 3. Sample Index (`index.v1.json`)
- Created `app/prototype/data/samples/index.v1.json`
- **24 条样本索引**覆盖 8 个文化传统
- V1 首批 3 个传统 (chinese_xieyi: 5, western_academic: 5, default: 4) 均 >= 4 条
- 其余 5 个传统各 2 条
- 字段对齐 D2 schema `SampleMatch`: `sample_id` / `similarity` / `source`
- 每条目包含: sample_id, cultural_tradition, subject_zh, subject_en, l_levels_covered, tags, difficulty, source

### 4. Validation Script (`validate_resources.py`)
- Created `app/prototype/tools/validate_resources.py`
- 5 个校验步骤: 文件加载 → 结构校验 → 覆盖率汇总 → 交叉引用 → 查询演示
- 退出码: 0=全通过, 1=有错误

---

## Metrics

| Metric | Value |
|--------|-------|
| 术语条目 | 31 |
| 禁区规则 | 14 |
| 样本索引 | 24 |
| 全局唯一 ID | 69 (0 冲突) |
| 文化传统覆盖 | 8/8 (100%) |
| validate_resources.py | ALL CHECKS PASSED |
| validate_schema.py (D2 回归) | ALL CHECKS PASSED |

### Coverage Breakdown

| Tradition | Terms | Taboo (specific+wildcard) | Samples |
|-----------|-------|---------------------------|---------|
| chinese_xieyi | 6 | 2+3* | 5 |
| western_academic | 5 | 2+3* | 5 |
| default | 5 | 2+3* | 4 |
| chinese_gongbi | 3 | 1+3* | 2 |
| islamic_geometric | 3 | 1+3* | 2 |
| watercolor | 3 | 1+3* | 2 |
| african_traditional | 3 | 1+3* | 2 |
| south_asian | 3 | 1+3* | 2 |

---

## Blockers

None.

---

## Next (D4)

D4 targets: **Scout 闭环** — 用 D3 素材构建三个锚定工具:

1. **SampleMatcher**: 基于 `index.v1.json` 的 tags/subject 匹配，输出 `SampleMatch`
2. **TerminologyLoader**: 基于 `terms.v1.json` 的 term_zh/term_en/aliases 匹配，输出 `TerminologyHit`
3. **TabooRuleEngine**: 基于 `taboo_rules.v1.json` 的 trigger_patterns 关键词匹配，输出 `TabooViolation`

这三个工具将直接消费 D3 的数据文件，填充 Intent Card 的 `evidence` 字段。
