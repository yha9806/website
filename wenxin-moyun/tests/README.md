# 文心墨韵 E2E 测试套件

## 测试架构

本测试套件使用 Playwright MCP 进行端到端测试和视觉回归测试。

### 目录结构
```
tests/
├── e2e/                    # 端到端测试
│   ├── fixtures/          # 测试数据和页面对象
│   │   ├── test-data.ts  # 测试数据常量
│   │   └── page-objects.ts # 页面对象模型
│   ├── specs/            # 测试规范
│   │   ├── auth.spec.ts     # 认证流程测试
│   │   ├── evaluation.spec.ts # 评测功能测试
│   │   ├── battle.spec.ts   # 对战系统测试
│   │   └── navigation.spec.ts # 导航功能测试
│   ├── helpers/          # 辅助函数
│   │   └── test-utils.ts    # 测试工具函数
│   └── playwright.config.ts # Playwright配置
└── visual/               # 视觉回归测试
    ├── baseline/        # 基准截图
    ├── diff/           # 差异对比
    └── visual.spec.ts  # 视觉测试规范
```

## 快速开始

### 安装依赖
```bash
npm install -D @playwright/test
npx playwright install
```

### 运行测试

#### 运行所有E2E测试
```bash
npm run test:e2e
```

#### 运行特定测试文件
```bash
npx playwright test tests/e2e/specs/auth.spec.ts
```

#### 使用UI模式调试
```bash
npm run test:e2e:ui
```

#### 运行带浏览器界面的测试
```bash
npm run test:e2e:headed
```

#### 查看测试报告
```bash
npm run test:e2e:report
```

## 测试覆盖范围

### 认证测试 (auth.spec.ts)
- ✅ 用户登录成功
- ✅ 游客模式访问
- ✅ 登录失败处理
- ✅ JWT token 持久化
- ✅ 登出功能
- ✅ 管理员权限
- ✅ 游客每日限制

### 评测功能测试 (evaluation.spec.ts)
- ✅ 创建新评测任务
- ✅ 实时进度更新
- ✅ 评分结果展示
- ✅ 游客限制执行
- ✅ 历史记录查看
- ✅ 错误处理
- ✅ 取消评测

### 对战系统测试 (battle.spec.ts)
- ✅ 随机模型匹配
- ✅ 投票提交
- ✅ 统计跟踪
- ✅ 跳过功能

### 导航测试 (navigation.spec.ts)
- ✅ 主导航菜单
- ✅ 路由切换
- ✅ 404页面处理
- ✅ 面包屑导航
- ✅ 移动端菜单

### 视觉回归测试 (visual.spec.ts)
- ✅ 首页视觉一致性
- ✅ 排行榜页面
- ✅ 对战页面
- ✅ 评测页面
- ✅ 深色模式
- ✅ 移动端响应式
- ✅ 动画禁用状态
- ✅ 图表组件
- ✅ 表单验证状态
- ✅ 加载状态

## 测试数据

测试使用预定义的测试账户和数据：
- Demo用户: `demo/demo123`
- Admin用户: `admin/admin123`
- 游客ID: `test-guest-001`

## CI/CD 集成

### GitHub Actions 配置示例
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 最佳实践

1. **页面对象模式**: 所有页面交互封装在页面对象中
2. **测试数据分离**: 测试数据集中管理在 `test-data.ts`
3. **清理机制**: 每个测试后清理数据避免污染
4. **等待策略**: 使用智能等待而非固定延时
5. **错误处理**: 完善的错误捕获和报告机制
6. **并行执行**: 测试相互独立，支持并行运行

## 故障排查

### 常见问题

1. **端口冲突**
   - 确保前端运行在 5173 端口
   - 确保后端运行在 8001 端口

2. **超时错误**
   - 调整 `playwright.config.ts` 中的超时设置
   - 检查网络连接

3. **视觉测试失败**
   - 更新基准截图: `npx playwright test --update-snapshots`
   - 检查分辨率设置

## 使用 Playwright MCP

本项目集成了 Playwright MCP 进行增强测试：

```javascript
// 示例：使用 MCP 执行测试
await browser.navigate('http://localhost:5173');
await browser.click('text=登录');
await browser.type('input[name="username"]', 'demo');
await browser.snapshot(); // 捕获辅助功能树
await browser.take_screenshot('test.png');
```

## 性能基准

- 全部测试执行时间: < 3分钟
- 单个测试用例: < 30秒
- 视觉测试: < 5秒/截图

## 贡献指南

1. 新增测试前先更新此文档
2. 遵循现有的命名规范
3. 确保测试独立性
4. 添加适当的注释
5. 提交前运行完整测试套件