# Design: Multi-Persona Art Dialogue System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dialogue Generation Pipeline                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐ │
│  │ Artwork  │──▶│ Persona      │──▶│ Multi-Turn Dialogue     │ │
│  │ + Image  │   │ Selector     │   │ Generator (Claude)      │ │
│  │ + URL    │   │ (2-4 roles)  │   │ + Chain-of-Thought      │ │
│  └──────────┘   └──────────────┘   └───────────┬─────────────┘ │
│                                                 │               │
│                                    ┌────────────▼────────────┐ │
│                                    │ Reference Injector      │ │
│                                    │ + Citation Database     │ │
│                                    └────────────┬────────────┘ │
│                                                 │               │
│  ┌──────────────────────────────────────────────▼─────────────┐│
│  │                    LanceDB Storage                         ││
│  │  - conversations (with URL markers)                        ││
│  │  - dialogue_turns (individual utterances)                  ││
│  │  - citations (referenced works)                            ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## 1. 多角色对话模型设计

### 1.1 对话结构 (DialogueTurn)
```python
class DialogueTurn(BaseModel):
    """单轮对话发言"""
    turn_id: str                    # UUID
    dialogue_id: str                # 所属对话ID
    speaker_id: str                 # 发言角色ID
    speaker_name: str               # 角色名称
    content: str                    # 发言内容 (多语言)
    language: str                   # 语言代码 (zh/en/ja/...)
    chain_of_thought: str           # 思维链 (推理过程)
    stance: str                     # 态度: agree/disagree/neutral/challenge
    references: List[Citation]      # 引用文献
    responds_to: Optional[str]      # 回应哪个turn_id
    timestamp: datetime

class Citation(BaseModel):
    """文献引用"""
    author: str
    title: str
    year: int
    source: str                     # book/paper/speech
    quote: Optional[str]            # 原文引用
    relevance: str                  # 引用相关性说明
```

### 1.2 完整对话 (MultiPersonaDialogue)
```python
class MultiPersonaDialogue(BaseModel):
    """多角色对话"""
    id: str                         # UUID
    artwork_id: int
    artwork_url: str                # URL定位: /exhibition/artworks/{id}
    image_url: str                  # 图像URL (OSS)
    participants: List[str]         # 参与角色ID列表
    topic: str                      # 讨论主题
    turns: List[DialogueTurn]       # 对话轮次
    conflict_level: float           # 冲突程度 0-1
    languages_used: List[str]       # 使用的语言
    total_citations: int
    created_at: datetime
    model_config: dict              # 生成参数 (temperature等)
```

## 2. 角色关系矩阵

### 2.1 角色配对策略
| 配对类型 | 角色组合 | 预期冲突 |
|---------|---------|---------|
| 东西方美学对比 | 苏轼 vs John Ruskin | 高 |
| 传统vs现代 | 郭熙 vs Dr. Aris Thorne | 高 |
| 精神vs形式 | 冈仓天心 vs Prof. Petrova | 中 |
| 社区vs个人 | Mama Zola vs Brother Thomas | 中 |
| 技术伦理辩论 | Dr. Thorne vs Brother Thomas | 高 |

### 2.2 角色属性冲突检测
```python
def calculate_conflict_potential(persona_a, persona_b) -> float:
    """计算两角色的潜在冲突程度"""
    # 基于attributes的差异计算
    diff = 0
    for attr in ['philosophy', 'technique', 'tradition', 'innovation']:
        if attr in persona_a.attributes and attr in persona_b.attributes:
            diff += abs(persona_a.attributes[attr] - persona_b.attributes[attr])
    return min(diff / 4, 1.0)  # 归一化到0-1
```

## 3. 文献引用系统

### 3.1 引用数据库结构
```python
CITATION_DATABASE = {
    "su_shi": [
        {
            "author": "苏轼",
            "title": "书吴道子画后",
            "year": 1085,
            "source": "东坡题跋",
            "quotes": ["论画以形似，见与儿童邻"]
        },
        {
            "author": "苏轼",
            "title": "文与可画筼筜谷偃竹记",
            "year": 1079,
            "source": "东坡集"
        }
    ],
    "guo_xi": [
        {
            "author": "郭熙",
            "title": "林泉高致",
            "year": 1080,
            "source": "林泉高致集",
            "quotes": ["山有三远：高远、深远、平远"]
        }
    ],
    "john_ruskin": [
        {
            "author": "John Ruskin",
            "title": "Modern Painters",
            "year": 1843,
            "source": "book"
        },
        {
            "author": "John Ruskin",
            "title": "The Stones of Venice",
            "year": 1851,
            "source": "book"
        }
    ],
    # ... 其他角色的文献
}
```

