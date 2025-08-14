import { test, expect } from '@playwright/test';
import { HomePage } from '../fixtures/page-objects';

test.describe('Homepage', () => {
  // Increase timeout for CI environment
  test.setTimeout(45000);
  
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate('/');
  });

  test('应该正确显示页面标题和主要导航', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/WenXin MoYun/);
    
    // 检查主要导航元素使用精确选择器
    await expect(homePage.navMenu).toBeVisible();
    await expect(homePage.leaderboardLink).toBeVisible();
    await expect(homePage.battleLink).toBeVisible();
  });

  test('应该显示主要内容区域', async ({ page }) => {
    // 检查主要标题使用特定选择器
    await expect(homePage.heroTitle).toBeVisible();
    await expect(homePage.heroTitle).toContainText('WenXin MoYun');
    
    // 检查iOS组件按钮
    await expect(homePage.exploreRankingsButton).toBeVisible();
    await expect(homePage.modelBattleButton).toBeVisible();
    
    // 检查是否有iOS风格的卡片组件
    const iosCards = page.locator('.liquid-glass-container');
    await expect(iosCards.first()).toBeVisible();
  });

  test('应该响应式适配移动端', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 检查页面仍然可访问
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    
    // 检查移动端导航是否正确显示
    const mobileNav = page.locator('[class*="mobile"]')
      .or(page.locator('[class*="hamburger"]'));
    if (await mobileNav.count() > 0) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('导航链接应该正确跳转', async ({ page }) => {
    // 测试通过按钮跳转到排行榜
    await homePage.clickExploreRankings();
    await expect(page).toHaveURL(/leaderboard/);
    
    // 返回首页
    await homePage.navigate('/');
    
    // 测试通过按钮跳转到对战页面
    await homePage.clickModelBattle();
    await expect(page).toHaveURL(/battle/);
    
    // 返回首页
    await homePage.navigate('/');
    
    // 测试导航链接
    await homePage.leaderboardLink.click();
    await expect(page).toHaveURL(/leaderboard/);
  });

  test('页面加载性能测试', async ({ page }) => {
    // 监听页面加载时间
    const startTime = Date.now();
    await homePage.navigate('/');
    const loadTime = Date.now() - startTime;
    
    // 页面应该在3秒内加载完成
    expect(loadTime).toBeLessThan(3000);
    
    // 检查关键内容是否已加载
    await expect(homePage.heroTitle).toBeVisible();
    await expect(homePage.navMenu).toBeVisible();
    await expect(homePage.exploreRankingsButton).toBeVisible();
  });
});