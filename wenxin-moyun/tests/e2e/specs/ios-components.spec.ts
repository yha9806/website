import { test, expect } from '@playwright/test';

test.describe('iOS Components', () => {
  test.beforeEach(async ({ page }) => {
    // Visit test page (if available) or home page to test iOS components
    await page.goto('/');
  });

  test('iOS button components should render and interact correctly', async ({ page }) => {
    // Find iOS-style buttons - comprehensive selectors for English interface
    const iosButtons = page.locator('.ios-button, button[class*="ios"], button:has-text("Explore Rankings"), button:has-text("Login"), button:has-text("Start"), button:has-text("Get Started")');
    
    if (await iosButtons.count() > 0) {
      const firstButton = iosButtons.first();
      
      // Check button visibility
      await expect(firstButton).toBeVisible();
      
      // Check button is clickable
      await expect(firstButton).toBeEnabled();
      
      // Test click interaction
      await firstButton.click();
      
      // Check for visual feedback (if any)
      const activeState = page.locator('[class*="active"], [class*="pressed"], [class*="clicked"]');
      if (await activeState.count() > 0) {
        await expect(activeState.first()).toBeVisible();
      }
    }
  });

  test('iOS card components should display correctly', async ({ page }) => {
    // Find iOS-style cards - enhanced selectors for English interface
    const iosCards = page.locator('.ios-card, [class*="card-ios"], [class*="elevated"], .card, [data-testid*="card"]');
    
    if (await iosCards.count() > 0) {
      const firstCard = iosCards.first();
      
      // Check card visibility
      await expect(firstCard).toBeVisible();
      
      // Check card content
      const cardContent = firstCard.locator('.ios-card-content, [class*="content"], p, div');
      if (await cardContent.count() > 0) {
        await expect(cardContent.first()).toBeVisible();
      }
      
      // Check card header (if exists)
      const cardHeader = firstCard.locator('.ios-card-header, [class*="header"], h1, h2, h3');
      if (await cardHeader.count() > 0) {
        await expect(cardHeader.first()).toBeVisible();
      }
    }
  });

  test('iOS-style glass morphism effects', async ({ page }) => {
    // Find elements with glass morphism - enhanced selectors
    const glassElements = page.locator('.ios-glass, [class*="glass"], [class*="blur"], [class*="morphism"], .ios-surface');
    
    if (await glassElements.count() > 0) {
      const firstGlass = glassElements.first();
      await expect(firstGlass).toBeVisible();
      
      // Check CSS properties (via computed styles)
      const backdropFilter = await firstGlass.evaluate(el => {
        return window.getComputedStyle(el).backdropFilter;
      });
      
      // Verify blur effects are present
      if (backdropFilter && backdropFilter !== 'none') {
        expect(backdropFilter).toContain('blur');
      }
    }
  });

  test('iOS color system application', async ({ page }) => {
    // Check usage of iOS standard colors - enhanced selectors
    const blueElements = page.locator('[class*="blue"], [class*="primary"], .ios-button, button:has-text("Explore Rankings")');
    const greenElements = page.locator('[class*="green"], [class*="success"], .text-green');
    const orangeElements = page.locator('[class*="orange"], [class*="warning"], .text-orange');
    const redElements = page.locator('[class*="red"], [class*="destructive"], .text-red');
    
    // Verify at least some iOS color elements exist
    const totalColorElements = await blueElements.count() + await greenElements.count() + await orangeElements.count() + await redElements.count();
    expect(totalColorElements).toBeGreaterThan(0);
  });

  test('iOS typography system application', async ({ page }) => {
    // Check San Francisco font usage
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    
    if (await headings.count() > 0) {
      const firstHeading = headings.first();
      const fontFamily = await firstHeading.evaluate(el => {
        return window.getComputedStyle(el).fontFamily;
      });
      
      // Verify iOS font stack is used
      expect(fontFamily).toMatch(/apple-system|SF Pro|system-ui|-apple-system/i);
    }
    
    // Check iOS title level classes
    const largeTitleElements = page.locator('.text-large-title, [class*="large-title"], h1:has-text("WenXin MoYun"), h1:has-text("AI Art Evaluation")');
    if (await largeTitleElements.count() > 0) {
      await expect(largeTitleElements.first()).toBeVisible();
    }
  });

  test('iOS toggle switch components', async ({ page }) => {
    // Find iOS-style toggle switches - comprehensive selectors
    const toggles = page.locator('.ios-toggle, input[type="checkbox"][class*="ios"], [class*="toggle"], [class*="switch"], [data-testid*="toggle"]');
    
    if (await toggles.count() > 0) {
      const firstToggle = toggles.first();
      
      // Check toggle switch visibility
      await expect(firstToggle).toBeVisible();
      
      // Test toggle functionality
      const initialState = await firstToggle.isChecked();
      await firstToggle.click();
      
      // Verify state change
      const newState = await firstToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('iOS slider components', async ({ page }) => {
    // Find iOS-style sliders - enhanced selectors
    const sliders = page.locator('.ios-slider, input[type="range"][class*="ios"], [class*="slider"], [data-testid*="slider"]');
    
    if (await sliders.count() > 0) {
      const firstSlider = sliders.first();
      
      // Check slider visibility
      await expect(firstSlider).toBeVisible();
      
      // Test slider value setting
      await firstSlider.fill('50');
      const value = await firstSlider.inputValue();
      expect(value).toBe('50');
    }
  });

  test('iOS alerts and modal dialogs', async ({ page }) => {
    // Find buttons that might trigger alerts - enhanced selectors
    const alertTriggers = page.locator('button:has-text("Alert"), button:has-text("Warning"), button:has-text("Confirm"), [data-alert], [data-testid*="alert"]');
    
    if (await alertTriggers.count() > 0) {
      await alertTriggers.first().click();
      
      // Find iOS-style alerts and modals
      const alerts = page.locator('.ios-alert, [class*="alert"], [class*="modal"], [role="dialog"], .modal');
      
      if (await alerts.count() > 0) {
        await expect(alerts.first()).toBeVisible();
        
        // Find close buttons - comprehensive selectors
        const closeButtons = page.locator('button:has-text("Close"), button:has-text("Cancel"), button:has-text("OK"), [aria-label="close"], [data-testid="close"]');
        if (await closeButtons.count() > 0) {
          await closeButtons.first().click();
          await expect(alerts.first()).toBeHidden();
        }
      }
    }
  });

  test('Responsive iOS component adaptation', async ({ page }) => {
    // Test iOS component behavior across different screen sizes
    const viewports = [
      { width: 375, height: 667 },  // iPhone SE
      { width: 390, height: 844 },  // iPhone 12
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Verify iOS components remain visible and usable across sizes
      const iosComponents = page.locator('.ios-button, .ios-card, [class*="ios"], [class*="card"]');
      if (await iosComponents.count() > 0) {
        await expect(iosComponents.first()).toBeVisible();
      }
      
      // Wait for layout stabilization
      await page.waitForTimeout(500);
    }
  });

  test('iOS component animations and transition effects', async ({ page }) => {
    // Find elements with animation effects - enhanced selectors
    const animatedElements = page.locator('.ios-button, [class*="animate"], [class*="transition"], [class*="hover"], .ios-card');
    
    if (await animatedElements.count() > 0) {
      const firstAnimated = animatedElements.first();
      
      // Check element visibility
      await expect(firstAnimated).toBeVisible();
      
      // Trigger animation (via hover or click)
      await firstAnimated.hover();
      
      // Wait for animation completion
      await page.waitForTimeout(1000);
      
      // Verify element is still visible (animation didn't break layout)
      await expect(firstAnimated).toBeVisible();
    }
  });
});