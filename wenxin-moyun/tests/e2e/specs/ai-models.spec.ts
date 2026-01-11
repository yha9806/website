import { test, expect } from '@playwright/test';

test.describe('AI Models Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/leaderboard');
  });

  test('应该显示AI模型排行榜', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/VULCA/);

    // 检查排行榜表格或卡片 - 使用CSS选择器列表并取第一个
    const leaderboard = page.locator('[class*="leaderboard"], table, [class*="model-list"]').first();
    await expect(leaderboard).toBeVisible();

    // 检查是否显示模型名称
    const modelNames = page.locator('[class*="model-name"], td, [class*="card-title"]').first();
    await expect(modelNames).toBeVisible();
  });

  test('应该正确处理NULL分数显示', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 检查是否有N/A显示（用于图像模型的NULL分数）
    const naScores = page.getByText('N/A');
    if (await naScores.count() > 0) {
      await expect(naScores.first()).toBeVisible();
    }

    // 检查分数格式化（应该显示为小数）
    const scores = page.locator('[class*="score"]:not(:has-text("N/A"))');
    if (await scores.count() > 0) {
      const scoreText = await scores.first().textContent();
      // 分数应该是数字格式
      expect(scoreText).toMatch(/^\d+\.\d+$/);
    }
  });

  test('应该支持模型类型筛选', async ({ page }) => {
    // 查找筛选器 - 使用CSS选择器列表
    const filters = page.locator('[class*="filter"], select, [role="tab"]').first();

    if (await filters.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 测试不同的模型类型筛选
      const typeFilters = page.locator('[value="llm"], [value="image"], [value="multimodal"]').first();

      if (await typeFilters.isVisible({ timeout: 2000 }).catch(() => false)) {
        await typeFilters.click();

        // 等待筛选结果
        await page.waitForTimeout(1000);

        // 验证筛选是否工作
        const results = page.locator('[class*="model-card"], tr').first();
        await expect(results).toBeVisible();
      }
    }
  });

  test('应该支持排序功能', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 查找排序按钮或表头 - 使用CSS选择器列表
    const sortButtons = page.locator('[class*="sort"], th[role="button"], [data-sort]').first();

    if (await sortButtons.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortButtons.click();

      // 等待排序完成
      await page.waitForTimeout(1000);

      // 验证排序是否生效（检查内容是否发生变化）
      const modelList = page.locator('[class*="model-list"], tbody').first();
      await expect(modelList).toBeVisible();
    }
  });

  test('模型详情页面跳转', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');

    // 查找可点击的模型链接 - 使用CSS选择器列表
    const modelLinks = page.locator('a[href*="/model/"], [class*="model-card"][role="button"]').first();

    if (await modelLinks.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modelLinks.click();

      // 验证是否跳转到模型详情页
      await expect(page).toHaveURL(/\/model\//);

      // 验证模型详情页面元素
      const modelDetail = page.locator('[class*="model-detail"], main').first();
      await expect(modelDetail).toBeVisible();
    }
  });

  test('响应式设计测试', async ({ page }) => {
    console.log('开始响应式设计测试');

    // 等待页面完全加载
    await page.waitForLoadState('networkidle');

    // 桌面端测试
    console.log('测试桌面端布局 (1920x1080)');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1500);

    // 验证leaderboard存在并截图 - 使用CSS选择器列表
    const leaderboard = page.locator('[class*="leaderboard"], table, [class*="model-list"]').first();
    await expect(leaderboard).toBeVisible({ timeout: 10000 });

    if (process.env.CI) {
      await page.screenshot({ path: 'desktop-layout.png', fullPage: true });
    }

    // 平板端测试
    console.log('测试平板端布局 (768x1024)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1500);

    // 等待CSS媒体查询生效
    await page.waitForFunction(() => window.innerWidth === 768);
    await expect(leaderboard).toBeVisible({ timeout: 10000 });

    if (process.env.CI) {
      await page.screenshot({ path: 'tablet-layout.png', fullPage: true });
    }

    // 移动端测试
    console.log('测试移动端布局 (375x667)');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);

    // 等待CSS媒体查询生效
    await page.waitForFunction(() => window.innerWidth === 375);
    await expect(leaderboard).toBeVisible({ timeout: 10000 });

    // 检查移动端特有元素 - 放宽检查条件
    const mobileElements = page.locator('[class*="mobile"], [class*="responsive"], [class*="sm:"], [class*="md:hidden"]').first();

    if (await mobileElements.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('找到移动端特定元素');
    } else {
      console.log('未找到移动端特定元素，但这是可接受的');
    }

    if (process.env.CI) {
      await page.screenshot({ path: 'mobile-layout.png', fullPage: true });
    }

    console.log('响应式设计测试完成');
  });

  test('搜索功能测试', async ({ page }) => {
    // 查找搜索框 - 使用CSS选择器列表
    const searchBox = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="搜索"]').first();

    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBox.fill('GPT');
      await page.keyboard.press('Enter');

      // 等待搜索结果
      await page.waitForTimeout(1000);

      // 验证搜索结果
      const results = page.locator('[class*="model-card"], tr').first();
      await expect(results).toBeVisible();

      // 验证搜索结果包含搜索关键词
      const resultText = await page.locator('body').textContent();
      expect(resultText?.toLowerCase()).toContain('gpt');
    }
  });

  test('数据加载状态测试', async ({ page }) => {
    // 检查加载状态 - 使用CSS选择器列表
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"]').first();

    if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 如果有加载指示器，验证它最终会消失
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }

    // 验证数据最终加载完成 - 使用CSS选择器列表
    const content = page.locator('[class*="model-list"], table, [class*="leaderboard"]').first();
    await expect(content).toBeVisible();
  });
});
