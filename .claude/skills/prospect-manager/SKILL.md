---
name: prospect-manager
description: VULCA 潜在客户管理系统 - 检索、验证、增量联系潜在客户。支持学术机构、企业客户、画廊/艺术机构三类目标群体。包含强制七步验证机制，确保联系人信息准确性和邮件可达性。
---

# Prospect Manager

VULCA 平台潜在客户检索与管理系统。

## 核心原则

```
❌ 禁止: 推断名字 → 假设职位 → 假设邮箱 → 混淆邮箱用途 → 想当然理解缩写
✅ 必须: 验证全名 → 验证职位 → 确认在职 → 验证邮箱存在+用途 → 验证机构全称
```

**关键规则：**
1. **永远不要从邮箱前缀推断名字** - `rushdi@` 不等于 "Rushdi Shams"
2. **永远不要从域名推断职位** - `eng.ox.ac.uk` 不等于 "VGG 成员"
3. **永远不要使用超过1年的任命新闻作为在职证据**
4. **所有信息必须来自权威来源，不是推断**
5. **永远不要假设邮箱格式** - `partnerships@` 不一定是正确格式，需验证
6. **永远不要止步于第一个结果** - 通用邮箱找到后，继续搜索具体负责人
7. **永远不要混淆邮箱用途** - `observe@arize.com` 是活动邮箱，不是业务邮箱
8. **永远不要采用推测的邮箱** - 只使用官网明确公开的邮箱，若无公开邮箱则标记为"需用联系表单"
9. **永远不要想当然理解缩写** - OxTEC 是 "Technology & Elections" 不是 "Technology & Ethics"

---

## 命令

### `/prospect init`
初始化潜在客户管理系统，创建必要的目录和配置文件。

### `/prospect search`
搜索新的潜在客户。

**参数：**
- `--category`: academic | enterprise | gallery | all
- `--count`: 数量（默认 10）
- `--region`: 地区筛选（可选）

**示例：**
```
/prospect search --category academic --count 10
/prospect search --category enterprise --region "North America"
```

### `/prospect verify <contact-id>`
重新验证单个联系人，执行完整三步验证。

### `/prospect verify-all`
批量验证当前批次所有联系人。

### `/prospect list`
列出联系人。

**参数：**
- `--batch`: 指定批次
- `--status`: new | draft_ready | contacted | replied | converted | rejected
- `--unverified`: 仅显示未完全验证的
- `--score`: 按验证分数筛选 (0-3)

### `/prospect draft <contact-id>`
为联系人生成外联草稿。**验证分数必须 ≥ 2 才允许执行。**

### `/prospect mark <contact-id> <status>`
更新联系状态。

**状态：**
- `contacted`: 已发送外联
- `replied`: 收到回复
- `converted`: 转化成功
- `rejected`: 放弃跟进

### `/prospect stats`
查看统计数据和增量更新提示。

### `/prospect next`
当前批次发送率达到 70% 后，获取下一批潜在客户。

---

## 五步验证流程（强制执行）

对每个潜在客户，必须完成以下验证：

### Step 1: 姓名验证

**输入：** 邮箱地址（如 `rushdi@stanford.edu`）

**执行：**
1. WebSearch: `"rushdi@stanford.edu" full name profile`
2. WebFetch: 官方 Profile 页面（如 Stanford Profiles）
3. WebFetch: LinkedIn Profile（如有）

**验证点：**
- [ ] 全名来自权威来源（官网/LinkedIn），不是推断
- [ ] 邮箱与 Profile 页面匹配
- [ ] 名字格式规范化

**命名规范：**
- 西方名: `First [Middle] Last` (如 "Ahmad A. Rushdi")
- 中文名: `Pinyin_First Pinyin_Last (中文名)` (如 "Jinze Bai (白金泽)")
- 禁止仅首字母: `G. Mallin` → 必须查明全名 "Georgia Mallin"

### Step 2: 职位验证

**输入：** 验证后的姓名 + 机构

**执行：**
1. WebFetch: 机构官网 Team/About/Contact 页面
2. WebFetch: LinkedIn Profile
3. WebSearch: `"姓名" "机构" title role position`

**验证点：**
- [ ] 职位来自官方来源
- [ ] 职位与目标角色匹配（决策者/研究负责人/策展人）
- [ ] 标记非直接相关角色（如 PM vs Researcher）