## 4. 对话生成策略

### 4.1 输入扰动机制
```python
PERTURBATION_CONFIG = {
    "temperature_range": (0.8, 1.2),      # 提高温度增加多样性
    "input_length_variation": (1, 20),     # 输入长度变化范围
    "conflict_injection_rate": 0.4,        # 40%概率注入冲突观点
    "language_switch_rate": 0.3,           # 30%概率切换语言
}
```

### 4.2 思维链格式
```
<thinking>
[内部推理过程]
- 观察到的视觉元素...
- 联想到的历史背景...
- 与我的美学观点的关联...
- 对方观点的分析...
</thinking>

<stance attitude="challenge" confidence="0.8">
[对方观点存在以下问题...]
</stance>

<response language="zh">
[正式回应内容]
</response>

<citation>
引用: 《林泉高致》郭熙, 1080年
"山有三远..."
</citation>
```

## 5. URL标记系统

### 5.1 Artwork URL Schema
```
基础URL: /api/v1/exhibition/artworks/{artwork_id}
图像URL: /api/v1/exhibition/artworks/{artwork_id}/images/{index}
对话URL: /api/v1/exhibition/artworks/{artwork_id}/dialogues/{dialogue_id}
轮次URL: /api/v1/exhibition/dialogues/{dialogue_id}/turns/{turn_id}
```

### 5.2 图像文本标签URL
```json
{
  "artwork_ref": "artwork://1759494368418",
  "image_refs": [
    "image://1759494368418/0",
    "image://1759494368418/1"
  ],
  "visual_tags": {
    "composition": "tag://visual/composition/asymmetric",
    "color_palette": "tag://visual/color/warm-tones",
    "technique": "tag://technique/digital-generative"
  }
}
```

## 6. 生成流程

```
1. 选择Artwork
   └─> 加载图像 + 描述 + 元数据

2. 选择参与角色 (2-4人)
   └─> 基于conflict_potential选择
   └─> 确保东西方、传统现代平衡

3. 生成对话主题
   └─> 基于artwork特征生成讨论焦点

4. 循环生成对话轮次 (3-8轮)
   └─> 每轮:
       ├─> 选择发言角色
       ├─> 生成思维链
       ├─> 注入文献引用
       ├─> 生成正式回应
       └─> 可能切换语言

5. 后处理
   └─> 添加URL标记
   └─> 计算对话统计
   └─> 存储到LanceDB
```

## 7. 数据存储设计

### LanceDB表结构

**dialogues表**
| 字段 | 类型 | 说明 |
|-----|------|-----|
| id | str | UUID |
| artwork_id | int | 作品ID |
| artwork_url | str | 作品URL |
| participants_json | str | 参与者列表JSON |
| topic | str | 讨论主题 |
| turns_json | str | 对话轮次JSON |
| conflict_level | float | 冲突程度 |
| languages_json | str | 语言列表JSON |
| total_citations | int | 引用数量 |
| vector | List[float] | 语义向量 |

## 8. API端点扩展

```
GET /api/v1/exhibition/artworks/{id}/dialogues
    - 获取作品的所有对话

GET /api/v1/exhibition/dialogues/{id}
    - 获取单个对话详情

GET /api/v1/exhibition/dialogues/{id}/turns
    - 获取对话所有轮次

GET /api/v1/exhibition/dialogues/search?q=...
    - 语义搜索对话内容

GET /api/v1/exhibition/citations
    - 获取所有引用的文献
```

## 9. 质量保证

### 验证规则
1. 每个对话至少2个角色参与
2. 每个发言必须有语言标签
3. 至少30%的发言包含文献引用
4. 思维链长度: 50-500字符
5. URL标记格式验证

### 冲突检测
- 同一角色不能连续发言超过2次
- 对话必须包含至少1次stance为disagree/challenge
