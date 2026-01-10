# 文心墨韵 (WenXin MoYun) 项目状态快照

**日期**: 2026-01-09
**记录人**: Claude Opus 4.5

---

## 一、项目概述

**项目名称**: 文心墨韵 - AI艺术创作评测与可视化平台
**核心定位**: 42个AI模型跨15个组织的统一评测平台，集成VULCA 47维文化评估框架
**学术支撑**: EMNLP 2025 Findings 论文

---

## 二、技术架构

### 前端 (wenxin-moyun)
- **框架**: React 19.1.1 + TypeScript 5.8
- **构建**: Vite 7.1 + Tailwind CSS 4.1
- **设计**: 完整iOS设计系统 (16+ 核心组件)
- **代码量**: 129 个文件, 65+ 组件, 14 个页面
- **测试**: Playwright E2E (64 测试用例)

### 后端 (wenxin-backend)
- **框架**: FastAPI 0.116 + async SQLAlchemy 2.0
- **数据库**: SQLite(开发) / PostgreSQL 15(生产)
- **缓存**: Redis 5.0
- **代码量**: 110 个Python模块, 40+ API端点
- **AI集成**: 8个提供商 (OpenAI, Anthropic, Google, etc.)

### VULCA 评测框架
- **基础维度**: 6D (creativity, technique, emotion, context, innovation, impact)
- **扩展维度**: 47D (通过相关性矩阵智能扩展)
- **文化视角**: 8种 (Western, Eastern, African, Latin American, etc.)
- **模型档案**: 42个AI模型个性化特征档案

---

## 三、功能完成度

### 已完成 (95%+)
- iOS设计系统: 100%
- 页面框架: 100%
- VULCA后端: 100%
- API系统: 100%
- 数据模型: 100%
- 认证系统: 100%
- 缓存系统: 100%
- CI/CD: 100%

### 部分完成 (60-90%)
- VULCA前端可视化: 85% (47D维度名称空格问题)
- 生产部署: 85% (VULCA功能未部署到生产)
- Exhibition模块: 60% (需要sentence-transformers)

---

## 四、当前问题清单

### 严重 (P0)
1. **生产环境VULCA功能缺失** - 所有生产用户无法使用47D评测
2. **前端VULCA数据流断裂** - model_id格式不兼容 (UUID vs 整数)

### 高优先级 (P1)
3. **47D维度名称空格问题** - 47%的维度显示camelCase
4. **Exhibition模块依赖缺失** - 需要sentence-transformers

### 中等优先级 (P2)
5. **DEBUG代码未清理** - 生产代码中有调试输出
6. **加密功能未实现** - TODO注释待实现

---

## 五、部署状态

### 生产环境
- **前端**: https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/ ✅
- **后端**: https://wenxin-moyun-api-229980166599.asia-east1.run.app ✅
- **VULCA功能**: ❌ 缺失

### 本地环境 (2026-01-09)
- **前端**: http://localhost:5175 ✅ 运行中
- **后端**: http://localhost:8001 ✅ 运行中
- **数据库**: SQLite (wenxin.db) ✅

---

## 六、项目健康度

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | 85% | 本地完成，生产缺VULCA |
| 代码质量 | 70% | DEBUG未清理，有重复 |
| 测试覆盖 | 65% | E2E完整，单元测试不足 |
| 生产就绪 | 40% | VULCA功能生产缺失 |
| 文档完整性 | 90% | 文档详细完善 |

---

## 七、关键文件

- 前端入口: wenxin-moyun/src/App.tsx
- 后端入口: wenxin-backend/app/main.py
- VULCA核心: wenxin-backend/app/vulca/core/vulca_core_adapter.py
- VULCA前端: wenxin-moyun/src/components/vulca/VULCAVisualization.tsx
- 部署配置: docker-compose.prod.yml

---

## 八、待办事项

### 本周
- [ ] 修复生产环境VULCA部署
- [ ] 修复前端model_id格式兼容性

### 本月
- [ ] 修复47D维度名称空格问题
- [ ] 清理DEBUG代码
- [ ] 安装sentence-transformers启用Exhibition

---

**快照完成时间**: 2026-01-09 23:15 UTC+8
