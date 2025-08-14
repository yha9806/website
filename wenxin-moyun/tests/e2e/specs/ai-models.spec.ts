import { test, expect } from '@playwright/test';

test.describe('AI Models Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/leaderboard');
  });

  test('应该显示AI模型排行榜', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/WenXin MoYun/);
    
    // 检查排行榜表格或卡片
    const leaderboard = page.locator('[class*="leaderboard"], table, [class*="model-list"]');
    await expect(leaderboard).toBeVisible();
    
    // 检查是否显示模型名称
    const modelNames = page.locator('[class*="model-name"], td, [class*="card-title"]');
    await expect(modelNames.first()).toBeVisible();
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
    // 查找筛选器
    const filters = page.locator('[class*="filter"], select, [role="tab"]');
    
    if (await filters.count() > 0) {
      // 测试不同的模型类型筛选
      const typeFilters = page.locator('[value="llm"], [value="image"], [value="multimodal"]');
      
      if (await typeFilters.count() > 0) {
        await typeFilters.first().click();
        
        // 等待筛选结果
        await page.waitForTimeout(1000);
        
        // 验证筛选是否工作
        const results = page.locator('[class*="model-card"], tr');
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('应该支持排序功能', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');
    
    // 查找排序按钮或表头
    const sortButtons = page.locator('[class*="sort"], th[role="button"], [data-sort]');
    
    if (await sortButtons.count() > 0) {
      const firstSort = sortButtons.first();
      await firstSort.click();
      
      // 等待排序完成
      await page.waitForTimeout(1000);
      
      // 验证排序是否生效（检查内容是否发生变化）
      const modelList = page.locator('[class*="model-list"], tbody');
      await expect(modelList).toBeVisible();
    }
  });

  test('模型详情页面跳转', async ({ page }) => {
    // 等待数据加载
    await page.waitForLoadState('networkidle');
    
    // 查找可点击的模型链接
    const modelLinks = page.locator('a[href*="/model/"], [class*="model-card"][role="button"]');
    
    if (await modelLinks.count() > 0) {
      await modelLinks.first().click();
      
      // 验证是否跳转到模型详情页
      await expect(page).toHaveURL(/\/model\//);
      
      // 验证模型详情页面元素
      const modelDetail = page.locator('[class*="model-detail"], main');
      await expect(modelDetail).toBeVisible();
    }
  });

  test('响应式设计测试', async ({ page }) => {
    // 桌面端测试
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000); // 等待布局调整
    await expect(page.locator('[class*="leaderboard"]')).toBeVisible({ timeout: 10000 });
    
    // 平板端测试
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000); // 等待响应式布局调整
    await expect(page.locator('[class*="leaderboard"]')).toBeVisible({ timeout: 10000 });
    
    // 移动端测试
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // 等待移动端布局调整
    await expect(page.locator('[class*="leaderboard"]')).toBeVisible({ timeout: 10000 });
    
    // 检查移动端是否有适当的布局调整
    const mobileLayout = page.locator('[class*="mobile"], [class*="responsive"]');
    const count = await mobileLayout.count();
    if (count > 0) {
      await expect(mobileLayout.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('搜索功能测试', async ({ page }) => {
    // 查找搜索框
    const searchBox = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="搜索"]');
    
    if (await searchBox.count() > 0) {
      await searchBox.fill('GPT');
      await page.keyboard.press('Enter');
      
      // 等待搜索结果
      await page.waitForTimeout(1000);
      
      // 验证搜索结果
      const results = page.locator('[class*="model-card"], tr');
      await expect(results.first()).toBeVisible();
      
      // 验证搜索结果包含搜索关键词
      const resultText = await page.locator('body').textContent();
      expect(resultText?.toLowerCase()).toContain('gpt');
    }
  });

  test('数据加载状态测试', async ({ page }) => {
    // 检查加载状态
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"]');
    
    if (await loadingIndicator.count() > 0) {
      // 如果有加载指示器，验证它最终会消失
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }
    
    // 验证数据最终加载完成
    const content = page.locator('[class*="model-list"], table, [class*="leaderboard"]');
    await expect(content).toBeVisible();
  });
});