### Step 3: 在职状态验证

**输入：** 姓名 + 机构 + 职位

**执行：**
1. WebSearch: `"姓名" "机构" 2026`（当前年份）
2. WebSearch: `"机构" "职位" 2026`
3. 检查近6个月是否有离职/调动新闻

**验证点：**
- [ ] 有近期活动确认（演讲、论文、新闻、社交媒体）
- [ ] 无离职/调动公告
- [ ] 任命超过3年需额外验证

**时效性规则：**
- 任命新闻 > 1年: 需要额外确认
- 任命新闻 > 3年: 高风险，必须找到近期活动证据
- 发现离职公告: 立即标记为 outdated，不可联系

### Step 4: 邮箱格式验证

**输入：** 找到的邮箱地址

**执行：**
1. WebSearch: `"@domain.com" contact email format` 确认该机构的邮箱格式规律
2. WebFetch: 机构官网 Contact/Team 页面，查看其他邮箱的格式
3. 对比验证：找到的邮箱格式是否与该机构的标准格式一致

**验证点：**
- [ ] 邮箱格式与机构标准格式一致
- [ ] 不是推断的格式（如假设 `partnerships@` 就是正确格式）
- [ ] 如有疑问，搜索确认实际的部门邮箱

**常见陷阱：**
```
❌ 错误: 假设 partnerships@turing.ac.uk（常见格式）
✅ 正确: partnerships-and-engagement@turing.ac.uk（实际格式）

❌ 错误: 假设 contact@domain.com
✅ 正确: 搜索 "@domain.com" 确认实际使用的格式
```

**邮箱格式验证方法：**
1. 搜索 `site:domain.com "@domain.com"` 查看公开邮箱
2. 查看机构的 Team/Staff 页面，记录邮箱格式规律
3. 如果是 `firstname.lastname@domain.com`，确认名字拼写正确

### Step 5: 联系人深度搜索

**输入：** 找到的第一个联系点（可能是通用邮箱）

**执行：**
1. 如果是通用邮箱（如 `alliances@`, `partnerships@`, `info@`），继续搜索
2. WebSearch: `"机构" "部门" team director manager`
3. WebFetch: 机构的 "Meet Our Team" / "About Us" / "Staff" 页面
4. 寻找该部门的具体负责人

**验证点：**
- [ ] 是否有比通用邮箱更好的联系人？
- [ ] 负责人的个人邮箱是否公开？
- [ ] 个人邮箱优先于通用邮箱

**优先级规则：**
```
最佳: 决策者个人邮箱 (loriglover@csail.mit.edu)
次选: 部门负责人邮箱 (director-partnerships@domain.com)
可用: 部门通用邮箱 (partnerships@domain.com)
最差: 机构通用邮箱 (info@domain.com)
```

**示例：**
```
第一次搜索结果: alliances@csail.mit.edu (通用邮箱)
继续搜索: "CSAIL Alliances team" / "CSAIL Alliances director"
最终结果: Lori Glover, Managing Director → loriglover@csail.mit.edu

回复率预期: 个人邮箱 > 通用邮箱 (高 2-3 倍)
```

### Step 6: 邮箱用途验证

**输入：** 找到的邮箱地址

**执行：**
1. WebSearch: 搜索该邮箱出现的上下文，确认其用途
2. WebFetch: 查看邮箱所在页面，理解该邮箱的实际功能
3. 区分: 活动邮箱 vs 销售邮箱 vs 支持邮箱 vs 业务邮箱

**验证点：**
- [ ] 邮箱是否在官网 Contact/Partnership 页面公开？
- [ ] 邮箱用途是否与我们的目的匹配（业务合作）？
- [ ] 是否为特定活动/项目的专用邮箱？

**常见陷阱：**
```
❌ 错误: observe@arize.com（活动邮箱，用于 Arize:Observe 年度活动）
✅ 正确: 官网 Contact 页面没有公开业务邮箱 → 标记为"需用联系表单"

❌ 错误: partners@hiddenlayer.com（推测的邮箱，官网未公开）
✅ 正确: 官网仅提供联系表单 → 标记为"需用联系表单"
```

