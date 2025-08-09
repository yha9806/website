# 文心墨韵前端架构综述

## 项目概述

**文心墨韵 (Wenxin Moyun)** 是一个 AI 艺术创作评测平台，专注于评估 AI 模型在诗歌、绘画、叙事等艺术创作领域的能力。平台结合了传统中国美学与现代 AI 技术，提供全方位的模型评测、对战、排行榜等功能。

### 核心特性
- 🎨 **艺术中国风视觉设计** - 融合传统水墨美学与现代渐变效果
- 🤖 **双认证模式** - 支持 JWT 登录用户和游客会话（每日限额）
- 📊 **实时数据可视化** - 使用 Recharts 展示评测结果和模型对比
- ⚡ **响应式架构** - 移动端优先，支持多设备适配
- 🎯 **模块化组件系统** - 基于 React 19 的现代组件架构

## 技术栈分析

### 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19.1.1 | 最新版核心框架，支持并发特性 |
| **TypeScript** | 5.8.3 | 类型安全，提升开发体验 |
| **Vite** | 7.1.0 | 超快速构建工具，HMR 支持 |
| **React Router DOM** | 7.8.0 | 客户端路由管理 |

### UI 与样式
| 技术 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 4.1.11 | 原子化 CSS 框架，支持自定义主题 |
| **Framer Motion** | 12.23.12 | 高性能动画库，页面过渡效果 |
| **Lucide React** | 0.539.0 | 精美的 SVG 图标库 |
| **@headlessui/react** | 2.0.0 | 无样式 UI 组件，完全可定制 |

### 数据可视化
| 技术 | 版本 | 用途 |
|------|------|------|
| **Recharts** | 3.1.2 | 声明式图表组件库 |
| **D3.js** | 相关模块 | 底层数据处理和高级可视化 |

### 状态管理与数据流
| 技术 | 版本 | 用途 |
|------|------|------|
| **Zustand** | 4.4.0 | 轻量级状态管理，支持持久化 |
| **Axios** | 1.11.0 | HTTP 客户端，拦截器支持 |
| **React Hot Toast** | 2.4.0 | 优雅的通知系统 |

### 开发工具
| 技术 | 版本 | 用途 |
|------|------|------|
| **ESLint** | 9.32.0 | 代码质量检查 |
| **PostCSS** | 8.5.6 | CSS 处理管道 |
| **Autoprefixer** | 10.4.21 | 自动添加浏览器前缀 |

## 项目结构

```
wenxin-moyun/
├── src/
│   ├── main.tsx                 # 应用入口，全局错误处理
│   ├── App.tsx                  # 路由配置中心
│   ├── index.css                # 全局样式和设计系统
│   │
│   ├── pages/                   # 页面组件（9个主要页面）
│   │   ├── HomePage.tsx         # 首页 - 平台介绍
│   │   ├── LeaderboardPage.tsx  # 排行榜 - 模型排名
│   │   ├── ModelDetailPage.tsx  # 模型详情 - 能力展示
│   │   ├── BattlePage.tsx       # 模型对战 - 实时PK
│   │   ├── EvaluationsPage.tsx  # 评测管理 - CRUD操作
│   │   ├── ComparePage.tsx      # 模型对比 - 多维分析
│   │   ├── DashboardPage.tsx    # 数据仪表盘
│   │   ├── AboutPage.tsx        # 关于页面
│   │   └── LoginPage.tsx        # 登录页面（独立布局）
│   │
│   ├── components/              # 可复用组件库
│   │   ├── common/              # 通用布局组件
│   │   │   ├── Layout.tsx       # 主布局容器（动态背景）
│   │   │   ├── Header.tsx       # 导航栏
│   │   │   └── Footer.tsx       # 页脚
│   │   │
│   │   ├── evaluation/          # 评测相关组件
│   │   │   ├── CreateEvaluationModal.tsx
│   │   │   ├── EvaluationCard.tsx
│   │   │   ├── ProgressVisualizer.tsx
│   │   │   └── ScoringAssistant.tsx
│   │   │
│   │   ├── charts/              # 数据可视化组件
│   │   │   ├── ComparisonRadar.tsx    # 雷达图
│   │   │   ├── ScoreDistribution.tsx  # 柱状图
│   │   │   ├── DonutProgress.tsx      # 环形进度图
│   │   │   └── RangeBar.tsx           # 区间条图
│   │   │
│   │   ├── auth/                # 认证组件
│   │   │   ├── LoginModal.tsx   # 登录弹窗
│   │   │   └── LoginPrompt.tsx  # 智能登录提示
│   │   │
│   │   └── ...                  # 其他业务组件
│   │
│   ├── hooks/                   # 自定义 Hooks（业务逻辑抽象）
│   │   ├── useEvaluations.ts    # 评测数据管理
│   │   ├── useModels.ts         # 模型数据管理
│   │   ├── useLoginPrompt.ts    # 登录提示逻辑
│   │   ├── useGuestTracking.ts  # 游客行为追踪
│   │   └── ...
│   │
│   ├── services/                # API 服务层
│   │   ├── api.ts               # Axios 实例与拦截器
│   │   ├── evaluations.service.ts
│   │   ├── models.service.ts
│   │   ├── auth.service.ts
│   │   └── ...
│   │
│   ├── store/                   # Zustand 状态管理
│   │   ├── uiStore.ts           # UI 状态（视图模式、排序）
│   │   └── filterStore.ts       # 过滤器状态
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   └── types.ts             # 核心业务类型
│   │
│   ├── utils/                   # 工具函数
│   │   └── guestSession.ts      # 游客会话管理
│   │
│   └── config/                  # 配置文件
│       └── chartTheme.ts        # 图表主题配置
```

