# 文心墨韵 - AI 艺术创作能力评测平台

一个专业的 AI 模型艺术创作能力评测平台，专注于评测 AI 在诗歌、绘画、叙事等艺术领域的创造力、美学价值和文化契合度。

## 功能特性

- **综合排行榜**: 展示所有模型在人文艺术领域的综合排名
- **垂直分类榜单**: 包括诗词创作、绘画艺术、叙事文学、音乐创作等细分领域
- **模型详情页**: 展示模型的能力雷达图、详细评分和代表作品
- **模型对决**: 用户可以参与投票，对比不同模型的创作能力
- **响应式设计**: 完美适配桌面和移动设备

## 技术栈

- **前端框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **路由**: React Router DOM
- **图表**: Recharts
- **动画**: Framer Motion
- **图标**: Lucide React
- **构建工具**: Vite

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
wenxin-moyun/
├── src/
│   ├── components/      # 组件
│   │   ├── common/      # 通用组件（Header, Footer, Layout）
│   │   ├── leaderboard/ # 排行榜相关组件
│   │   ├── model/       # 模型相关组件
│   │   └── battle/      # 对决相关组件
│   ├── pages/           # 页面组件
│   │   ├── HomePage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── ModelDetailPage.tsx
│   │   ├── BattlePage.tsx
│   │   └── AboutPage.tsx
│   ├── data/            # 模拟数据
│   ├── types/           # TypeScript 类型定义
│   ├── hooks/           # 自定义 React Hooks
│   └── utils/           # 工具函数
├── public/              # 静态资源
└── index.html          # HTML 入口文件
```

## 主要页面

1. **首页** (`/`): 展示平台概览、顶级模型、实时对决等
2. **排行榜** (`/leaderboard`): 展示完整的模型排行榜
3. **模型详情** (`/model/:id`): 展示特定模型的详细信息和能力分析
4. **模型对决** (`/battle`): 用户参与投票，对比模型创作能力
5. **关于** (`/about`): 平台介绍、使命和发展路线图

## 开发计划

### Phase 1 - MVP (已完成)
- ✅ 基础排行榜功能
- ✅ 模型对决功能
- ✅ 核心评测维度展示
- ✅ 响应式设计

### Phase 2 - 功能扩展
- [ ] API 接入支持
- [ ] 自动化评测系统
- [ ] 用户注册和登录
- [ ] 社区画廊功能

### Phase 3 - 生态建设
- [ ] 定制化评测服务
- [ ] 专家认证体系
- [ ] 创作者社区
- [ ] 模型提交入口

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 联系方式

- Email: contact@wenxinmoyun.ai
- GitHub: [wenxin-moyun](https://github.com/wenxin-moyun)