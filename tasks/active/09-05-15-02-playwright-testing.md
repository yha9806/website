# [任务-09-05-15-02] Playwright E2E测试实现

**创建时间**: 2025-09-05 15:02
**状态**: 待启动
**优先级**: 高
**父任务**: 09-05-15-00-vulca-optimization

## 需求来源
VULCA功能已实现但缺乏自动化测试覆盖，需要实现Playwright E2E测试确保功能稳定性和回归保护。

## 目标和范围
**主要目标**: 
- 实现VULCA完整E2E测试套件
- 达到90%+功能覆盖率
- 建立自动化测试流程

**范围**: 
- VULCA页面访问测试
- 6D/47D切换功能测试
- 可视化组件测试
- API集成测试
- 性能基准测试

**排除**: 
- 单元测试
- 集成测试
- 视觉回归测试

## 关键约束
- 测试必须稳定可重复
- 执行时间控制在5分钟内
- 支持CI/CD集成

## 架构影响评估
- 测试基础设施：新增测试文件和配置
- CI/CD：需要更新GitHub Actions
- 开发流程：加入测试驱动开发

## 关键决策记录
- **决策1：使用Playwright MCP** - 利用现有MCP工具进行自动化
- **决策2：分层测试策略** - 核心功能优先，边缘功能次要
- **决策3：数据独立性** - 测试使用独立数据，不依赖外部状态

## 执行计划

### Phase 1: 测试环境准备（30分钟）
1. 创建vulca.spec.ts测试文件
2. 配置测试数据fixtures
3. 设置测试环境变量
4. 准备测试辅助函数

### Phase 2: 核心功能测试（1小时）
5. **测试场景1**: VULCA页面加载和初始化
   - 验证页面标题和布局
   - 检查初始数据加载
   - 验证UI元素可见性

6. **测试场景2**: 6D vs 47D维度切换
   - 点击切换按钮
   - 验证视图更新
   - 检查数据正确性

7. **测试场景3**: 可视化类型切换
   - 测试Radar图表
   - 测试Heatmap热力图
   - 测试Bar柱状图
   - 测试Parallel平行坐标图

8. **测试场景4**: 模型选择功能
   - 选择不同AI模型
   - 验证数据更新
   - 检查评分显示

### Phase 3: 交互功能测试（45分钟）
9. **测试场景5**: 文化视角选择
   - 切换8种文化视角
   - 验证数据变化
   - 检查UI响应

10. **测试场景6**: 数据交互
    - 悬停提示测试
    - 点击交互测试
    - 拖动操作测试

11. **测试场景7**: 错误处理
    - API失败场景
    - 网络超时处理
    - 数据异常处理

### Phase 4: 性能和集成测试（45分钟）
12. **测试场景8**: 性能基准
    - 页面加载时间 < 2s
    - API响应时间 < 500ms
    - 动画流畅度测试

13. **API端点测试**
    - GET /api/v1/vulca/info
    - POST /api/v1/vulca/evaluate
    - POST /api/v1/vulca/compare
    - GET /api/v1/vulca/dimensions

14. **数据一致性测试**
    - 前后端数据同步
    - 缓存一致性
    - 状态管理验证

### Phase 5: 测试报告和CI集成（30分钟）
15. 生成测试覆盖率报告
16. 配置GitHub Actions
17. 设置测试质量门槛
18. 文档化测试策略

## 测试代码示例

```typescript
// tests/e2e/specs/vulca.spec.ts
import { test, expect } from '@playwright/test';

test.describe('VULCA Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/#/vulca');
  });

  test('should load VULCA page successfully', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('VULCA');
    await expect(page.locator('[data-testid="dimension-toggle"]')).toBeVisible();
  });

  test('should switch between 6D and 47D views', async ({ page }) => {
    const toggle = page.locator('[data-testid="dimension-toggle"]');
    await toggle.click();
    await expect(page.locator('.dimension-count')).toContainText('47');
  });

  test('should change visualization types', async ({ page }) => {
    await page.selectOption('[data-testid="viz-selector"]', 'heatmap');
    await expect(page.locator('.heatmap-container')).toBeVisible();
  });
});
```

## 当前进度
- ⏳ 待启动

## 待解决问题
- [ ] 测试数据准备策略
- [ ] Mock API vs 真实API选择
- [ ] 并行测试配置

## 用户对话记录
### 第1轮 [2025-09-05 15:02] - [任务确认模式]
**用户原文**: 创建Playwright测试实现专项任务
**关键要点**: 建立VULCA功能的完整E2E测试覆盖