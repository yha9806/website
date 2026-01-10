# Tasks: Generate Multi-Persona Art Dialogues

## Phase 1: 数据模型扩展 [P1]

### 1.1 创建新数据模型
- [ ] 创建 `DialogueTurn` 模型 (单轮发言)
- [ ] 创建 `MultiPersonaDialogue` 模型 (完整对话)
- [ ] 创建 `Citation` 模型 (文献引用)
- [ ] 更新 `models/__init__.py` 导出

**验证**: 运行 `python -c "from app.exhibition.models import DialogueTurn, MultiPersonaDialogue, Citation"`

### 1.2 创建引用数据库
- [ ] 创建 `data/citations/` 目录
- [ ] 为每个角色创建引用文献JSON文件
- [ ] 实现 `CitationService` 加载和检索引用

**验证**: 单元测试 `test_citation_service.py`

---

## Phase 2: 对话生成引擎 [P1]

### 2.1 角色选择器
- [ ] 实现 `PersonaSelector` 类
- [ ] 实现 `calculate_conflict_potential()` 函数
- [ ] 实现配对策略 (东西方、传统现代等)

**验证**: 测试不同artwork返回合适的角色组合

### 2.2 多轮对话生成器
- [ ] 重构 `DialogueGenerator` 支持多角色
- [ ] 实现 `generate_multi_turn_dialogue()` 方法
- [ ] 实现思维链(CoT)输出格式
- [ ] 实现语言切换机制

**验证**: 生成测试对话，检查格式正确

### 2.3 文献引用注入
- [ ] 实现 `inject_citations()` 方法
- [ ] 角色发言时自动查询相关引用
- [ ] 确保引用格式标准化

**验证**: 检查生成的对话包含正确引用

### 2.4 扰动机制
- [ ] 实现温度动态调整
- [ ] 实现输入长度变化 (1-20字符)
- [ ] 实现冲突观点注入

**验证**: 多次生成同artwork对话，检查多样性

---

## Phase 3: URL标记系统 [P2]

### 3.1 URL Schema实现
- [ ] 定义URL模式常量
- [ ] 实现 `generate_artwork_url()`
- [ ] 实现 `generate_image_url()`
- [ ] 实现 `generate_dialogue_url()`

**验证**: URL格式符合设计规范

### 3.2 图像文本标签
- [ ] 实现视觉标签提取 (从Claude分析)
- [ ] 定义标签URL schema
- [ ] 存储标签到对话记录

**验证**: 对话包含正确的URL标记

---

## Phase 4: 存储层更新 [P1]

### 4.1 LanceDB表扩展
- [ ] 创建 `dialogues` 表 (替换旧conversations)
- [ ] 添加JSON序列化字段
- [ ] 实现向量嵌入

**验证**: 测试CRUD操作

### 4.2 迁移脚本
- [ ] 创建 `migrate_conversations_to_dialogues.py`
- [ ] 保留已有对话数据
- [ ] 添加新字段默认值

**验证**: 迁移后数据完整

---

## Phase 5: 批量生成 [P1]

### 5.1 生成脚本更新
- [ ] 更新 `scripts/generate_dialogues.py`
- [ ] 支持 `--multi-persona` 参数
- [ ] 支持断点续传
- [ ] 添加进度显示

**验证**: 能够成功启动批量生成

### 5.2 执行批量生成
- [ ] 生成87件作品的多角色对话
- [ ] 每作品至少1个多角色对话
- [ ] 记录生成统计

**预期产出**: 783+ 对话记录

---

## Phase 6: API端点更新 [P2]

### 6.1 新端点实现
- [ ] `GET /artworks/{id}/dialogues` - 作品对话列表
- [ ] `GET /dialogues/{id}` - 对话详情
- [ ] `GET /dialogues/{id}/turns` - 对话轮次
- [ ] `GET /dialogues/search` - 语义搜索
- [ ] `GET /citations` - 引用文献列表

**验证**: Swagger文档完整，API响应<500ms

### 6.2 API文档
- [ ] 更新OpenAPI schema
- [ ] 添加示例请求/响应
- [ ] 编写使用说明

**验证**: 第三方可基于文档调用API

---

## Phase 7: 测试与质量保证 [P2]

### 7.1 单元测试
- [ ] `test_dialogue_turn.py`
- [ ] `test_multi_persona_dialogue.py`
- [ ] `test_citation_service.py`
- [ ] `test_persona_selector.py`

### 7.2 集成测试
- [ ] 测试完整对话生成流程
- [ ] 测试API端点
- [ ] 测试语义搜索

### 7.3 数据质量验证
- [ ] 验证所有对话包含2+角色
- [ ] 验证30%+发言有引用
- [ ] 验证URL格式正确
- [ ] 验证多语言分布

---

## 依赖关系

```
Phase 1 ─┬─> Phase 2 ─> Phase 5 (批量生成)
         │
         └─> Phase 4 ─> Phase 6 (API)
                 │
Phase 3 ────────┘

Phase 7 依赖所有其他Phase完成
```

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| Claude API速率限制 | 批量生成中断 | 实现退避重试 + 断点续传 |
| 对话质量不稳定 | 产出不可用 | 提高temperature但增加后处理验证 |
| 文献引用不准确 | 学术可信度降低 | 人工验证引用数据库 |

## 验收标准

1. ✅ 87件作品全部生成多角色对话
2. ✅ 每个对话2-4角色参与
3. ✅ 30%以上发言包含文献引用
4. ✅ 支持中英日等多语言
5. ✅ API响应时间<500ms
6. ✅ 语义搜索功能可用
