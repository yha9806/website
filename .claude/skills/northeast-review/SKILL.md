---
name: northeast-review
description: 东北展AI艺术评论生成系统 - 为18件当代艺术作品生成跨文化评论对话
---

# Northeast Art Review Generator

为"东北亚记忆"展览生成深度艺术评论对话。

## 展览概述

- **展览名称**: Northeast Asia Memory / 东北亚记忆
- **艺术家数量**: 18位
- **作品数量**: 18件
- **主题**: 记忆、身份、流动、离散、边界

## 命令

### `/northeast review <artist-name>`
为单件作品生成评论对话。

**参数：**
- `<artist-name>`: 艺术家姓名（支持模糊匹配）

**示例：**
```
/northeast review jade
/northeast review jiaqi_lyu
/northeast review "Zhenghang Fu"
```

### `/northeast review-all`
批量生成全部18件作品的评论。

**选项：**
- `--skip-no-image`: 跳过无图片的作品（Fanglin Luo, Shuyi Alice Wang）
- `--chapter <id>`: 仅生成指定章节的作品

### `/northeast list`
列出所有艺术家和作品。

### `/northeast export`
导出所有对话为JSON格式。

**输出位置：** `Didot_exhibition_Dec/northeast-dialogues.json`

### `/northeast status`
查看生成进度。

---

## 数据文件位置

- **展览数据**: `Didot_exhibition_Dec/northeast-asia.json`
- **图片目录**: `.playwright-mcp/northeast-exhibition-images/`
- **对话输出**: `Didot_exhibition_Dec/northeast-dialogues.json`

---

## 展览章节

| ID | 英文名 | 中文名 | 艺术家 |
|----|--------|--------|--------|
| 1 | Historical Memory & Ghost Narratives | 历史记忆与幽灵叙事 | Jiaqi Lyu, Zhenghang Fu, Jungyun Lee |
| 2 | Family & Personal Archives | 家庭与个人档案 | Shunshun Qi, Xiaoze Zhang, Shuyi Alice Wang, Jade Xiaojing Gu |
| 3 | Border, Identity & Displacement | 边界、身份与流动 | Ziyan Liu, Yizheng Liu, Bomin Kim, Kyra Zhang |
| 4 | Material & Sensory Memory | 物质与感官记忆 | Evey Sun, Sihong Liu, Yusuke Kuriki, Rikuto Fujimoto, Fanglin Luo, Yiwen Liang, Zengbo Qi |

---

## 评论家角色

### 专属角色（为东北展定制）

#### 1. 东北史学家 (northeast_historian)
- **名称**: Prof. Zhang Wei / 张伟教授
- **类型**: fictional
- **视角**: 工业史、城市变迁、人口流动
- **风格**: 结合历史视角与社会学分析，关注结构性变迁

**评论要点：**
- 将作品置于东北百年工业化与去工业化的历史脉络中
- 关注人口流动、城市收缩、产业转型的社会结构
- 思考作品如何回应"东北振兴"的宏大叙事
- 注意个人记忆与集体历史的张力

#### 2. 离散诗人 (diaspora_poet)
- **名称**: Han Xue / 韩雪
- **类型**: fictional
- **视角**: 乡愁、记忆、文化认同
- **风格**: 诗意语言，关注情感与身体记忆

**评论要点：**
- 用诗意语言捕捉作品中的情感肌理
- 关注乡愁、记忆、身份认同的主题
- 思考"家乡"作为物理空间与心理状态的双重意义
- 注意身体记忆：气味、味道、触感、声音

**关键意象：**
- "东北人的成年礼是一张南下的车票"
- "如果一个东北人说想吃锅包肉，那他是在说他想家了"

#### 3. 感官档案员 (sensory_archivist)
- **名称**: Li Mei / 李梅
- **类型**: fictional
- **视角**: 物质文化与感官人类学
- **风格**: 关注日常生活的物质性与感官体验

**评论要点：**
- 关注作品如何调动五感：视觉、听觉、嗅觉、味觉、触觉
- 思考物质文化如何承载记忆与情感
- 注意食物、声音、气味、温度等日常元素
- 分析感官体验如何构建地方认同

**关键意象：**
- "冻梨的冰凉触感，是东北人共同的童年密码"
- "锅包肉的酸甜，不仅是味觉，更是一种情感结构"

#### 4. 边界理论家 (border_theorist)
- **名称**: Dr. Park Jiyeon / 朴智妍博士
- **类型**: fictional
- **视角**: 跨国主义与边界研究，东北亚流动性
- **风格**: 批判性思考，关注权力、边界与身份的交织

