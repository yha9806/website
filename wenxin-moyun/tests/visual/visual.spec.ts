import { test, expect } from '@playwright/test';
import { HomePage, LeaderboardPage, BattlePage, EvaluationPage } from '../e2e/fixtures/page-objects';
import { setGuestSession, cleanupTestData } from '../e2e/helpers/test-utils';

test.describe('Visual Regression Tests', () => {
  // Skip all visual tests until baseline screenshots are generated
  // To generate baselines, run: npx playwright test tests/visual --update-snapshots
  test.skip(true, 'Baseline screenshots not yet generated - run with --update-snapshots to create them');

  test.beforeEach(async ({ page }) => {
    // Set up consistent state for visual tests
    await setGuestSession(page, 'visual-test-guest');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Homepage visual consistency', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate('/#/');
    
    // Wait for animations to complete
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixels: 100,
      animations: 'disabled'
    });
    
    // Take viewport screenshot for above-fold content
    await expect(page).toHaveScreenshot('homepage-viewport.png', {
      fullPage: false,
      maxDiffPixels: 50
    });
  });

  test('Leaderboard page visual consistency', async ({ page }) => {
    const leaderboardPage = new LeaderboardPage(page);
    await page.goto('/#/leaderboard');
    
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Screenshot the main content area
    await expect(page.locator('main')).toHaveScreenshot('leaderboard-main.png', {
      maxDiffPixels: 100
    });
    
    // Test different category tabs
    const categories = ['诗词', '绘画', '叙事'];
    for (const category of categories) {
      await leaderboardPage.selectCategory(category);
      await page.waitForTimeout(500);
      await expect(page.locator('main')).toHaveScreenshot(`leaderboard-${category}.png`, {
        maxDiffPixels: 100
      });
    }
  });

  test('Battle page visual consistency', async ({ page }) => {
    const battlePage = new BattlePage(page);
    await page.goto('/#/battle');
    
    // Wait for battle to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Screenshot battle interface
    await expect(page.locator('main')).toHaveScreenshot('battle-main.png', {
      maxDiffPixels: 100
    });
  });

  test('Evaluation page visual consistency', async ({ page }) => {
    const evaluationPage = new EvaluationPage(page);
    await page.goto('/#/evaluations');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Screenshot evaluation list
    await expect(page.locator('main')).toHaveScreenshot('evaluations-list.png', {
      maxDiffPixels: 100
    });
    
    // Open create evaluation dialog
    await evaluationPage.newEvaluationButton.click();
    await page.waitForTimeout(500);
    
    // Screenshot creation dialog
    const dialog = page.locator('[role="dialog"], .modal, .dialog');
    if (await dialog.isVisible()) {
      await expect(dialog).toHaveScreenshot('evaluation-create-dialog.png', {
        maxDiffPixels: 50
      });
    }
  });

  test('Dark mode visual consistency', async ({ page }) => {
    await page.goto('/#/');
    
    // Toggle dark mode
    const darkModeButton = page.locator('button[aria-label*="dark"], button[aria-label*="深色"]');
    if (await darkModeButton.isVisible()) {
      await darkModeButton.click();
      await page.waitForTimeout(500);
      
      // Take dark mode screenshots
      await expect(page).toHaveScreenshot('homepage-dark.png', {
        fullPage: true,
        maxDiffPixels: 100
      });
    }
  });

  test('Mobile responsive visual consistency', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test homepage on mobile
    await page.goto('/#/');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
    
    // Test navigation menu on mobile
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .mobile-menu-button');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('mobile-menu-open.png', {
        fullPage: false,
        maxDiffPixels: 50
      });
    }
  });

  test('Component animations disabled for consistency', async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });

    await page.goto('/#/');
    await page.waitForTimeout(500);
    
    // Take screenshot with animations disabled
    await expect(page).toHaveScreenshot('homepage-no-animations.png', {
      fullPage: true,
      maxDiffPixels: 50
    });
  });

  test('Chart components visual consistency', async ({ page }) => {
    // Navigate to a page with charts
    await page.goto('/#/vulca');
    
    // Wait for charts to render
    await page.waitForTimeout(2000);
    
    // Screenshot chart area if it exists
    const chartContainer = page.locator('.chart-container, .recharts-wrapper, canvas');
    const chartCount = await chartContainer.count();
    
    if (chartCount > 0) {
      for (let i = 0; i < Math.min(chartCount, 3); i++) {
        await expect(chartContainer.nth(i)).toHaveScreenshot(`chart-${i}.png`, {
          maxDiffPixels: 200 // Charts may have slight variations
        });
      }
    }
  });

  test('Form validation states visual consistency', async ({ page }) => {
    await page.goto('/#/evaluations');
    
    // Open create dialog
    const evaluationPage = new EvaluationPage(page);
    await evaluationPage.newEvaluationButton.click();
    await page.waitForTimeout(500);
    
    // Try to submit without filling required fields to trigger validation
    const submitButton = page.locator('button:has-text("创建"), button:has-text("提交")');
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Screenshot validation state
    const dialog = page.locator('[role="dialog"], .modal, .dialog');
    if (await dialog.isVisible()) {
      await expect(dialog).toHaveScreenshot('form-validation-errors.png', {
        maxDiffPixels: 50
      });
    }
  });

  test('Loading states visual consistency', async ({ page }) => {
    // Simulate slow network to capture loading states
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    await page.goto('/#/evaluations');

    // Capture loading state quickly
    await page.waitForTimeout(100);
    const loadingIndicator = page.locator('.loading, .spinner, [aria-label*="loading"]');
    
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toHaveScreenshot('loading-state.png', {
        maxDiffPixels: 50
      });
    }
  });
});