**邮箱用途分类：**
| 用途 | 示例 | 是否适合外联 |
|------|------|--------------|
| 业务/合作 | partnerships@, bizdev@ | ✅ 适合 |
| 销售 | sales@, contact@ | ✅ 适合 |
| 活动专用 | observe@, conference@ | ❌ 不适合 |
| 技术支持 | support@, help@ | ❌ 不适合 |
| 推测未验证 | 任何官网未公开的 | ❌ 不可用 |

**无公开邮箱的处理：**
```json
{
  "email": {
    "address": null,
    "type": "contact_form_only",
    "contact_form_url": "https://example.com/contact",
    "note": "官网仅提供联系表单，无公开邮箱"
  }
}
```

### Step 7: 机构名称/缩写验证

**输入：** 机构名称或缩写

**执行：**
1. WebSearch: 搜索机构全称，确认缩写的准确含义
2. WebFetch: 访问机构官网 About 页面，确认完整名称和使命
3. 验证: 确保描述与机构实际研究/业务方向一致

**验证点：**
- [ ] 机构全称是否正确展开？
- [ ] 机构描述是否与官网一致？
- [ ] 机构研究/业务方向是否正确理解？

**常见陷阱：**
```
❌ 错误: OxTEC = "Oxford Technology and Ethics Commission"
✅ 正确: OxTEC = "Oxford Technology and Elections Commission"

❌ 错误: 看到 OII (Oxford Internet Institute) 就假设是伦理研究
✅ 正确: 查看 OxTEC 官网确认是选举技术研究

❌ 错误: HAI = "Human AI"
✅ 正确: HAI = "Human-centered AI" (Stanford HAI)
```

**验证方法：**
1. 搜索 `"机构缩写" full name official`
2. 访问机构官网的 About/Mission 页面
3. 确认机构的核心研究/业务领域

---

## 验证评分标准

| 分数 | 状态 | 条件 | 操作权限 |
|------|------|------|----------|
| 7 | ✅ verified | 七项全部通过 + 有个人邮箱 | 优先联系，高回复率预期 |
| 6 | ✅ verified | 七项全部通过（通用邮箱/表单） | 可联系 |
| 5 | ⚠️ partial | 6项通过，1项未验证 | 可联系，需注意 |
| 4 | ⚠️ partial | 5项通过，2项未验证 | 需人工确认后可联系 |
| 3 | ⚠️ partial | 4项通过，3项未验证 | 需补充验证 |
| 2 | ❓ unverified | 3项及以下通过 | 不建议联系 |
| 1 | ❓ unverified | 存在推测/假设信息 | 禁止联系 |
| 0 | ❌ invalid | 发现错误/过时/不存在的信息 | 禁止联系，标记无效 |

**验证清单：**
```
□ Step 1: 姓名正确（多源交叉验证）
□ Step 2: 职位正确（官网/LinkedIn）
□ Step 3: 在职状态（2025/2026 新闻）
□ Step 4: 邮箱格式（搜索 "@domain.com" 确认实际格式）
□ Step 5: 联系人深度（是否有更好的联系人/个人邮箱）
□ Step 6: 邮箱用途（确认是业务邮箱，非活动/支持邮箱）
□ Step 7: 机构名称（缩写展开正确，描述准确）
```

**特殊情况处理：**
- **无公开邮箱**: 若官网仅提供联系表单，标记 `type: "contact_form_only"`，最高可得 6 分
- **推测邮箱**: 任何未在官网公开的邮箱，一律标记为无效，score = 0
- **活动专用邮箱**: 识别出后标记为不适用，需寻找替代联系方式

**重要：** `/prospect draft` 命令仅对 score ≥ 4 的联系人生效。

---

## 目标客户类别

### Academic（学术机构）
- AI/ML 研究实验室负责人
- 数字人文/艺术科技研究者
- 博物馆数字化部门主管
- 相关领域教授/副教授

**搜索关键词：**
- "AI art research lab director"
- "digital humanities professor"
- "museum digital innovation"
- "visual language model researcher"

### Enterprise（企业客户）
- AI 公司产品/研究负责人
- 科技公司 AI 评估团队
- 艺术科技初创公司
- 数据标注/AI 训练公司

**搜索关键词：**
- "AI model evaluation team lead"
- "art tech startup founder"
- "VLM product manager"

### Gallery（画廊/艺术机构）
- 博物馆馆长/副馆长
- 策展人
- 数字收藏部门负责人
- 艺术品鉴定专家

