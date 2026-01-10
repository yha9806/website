# Spec: Dialogue Generation System

## Overview
定义多角色艺术对话生成系统的功能需求和验收标准。

---

## ADDED Requirements

### Requirement: Multi-Persona Dialogue Model
**ID**: DG-001
**Priority**: P1

系统必须支持多角色参与的对话数据模型。

#### Scenario: Create dialogue with multiple participants
**Given** 一件artwork (ID: 1759494368418)
**And** 选择角色: [苏轼, John Ruskin, Dr. Aris Thorne]
**When** 调用 `generate_multi_turn_dialogue(artwork_id, participants)`
**Then** 生成包含3个角色发言的对话
**And** 每个角色至少发言1次
**And** 对话轮次在3-8轮之间

#### Scenario: Dialogue contains conflict
**Given** 选择具有高冲突潜力的角色组合 (e.g., 苏轼 vs John Ruskin)
**When** 生成对话
**Then** 对话中至少有1个turn的stance为"disagree"或"challenge"

---

### Requirement: Chain-of-Thought Output
**ID**: DG-002
**Priority**: P1

每个对话发言必须包含思维链(推理过程)。

#### Scenario: Thinking process included
**Given** 一个DialogueTurn
**When** 检查其结构
**Then** 存在 `chain_of_thought` 字段
**And** 长度在50-500字符之间
**And** 包含至少1个推理步骤

#### Scenario: Stance explicitly marked
**Given** 一个DialogueTurn
**When** 检查其结构
**Then** 存在 `stance` 字段
**And** 值为 ["agree", "disagree", "neutral", "challenge", "elaborate"] 之一

---

### Requirement: Citation Integration
**ID**: DG-003
**Priority**: P1

对话发言需要引用相关的艺术史文献和理论。

#### Scenario: Reference database available
**Given** 角色ID "su_shi"
**When** 查询引用数据库
**Then** 返回至少3条相关文献
**And** 每条包含author, title, year, source字段

#### Scenario: Citations injected in dialogue
**Given** 一个完整的MultiPersonaDialogue
**When** 统计所有turns的引用数量
**Then** 至少30%的turns包含1个或更多Citation
**And** 引用来源与发言角色匹配

---

### Requirement: Multi-Language Support
**ID**: DG-004
**Priority**: P2

对话内容支持多语言，角色可以使用其native语言。

#### Scenario: Language tagged for each turn
**Given** 一个DialogueTurn
**When** 检查其结构
**Then** 存在 `language` 字段
**And** 值为有效的ISO 639-1代码 (zh, en, ja, ru, etc.)

#### Scenario: Language switching in dialogue
**Given** 一个包含苏轼(中文)和John Ruskin(英文)的对话
**When** 生成对话
**Then** 苏轼的发言language="zh"
**And** John Ruskin的发言language="en"

---

### Requirement: URL Marking System
**ID**: DG-005
**Priority**: P1

使用URL标记artwork ID、图像和文本标签。

#### Scenario: Artwork URL format
**Given** artwork_id = 1759494368418
**When** 生成artwork_url
**Then** 格式为 `/api/v1/exhibition/artworks/1759494368418`

#### Scenario: Image URL included
**Given** 一个有图像的artwork
**When** 生成对话
**Then** dialogue.image_url 指向有效的OSS URL
**And** URL可以正常访问

#### Scenario: Visual tags as URLs
**Given** 对话分析识别到composition特征
**When** 存储视觉标签
**Then** 格式为 `tag://visual/composition/{tag_value}`

---

### Requirement: Input Perturbation
**ID**: DG-006
**Priority**: P2

增加生成内容的多样性和冲突。

#### Scenario: Temperature variation
**Given** 生成配置
**When** 检查model_config
**Then** temperature值在0.8-1.2范围内随机

#### Scenario: Conflict injection
**Given** conflict_injection_rate = 0.4
**When** 生成多个对话
**Then** 约40%的对话包含至少1个挑战性回应

---

## MODIFIED Requirements

### Requirement: LanceDB Storage (Modified)
**ID**: DG-007
**Priority**: P1

扩展LanceDB存储以支持新的对话模型。

#### Scenario: Store multi-persona dialogue
**Given** 一个生成的MultiPersonaDialogue
**When** 调用 `lancedb_service.add_dialogue(dialogue)`
**Then** 对话存储成功
**And** 包含序列化的turns_json, participants_json字段

#### Scenario: Search dialogues by content
**Given** 已存储的对话数据
**When** 调用 `search_dialogues(query="spiritual essence")`
**Then** 返回语义相关的对话列表
**And** 响应时间<500ms

---

### Requirement: API Endpoints (Modified)
**ID**: DG-008
**Priority**: P2

扩展API支持新的对话数据。

#### Scenario: Get artwork dialogues
**Given** artwork_id = 1759494368418 有3个对话
**When** GET `/api/v1/exhibition/artworks/1759494368418/dialogues`
**Then** 返回3个对话摘要
**And** 包含participants, topic, turn_count字段

#### Scenario: Get dialogue detail
**Given** dialogue_id存在
**When** GET `/api/v1/exhibition/dialogues/{dialogue_id}`
**Then** 返回完整对话
**And** 包含所有turns及其chain_of_thought

#### Scenario: Search dialogues
**Given** 查询词 "传统与现代"
**When** GET `/api/v1/exhibition/dialogues/search?q=传统与现代`
**Then** 返回语义相关的对话
**And** 结果按相关度排序

---

## Cross-References

- **DG-001** 依赖 Persona模型 (已存在于 `models/persona.py`)
- **DG-003** 需要新建Citation数据库
- **DG-007** 扩展现有 `lancedb_service.py`
- **DG-008** 扩展现有 `exhibition_routes.py`

---

## Validation Rules

1. **对话完整性**: 每个对话必须有2-4个参与者
2. **发言平衡**: 每个参与者至少发言1次
3. **冲突存在**: 对话必须包含至少1次disagreement
4. **引用覆盖**: 30%以上发言包含引用
5. **URL有效性**: 所有URL必须符合定义的schema
6. **语言标注**: 每个turn必须有language字段