## 路由架构

```typescript
路由结构：
/                          # 首页
/login                     # 登录页（无 Layout）
/leaderboard[/:category]   # 排行榜（支持分类筛选）
/model/:id                 # 模型详情页
/battle                    # 模型对战
/compare                   # 模型对比
/dashboard                 # 数据仪表盘
/evaluations              # 评测管理
/about                    # 关于页面
```

### 路由特性
- **嵌套路由** - 使用 Layout 组件包裹主要页面
- **动态路由** - 支持参数化路由（如模型 ID、分类）
- **独立布局** - 登录页使用独立布局，无导航栏/页脚

## 设计系统

### 色彩体系

#### 主色调
- **Primary (#0052CC)** - 深蓝色，传递专业科技感
- **Accent (#FF8B00)** - 橙色，用于强调和 CTA
- **Success (#36B37E)** - 绿色，成功状态
- **Warning (#FFAB00)** - 黄色，警告提示
- **Error (#FF5630)** - 红色，错误状态

#### 中性色阶（8级灰度）
```
#FAFBFC → #F4F5F7 → #EBECF0 → #DFE1E6 → #C1C7D0 → #A5ADBA → #6B778C → #505F79 → #253858 → #091E42
```

#### 中国传统色彩
- 朱红 (#C73E3A)
- 金黄 (#D4A76A)
- 翡翠绿 (#3EB370)
- 墨黑 (#2B2B2B)

### 动画系统

#### 水墨动画效果
- **float (20s)** - 基础漂浮动画
- **float-delayed (25s)** - 延迟漂浮，5s 延迟
- **float-slow (30s)** - 缓慢漂浮，10s 延迟

#### 交互动画
- **按钮点击** - scale(0.96) 压下效果
- **卡片悬停** - translateY(-4px) + shadow 增强
- **数据更新** - highlightFlash 0.6s 闪烁提示
- **页面过渡** - Framer Motion 淡入淡出

### 响应式断点
```css
xs: 475px   # 超小屏
sm: 640px   # 手机
md: 768px   # 平板
lg: 1024px  # 桌面
xl: 1280px  # 大屏
2xl: 1536px # 超大屏
3xl: 1920px # 4K 显示器
```

### 组件样式规范
- **圆角** - 按钮 8px，卡片 12px
- **阴影** - 多层次阴影系统，增强层次感
- **间距** - 8px 倍数系统（8/16/24/32px）
- **玻璃态** - backdrop-blur + 半透明背景

## 数据流架构

### 1. API 层（Services）
```typescript
API 请求流程：
Component → Custom Hook → Service → Axios Instance → Backend API
                                          ↓
                                    拦截器处理
                                    (认证/错误处理)
```

### 2. 状态管理（Zustand）

#### UI Store
- 视图模式（卡片/紧凑/详细）
- 排序方式和顺序
- 侧边栏/过滤面板状态
- 持久化存储支持

#### Filter Store
- 搜索关键词
- 组织/类别筛选
- 分数范围
- 标签过滤
- 动态过滤函数

### 3. 认证系统

#### 双模式认证
```typescript
用户类型：
1. 注册用户 - JWT Token 认证
   - 完整功能访问
   - 数据持久化
   
2. 游客用户 - UUID Session
   - 每日 3 次评测限额
   - 会话级数据存储
   - 智能登录提示
```

#### 智能登录提示触发场景
- **limit_reached** - 达到每日限额
- **save_progress** - 多次操作后建议保存
- **share_result** - 尝试分享结果
- **advanced_features** - 访问高级功能

### 4. 数据缓存策略
- **SessionStorage** - 游客会话数据
- **LocalStorage** - 用户偏好、认证令牌
- **Zustand Persist** - UI 状态持久化

## 核心功能模块

### 1. 评测系统
- **创建评测** - 支持诗歌/故事/绘画/音乐四种类型
- **进度追踪** - 实时显示处理进度
- **评分参考** - AI 辅助评分建议
- **人工评分** - 支持用户自定义评分

### 2. 模型对战
- **实时 PK** - 两个模型同任务对比
- **投票系统** - 用户参与决定胜负
- **历史记录** - 对战结果存档

### 3. 排行榜系统
- **多维度排名** - 总分/分类/胜率
- **实时更新** - 动态数据刷新
- **趋势分析** - 排名变化追踪

### 4. 数据可视化
- **雷达图** - 六维能力对比
- **柱状图** - 分数分布
- **环形图** - 进度展示
- **区间图** - AI 参考分范围

## 性能优化

### 构建优化
- **Vite** - 极速 HMR，按需编译
- **代码分割** - 路由级懒加载
- **Tree Shaking** - 自动移除无用代码

### 运行时优化
- **React 19** - 自动批处理，并发特性
- **虚拟列表** - react-window 大列表优化
- **图片懒加载** - Intersection Observer API
- **防抖节流** - 搜索和滚动优化

### 网络优化
- **请求拦截** - 统一错误处理
- **请求重试** - 登录后自动重试
- **缓存策略** - 合理使用浏览器缓存

## 开发工具链

### 开发命令
```bash
npm run dev       # 启动开发服务器（端口自增）
npm run build     # TypeScript 检查 + 生产构建
npm run lint      # ESLint 代码检查
npm run preview   # 预览生产版本
```

### 环境变量
```env
VITE_API_BASE_URL=http://localhost:8001  # API 基础地址
VITE_API_VERSION=v1                      # API 版本
VITE_API_TIMEOUT=30000                   # 请求超时时间
```

### 常见问题处理
1. **端口冲突** - Vite 自动递增端口（5173→5174→5175）
2. **模块导入错误** - 使用 `import type` 导入类型
3. **Tailwind 未生效** - 清理 `.vite` 缓存
4. **Promise 错误** - 全局错误处理器自动捕获

## 部署架构

### Docker 部署
- **开发环境** - Dockerfile.dev + 热重载
- **生产环境** - Nginx 静态服务 + gzip 压缩

### 构建产物
```
dist/
├── index.html          # 入口 HTML
├── assets/
│   ├── index-[hash].js    # 主包
│   ├── index-[hash].css   # 样式
│   └── vendor-[hash].js   # 第三方库
└── favicon.ico
```

## 未来规划

### 技术债务
- [ ] 添加单元测试（Vitest）
- [ ] 集成 E2E 测试（Playwright）
- [ ] 完善错误边界处理
- [ ] 优化 Bundle 大小

### 功能增强
- [ ] WebSocket 实时通信
- [ ] PWA 离线支持
- [ ] 国际化（i18n）
- [ ] 暗黑模式切换

### 性能提升
- [ ] Service Worker 缓存
- [ ] 图片 CDN 集成
- [ ] SSR/SSG 支持
- [ ] Web Vitals 监控

## 总结

文心墨韵前端采用最新的 React 19 + TypeScript + Vite 技术栈，结合 Tailwind CSS 实现了独特的中国风视觉设计。通过 Zustand 轻量级状态管理和完善的服务层架构，实现了清晰的数据流。双认证模式既保证了用户体验，又提供了增长转化的机会。整体架构模块化程度高，易于维护和扩展。