**搜索关键词：**
- "museum director digital"
- "contemporary art curator technology"
- "art authentication expert AI"

---

## 数据存储

**推荐使用 Markdown 表格格式**（与 wenxin-moyun/docs/ 现有数据兼容）

### 主数据文件位置

```
wenxin-moyun/docs/
├── outreach-leads.md        # 主联系人名单 (Markdown 表格)
├── outreach-leads.csv       # CSV 导出版本
├── outreach-emails-phase1.md # 邮件草稿
└── ...
```

### Markdown 表格格式（推荐）

```markdown
| # | 姓名 | 职务 | 机构 | 邮箱 | LinkedIn | 相关工作链接 | 为什么是他 | 建议CTA | 优先级 | 状态 |
|---|------|------|------|------|----------|--------------|------------|---------|--------|------|
| 1 | Glenn Wong | Interim MD | MIT CSAIL | glennw@mit.edu | - | [CSAIL](url) | 说明 | 10min Call | High | 待联系 |
```

### 可选：JSON 详细数据（用于复杂验证跟踪）

存储在 `.vulca-prospects/` 目录：

```
.vulca-prospects/
├── config.json              # 配置文件
├── stats.json               # 统计数据
├── verification/            # 验证记录
│   └── {contact-id}.json
├── templates/               # 外联模板
│   ├── academic.md
│   ├── enterprise.md
│   └── gallery.md
└── drafts/                  # 生成的草稿
    └── {contact-id}-{date}.md
```

### 联系人数据结构

```json
{
  "id": "uuid",
  "batch_id": "batch-001",
  "category": "academic",

  "company": {
    "name": "Stanford HAI",
    "website": "https://hai.stanford.edu",
    "industry": "AI Research",
    "size": "100-500"
  },

  "contact": {
    "name": {
      "full_name": "Glenn Wong",
      "display_name": "Glenn Wong",
      "format": "western",
      "verified": true
    },
    "title": "Interim Managing Director, Global Strategic Alliances",
    "email": {
      "address": "glennw@mit.edu",
      "type": "personal",
      "format_verified": true
    },
    "linkedin": "https://linkedin.com/in/xxx",
    "alternative_emails": [
      {
        "address": "alliances@csail.mit.edu",
        "type": "generic",
        "note": "部门通用邮箱，回复率较低"
      }
    ],
    "note": "Lori Glover 于 2026/01 离职加入 Columbia DSI，Glenn Wong 接任"
  },

  "verification": {
    "status": "verified",
    "score": 5,
    "checks": {
      "name_verified": {
        "passed": true,
        "source": "MIT CSAIL Team Page",
        "url": "https://www.csail.mit.edu/about/staff",
        "date": "2026-01-21"
      },
      "title_verified": {
        "passed": true,
        "source": "LinkedIn",
        "url": "https://linkedin.com/in/xxx",
        "date": "2026-01-21"
      },
      "employment_current": {
        "passed": true,
        "source": "WebSearch",
        "query": "Lori Glover CSAIL 2026",
        "date": "2026-01-21"
      },
      "email_format_verified": {
        "passed": true,
        "source": "CSAIL Staff Directory",
        "url": "https://www.csail.mit.edu/about/staff",
        "note": "确认 CSAIL 邮箱格式为 username@csail.mit.edu",
        "date": "2026-01-21"
      },
      "contact_depth": {
        "passed": true,
        "source": "CSAIL Alliances Team Page",
        "note": "从通用邮箱 alliances@ 深挖到负责人个人邮箱",
        "original_contact": "alliances@csail.mit.edu",
        "improved_contact": "loriglover@csail.mit.edu",
        "date": "2026-01-21"
      }
    },
    "warnings": [],
    "last_verified": "2026-01-21"
  },

  "qualification": {
    "fit_score": 8,
    "pain_points": ["需要标准化 AI 模型评估"],
    "value_proposition": "VULCA 47维度评估体系提供全面对比"
  },

  "status": "new",
  "outreach": {
    "channel": null,
    "draft_path": null,
    "sent_date": null,
    "follow_up_date": null,
    "notes": []
  },

  "created_at": "2026-01-21",
  "updated_at": "2026-01-21"
}
```

---

## 增量更新机制

**触发条件：** 当前批次发送率 (contacted/total) ≥ 70%

