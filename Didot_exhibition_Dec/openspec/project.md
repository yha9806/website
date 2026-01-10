# Project Context

## Purpose
Echoes and Returns (回响与归来) - 艺术展览数据与AI对话生成系统。为87件当代艺术作品生成多角色艺术评论对话，提供API供第三方开发者使用。

## Tech Stack
- **Backend**: Python 3.12, FastAPI, Pydantic
- **Database**: LanceDB (向量数据库)
- **AI**: Anthropic Claude API (多模态)
- **Storage**: 阿里云OSS (图像)
- **Embedding**: sentence-transformers (MiniLM)

## Project Conventions

### Code Style
- Python: PEP 8, type hints required
- 文件命名: snake_case
- 类命名: PascalCase
- 常量: UPPER_SNAKE_CASE

### Architecture Patterns
- Service层模式 (`services/`)
- Pydantic数据验证 (`models/`, `schemas/`)
- FastAPI路由分离 (`api/`)
- 配置与代码分离

### Testing Strategy
- 单元测试: pytest
- 集成测试: 真实API调用
- 数据验证: Pydantic schema

### Git Workflow
- 分支: feature/* → develop → main
- Commit: 类型(范围): 描述

## Domain Context

### 展览信息
- **名称**: Echoes and Returns (回响与归来)
- **作品数**: 87件
- **艺术家**: 72位
- **章节**: 4个主题
  - Cultural Transmission & Regeneration (26)
  - Personal Archives & Family Memories (21)
  - Mythic Narratives & Symbolic Rewriting (21)
  - Forgetting, Absence & Loss (19)

### 角色系统 (9个Personas)
| ID | 名称 | 类型 | 地区 |
|----|------|------|------|
| basic | Basic | system | - |
| su_shi | 苏轼 | real | China |
| guo_xi | 郭熙 | real | China |
| john_ruskin | John Ruskin | real | England |
| okakura_tenshin | 冈仓天心 | real | Japan |
| dr_aris_thorne | Dr. Aris Thorne | fictional | Global |
| mama_zola | Mama Zola | fictional | West Africa |
| prof_elena_petrova | Prof. Elena Petrova | fictional | Russia |
| brother_thomas | Brother Thomas | fictional | Greece |

### 对话生成要求
1. 角色间互动对话 (不是独立评论)
2. 引用正确的艺术史文献
3. 展示思维链和态度立场
4. 多语言支持 (zh/en/ja/ru...)
5. URL标记系统

## Important Constraints

### 技术约束
- Claude API速率限制: ~60 requests/min
- LanceDB本地存储，无外部服务依赖
- 图像通过OSS URL访问

### 数据约束
- 87作品 × 9角色 × 多轮 = 783+ 对话
- 每对话2-4个角色参与
- 30%+发言需要文献引用

### 业务约束
- API需对外开放 (API Key认证)
- 数据为第三方调用核心资产

## External Dependencies

### APIs
- Anthropic Claude API (对话生成)
- 阿里云OSS (图像存储)

### 数据来源
- 展览数据: `Didot_exhibition_Dec/Echoes and Returns.json`
- 角色定义: `wenxin-backend/app/exhibition/models/persona.py`

## 目录结构
```
wenxin-backend/
├── app/exhibition/
│   ├── models/       # 数据模型
│   ├── services/     # 业务逻辑
│   ├── schemas/      # API响应schema
│   └── api/          # FastAPI路由
├── data/exhibition/  # LanceDB存储
└── scripts/          # 批量处理脚本
```
