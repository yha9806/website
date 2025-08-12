import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('应该正确显示页面标题和主要导航', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/WenXin MoYun/);
    
    // 检查主要导航元素
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Rankings' }).first()).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Battles' }).first()).toBeVisible();
    await expect(page.getByRole('link').filter({ hasText: 'Gallery' }).first()).toBeVisible();
  });

  test('应该显示主要内容区域', async ({ page }) => {
    // 检查主要标题（选择main区域中的h1）
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    
    // 检查主要内容区域
    const mainContent = page.locator('main, [role="main"], .main-content');
    await expect(mainContent).toBeVisible();
    
    // 检查是否有iOS风格的卡片组件
    const iosCards = page.locator('[class*="ios"], [class*="card"]');
    await expect(iosCards.first()).toBeVisible();
  });

  test('应该响应式适配移动端', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 检查页面仍然可访问
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    
    // 检查移动端导航是否正确显示
    const mobileNav = page.locator('[class*="mobile"], [class*="hamburger"]');
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('导航链接应该正确跳转', async ({ page }) => {
    // 测试排行榜链接
    await page.getByRole('link').filter({ hasText: 'Rankings' }).first().click();
    await expect(page).toHaveURL(/leaderboard/);
    
    // 返回首页
    await page.goto('http://localhost:5173/');
    
    // 测试对战链接
    await page.getByRole('link').filter({ hasText: 'Battles' }).first().click();
    await expect(page).toHaveURL(/battle/);
    
    // 返回首页
    await page.goto('http://localhost:5173/');
    
    // 测试画廊链接
    await page.getByRole('link').filter({ hasText: 'Gallery' }).first().click();
    await expect(page).toHaveURL(/gallery/);
  });

  test('页面加载性能测试', async ({ page }) => {
    // 监听页面加载时间
    const startTime = Date.now();
    await page.goto('http://localhost:5173/');
    const loadTime = Date.now() - startTime;
    
    // 页面应该在3秒内加载完成
    expect(loadTime).toBeLessThan(3000);
    
    // 检查关键内容是否已加载
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });
});