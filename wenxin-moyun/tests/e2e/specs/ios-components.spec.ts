import { test, expect } from '@playwright/test';

test.describe('iOS Components', () => {
  test.beforeEach(async ({ page }) => {
    // 访问测试页面（如果有的话）或首页来测试iOS组件
    await page.goto('/');
  });

  test('iOS按钮组件应该正确渲染和交互', async ({ page }) => {
    // 查找iOS风格的按钮
    const iosButtons = page.locator('[class*="ios-button"], button[class*="ios"]');
    
    if (await iosButtons.count() > 0) {
      const firstButton = iosButtons.first();
      
      // 检查按钮可见性
      await expect(firstButton).toBeVisible();
      
      // 检查按钮可点击性
      await expect(firstButton).toBeEnabled();
      
      // 测试点击交互
      await firstButton.click();
      
      // 检查是否有视觉反馈（如果有的话）
      const activeState = page.locator('[class*="active"], [class*="pressed"]');
      if (await activeState.count() > 0) {
        await expect(activeState.first()).toBeVisible();
      }
    }
  });

  test('iOS卡片组件应该正确显示', async ({ page }) => {
    // 查找iOS风格的卡片
    const iosCards = page.locator('[class*="ios-card"], [class*="card-ios"], [class*="elevated"]');
    
    if (await iosCards.count() > 0) {
      const firstCard = iosCards.first();
      
      // 检查卡片可见性
      await expect(firstCard).toBeVisible();
      
      // 检查卡片内容
      const cardContent = firstCard.locator('[class*="content"], p, div');
      if (await cardContent.count() > 0) {
        await expect(cardContent.first()).toBeVisible();
      }
      
      // 检查卡片头部（如果有）
      const cardHeader = firstCard.locator('[class*="header"], h1, h2, h3');
      if (await cardHeader.count() > 0) {
        await expect(cardHeader.first()).toBeVisible();
      }
    }
  });

  test('iOS风格的玻璃质感效果', async ({ page }) => {
    // 查找具有玻璃质感的元素
    const glassElements = page.locator('[class*="glass"], [class*="blur"], [class*="morphism"]');
    
    if (await glassElements.count() > 0) {
      const firstGlass = glassElements.first();
      await expect(firstGlass).toBeVisible();
      
      // 检查CSS属性（通过计算样式）
      const backdropFilter = await firstGlass.evaluate(el => {
        return window.getComputedStyle(el).backdropFilter;
      });
      
      // 验证是否有模糊效果
      if (backdropFilter && backdropFilter !== 'none') {
        expect(backdropFilter).toContain('blur');
      }
    }
  });

  test('iOS颜色系统应用', async ({ page }) => {
    // 检查iOS标准颜色的使用
    const blueElements = page.locator('[class*="blue"], [class*="primary"]');
    const greenElements = page.locator('[class*="green"], [class*="success"]');
    const orangeElements = page.locator('[class*="orange"], [class*="warning"]');
    
    // 验证至少有一些iOS颜色元素存在
    const totalColorElements = await blueElements.count() + await greenElements.count() + await orangeElements.count();
    expect(totalColorElements).toBeGreaterThan(0);
  });

  test('iOS字体系统应用', async ({ page }) => {
    // 检查San Francisco字体的使用
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    
    if (await headings.count() > 0) {
      const firstHeading = headings.first();
      const fontFamily = await firstHeading.evaluate(el => {
        return window.getComputedStyle(el).fontFamily;
      });
      
      // 验证是否使用了iOS字体栈
      expect(fontFamily).toMatch(/apple-system|SF Pro|system-ui/i);
    }
    
    // 检查iOS标题级别类
    const largeTitleElements = page.locator('[class*="large-title"]');
    if (await largeTitleElements.count() > 0) {
      await expect(largeTitleElements.first()).toBeVisible();
    }
  });

  test('iOS切换开关组件', async ({ page }) => {
    // 查找iOS风格的切换开关
    const toggles = page.locator('input[type="checkbox"][class*="ios"], [class*="toggle"], [class*="switch"]');
    
    if (await toggles.count() > 0) {
      const firstToggle = toggles.first();
      
      // 检查切换开关可见性
      await expect(firstToggle).toBeVisible();
      
      // 测试切换功能
      const initialState = await firstToggle.isChecked();
      await firstToggle.click();
      
      // 验证状态改变
      const newState = await firstToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('iOS滑块组件', async ({ page }) => {
    // 查找iOS风格的滑块
    const sliders = page.locator('input[type="range"][class*="ios"], [class*="slider"]');
    
    if (await sliders.count() > 0) {
      const firstSlider = sliders.first();
      
      // 检查滑块可见性
      await expect(firstSlider).toBeVisible();
      
      // 测试滑块值设置
      await firstSlider.fill('50');
      const value = await firstSlider.inputValue();
      expect(value).toBe('50');
    }
  });

  test('iOS弹窗和警告框', async ({ page }) => {
    // 查找可能触发弹窗的按钮
    const alertTriggers = page.locator('button:has-text("Alert"), button:has-text("警告"), [data-alert]');
    
    if (await alertTriggers.count() > 0) {
      await alertTriggers.first().click();
      
      // 查找iOS风格的弹窗
      const alerts = page.locator('[class*="alert"], [class*="modal"], [role="dialog"]');
      
      if (await alerts.count() > 0) {
        await expect(alerts.first()).toBeVisible();
        
        // 查找关闭按钮
        const closeButtons = page.locator('button:has-text("Close"), button:has-text("关闭"), [aria-label="close"]');
        if (await closeButtons.count() > 0) {
          await closeButtons.first().click();
          await expect(alerts.first()).toBeHidden();
        }
      }
    }
  });

  test('响应式iOS组件适配', async ({ page }) => {
    // 测试不同屏幕尺寸下的iOS组件表现
    const viewports = [
      { width: 375, height: 667 },  // iPhone SE
      { width: 390, height: 844 },  // iPhone 12
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // 验证iOS组件在不同尺寸下仍然可见和可用
      const iosComponents = page.locator('[class*="ios"], [class*="card"]');
      if (await iosComponents.count() > 0) {
        await expect(iosComponents.first()).toBeVisible();
      }
      
      // 等待布局稳定
      await page.waitForTimeout(500);
    }
  });

  test('iOS组件动画和过渡效果', async ({ page }) => {
    // 查找有动画效果的元素
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    
    if (await animatedElements.count() > 0) {
      const firstAnimated = animatedElements.first();
      
      // 检查元素可见性
      await expect(firstAnimated).toBeVisible();
      
      // 触发动画（通过悬停或点击）
      await firstAnimated.hover();
      
      // 等待动画完成
      await page.waitForTimeout(1000);
      
      // 验证元素仍然可见（动画没有破坏布局）
      await expect(firstAnimated).toBeVisible();
    }
  });
});