**stats.json 结构：**
```json
{
  "current_batch": "batch-001",
  "batch_size": 10,
  "threshold": 0.7,
  "batches": {
    "batch-001": {
      "total": 10,
      "contacted": 7,
      "replied": 2,
      "converted": 1,
      "contact_rate": 0.7,
      "status": "threshold_reached"
    }
  }
}
```

**流程：**
1. `/prospect stats` 检查当前批次状态
2. 如果 contact_rate ≥ 0.7，提示可以获取下一批
3. `/prospect next` 自动创建新批次并搜索

---

## 外联模板

### Academic 模板

```markdown
Subject: VULCA - AI 艺术评估研究合作邀请

Dear {{formal_name}},

I came across your work on {{research_area}} at {{company.name}}, and I believe there may be an interesting synergy with what we're building at VULCA.

VULCA is an open-source AI model benchmarking platform that evaluates 42 models across 47 dimensions and 8 cultural perspectives. Given your focus on {{pain_points}}, I thought this might be relevant to your research.

Specifically, VULCA could help with:
- {{value_proposition}}

Would you be open to a 30-minute call to explore potential collaboration?

Booking link: https://cal.com/vulcaart/demo

Best regards,
Yu Haorui
VULCA Team
https://vulcaart.art
```

### Enterprise 模板

```markdown
Subject: VULCA - Standardized AI Model Evaluation for {{company.name}}

Hi {{first_name}},

I noticed {{company.name}} is working on {{industry_focus}}. As someone leading {{title}}, you might find VULCA's capabilities relevant.

VULCA provides:
- 47-dimension evaluation framework
- Cross-model comparison (42 models from 15 organizations)
- Cultural perspective analysis (8 perspectives)

{{value_proposition}}

Would a quick demo be helpful?

Book a time: https://cal.com/vulcaart/demo

Best,
Yu Haorui
VULCA Team
```

### Gallery 模板

```markdown
Subject: AI-Powered Art Evaluation - VULCA Platform Demo

Dear {{formal_name}},

I'm reaching out regarding {{company.name}}'s digital initiatives. VULCA is an AI art evaluation platform that might align with your work in {{focus_area}}.

Our platform offers:
- Comprehensive AI model benchmarking for art understanding
- Multi-cultural perspective analysis
- Standardized evaluation metrics

{{value_proposition}}

I'd welcome the opportunity to demonstrate how VULCA could support {{company.name}}'s digital strategy.

Schedule a demo: https://cal.com/vulcaart/demo

Kind regards,
Yu Haorui
VULCA Team
```

---

## 验证失败处理

当验证发现问题时，自动处理如下：

### 信息过时
```json
{
  "verification": {
    "status": "outdated",
    "score": 0,
    "checks": {
      "employment_current": {
        "passed": false,
        "reason": "离职公告: 2026年春离任",
        "source": "https://example.com/news"
      }
    },
    "warnings": ["此联系人即将离职，不建议联系"]
  },
  "status": "rejected",
  "rejection_reason": "employment_outdated"
}
```

### 职位不匹配
```json
{
  "verification": {
    "status": "partial",
    "score": 2,
    "checks": {
      "title_verified": {
        "passed": true,
        "source": "LinkedIn",
        "warning": "非直接研究联系人，是行政管理角色"
      }
    },
    "warnings": ["职位为 Programme Manager，非研究人员"]
  }
}
```

---

## 使用示例

### 完整工作流程

```bash
# 1. 初始化
/prospect init

# 2. 搜索学术机构联系人
/prospect search --category academic --count 10

# 3. 查看验证结果
/prospect list --batch batch-001

# 4. 为高分联系人生成草稿
/prospect draft abc-123

# 5. 标记已联系
/prospect mark abc-123 contacted

# 6. 检查进度
/prospect stats

# 7. 达到 70% 后获取下一批
/prospect next
```

### 单独验证联系人

```bash
# 重新验证特定联系人
/prospect verify abc-123

# 批量验证
/prospect verify-all
```

---

## 重要提醒

1. **质量优先于数量** - 宁可少几个联系人，也要确保信息准确
2. **验证不通过不联系** - score < 2 的联系人禁止生成草稿
3. **定期重新验证** - 超过 30 天的联系人建议重新验证在职状态
4. **记录验证来源** - 每个验证点都要记录 URL 和日期
5. **人工判断兜底** - partial 状态需要人工确认后再决定是否联系