**评论要点：**
- 从跨国视角思考作品中的身份与边界问题
- 关注中日韩俄之间的历史记忆与当代交流
- 思考流动性如何重塑地方认同
- 注意殖民历史、冷战遗产、全球化的多重影响

### 可复用角色（来自现有系统）

| ID | 名称 | 适用场景 |
|----|------|----------|
| su_shi | 苏轼 | 中国古典美学、诗画关系 |
| okakura_tenshin | 冈仓天心 | 东亚美学、跨文化对话 |
| mama_zola | Mama Zola | 口述传统、集体记忆 |
| guo_xi | 郭熙 | 山水画、空间关系 |

---

## 角色组合策略

| 作品类型 | 推荐角色组合 |
|----------|--------------|
| 历史记忆类 | northeast_historian + diaspora_poet + su_shi |
| 感官记忆类 | sensory_archivist + diaspora_poet + mama_zola |
| 身份流动类 | border_theorist + diaspora_poet + okakura_tenshin |
| 家庭档案类 | diaspora_poet + sensory_archivist + mama_zola |
| 跨国叙事类 | border_theorist + okakura_tenshin + northeast_historian |

---

## 对话生成流程

### 单件作品流程

```
/northeast review jade_xiaojing_gu

执行步骤：
1. 读取作品数据：东北书 / A Book of Northeast China
2. 阅读完整描述：五感结构、手工书形式、个人与集体记忆
3. 根据作品类型选择3位评论家
4. 生成6轮对话：
   - 第1轮：开场者以关键问题或观察切入
   - 第2轮：第二位评论家回应或补充
   - 第3轮：第三位评论家加入，提供新视角
   - 第4-6轮：深入对话，形成共鸣或辩证
5. 输出JSON格式对话
```

### 对话生成规则

1. **语言**: 中英双语（主体中文，关键术语保留英文）
2. **轮次**: 6轮
3. **参与者**: 3位评论家
4. **字数**: 每轮 50-150 字
5. **结构**: 观点 → 回应 → 深化 → 对话 → 共识/分歧 → 总结

### 输出格式

```json
{
  "artwork_id": 18,
  "artwork_title": "东北书 / A Book of Northeast China",
  "artist": "Jade Xiaojing Gu",
  "participants": ["diaspora_poet", "sensory_archivist", "su_shi"],
  "turns": [
    {
      "turn": 1,
      "speaker": "diaspora_poet",
      "speaker_name": "韩雪",
      "content": "这本手工书让我想起那句话...",
      "language": "zh"
    }
  ],
  "generated_at": "2026-01-26T...",
  "chapter": "Family & Personal Archives"
}
```

---

## 特殊处理

### 无图片作品
以下艺术家仅使用文字资料生成：
- **Fanglin Luo**: 仅文字描述
- **Shuyi Alice Wang**: 仅文字描述

生成时设置 `include_images: false`

### 外部链接图片
部分作品图片存储在外部：
- Xiaoze Zhang: Google Drive
- Ziyan Liu: Google Drive
- Yusuke Kuriki: 个人网站
- Kyra Zhang: Google Drive
- Yizheng Liu: Google Drive
- Rikuto Fujimoto: Dropbox
- Yiwen Liang: 个人网站
- Jungyun Lee: YouTube

优先使用已下载的嵌入图片，外部链接作为备用参考。

---

## 质量检查清单

生成后验证：
- [ ] 对话内容与作品主题相关
- [ ] 每位评论家保持一致的视角和风格
- [ ] 对话有逻辑推进，不是各说各话
- [ ] 语言自然，避免机械感
- [ ] 东北文化元素准确（如方言、习俗、历史事件）
- [ ] 字数符合要求（50-150字/轮）

---

## 错误处理

| 错误 | 处理 |
|------|------|
| 艺术家未找到 | 显示可用艺术家列表 |
| 图片无法加载 | 仅使用文字描述生成 |
| API 超时 | 自动重试，最多3次 |
| 生成内容过短 | 要求扩展并重新生成 |

---

## 使用示例

```bash
# 查看所有艺术家
/northeast list

# 为单件作品生成评论
/northeast review jade

# 批量生成全部作品
/northeast review-all

# 仅生成有图片的作品
/northeast review-all --skip-no-image

# 仅生成第2章节的作品
/northeast review-all --chapter 2

# 导出对话
/northeast export

# 查看进度
/northeast status
```
