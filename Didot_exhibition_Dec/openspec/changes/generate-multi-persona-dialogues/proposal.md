# Proposal: Generate Multi-Persona Art Dialogues

## Change ID
`generate-multi-persona-dialogues`

## Summary
设计并实现一个完整的多角色艺术对话生成系统，为87件展览作品生成高质量的跨角色对话数据。这些对话数据将作为核心API资产供第三方开发者使用。

## Motivation
当前系统仅支持单一角色对作品的独立评论。用户需求明确指出：
1. **角色间对话** - 8个角色之间需要互相对话、辩论、回应
2. **学术引用** - 对话中需要引用正确的艺术史文献和理论
3. **思维链展示** - 展示角色的推理过程和态度立场
4. **输入扰动** - 增加内容多样性和冲突
5. **URL定位** - 使用URL标记artwork ID和图像文本标签
6. **多语言支持** - 对话内容不限语言

## Scope

### In Scope
- 多角色对话生成引擎
- 角色关系矩阵定义
- 文献引用系统
- 思维链(Chain-of-Thought)输出格式
- 对话冲突与扰动机制
- URL标记系统
- 多语言输出支持
- 87 artworks × 多轮对话 = ~783+ 对话记录

### Out of Scope
- 前端展示界面 (后续任务)
- 实时对话生成 API (本次只做批量生成)
- 用户自定义角色 (使用现有8+1角色)

## Stakeholders
- 展览数据使用者 (API调用方)
- 艺术研究人员
- AI对话系统开发者

## Dependencies
- 已有: LanceDB数据存储
- 已有: Claude API集成
- 已有: 9个Persona定义
- 需要: 文献引用数据库

## Timeline
- Phase 1: 架构设计与数据模型 (当前)
- Phase 2: 对话生成引擎实现
- Phase 3: 批量生成783+对话
- Phase 4: API端点完善

## Success Criteria
1. 生成783+对话记录存储于LanceDB
2. 每个对话包含2-4个角色互动
3. 对话包含可验证的文献引用
4. 支持语义搜索和URL定位
5. API响应时间<500ms
