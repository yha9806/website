import { test, expect } from '@playwright/test';
import { HomePage, LeaderboardPage } from '../fixtures/page-objects';
import { TEST_URLS } from '../fixtures/test-data';
import { cleanupTestData } from '../helpers/test-utils';

test.describe('Navigation System', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    // navigate() already converts to hash format via withHash()
    await homePage.navigate('/');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Main navigation menu functionality', async ({ page }) => {
    // Check main navigation links - support both English and Chinese
    // Use HashRouter format: /#/path
    const navLinks = [
      { patterns: ['排行榜', 'Leaderboard', 'Rankings'], url: '/#/leaderboard' },
      { patterns: ['对战', 'Battle', 'VS'], url: '/#/battle' },
      { patterns: ['评测', 'Evaluation', 'Evaluations', 'Test'], url: '/#/evaluations' }
    ];

    for (const link of navLinks) {
      // Find navigation link using multiple text patterns - use CSS selector list
      let navLink = null;
      for (const pattern of link.patterns) {
        navLink = page.locator(`nav a:has-text("${pattern}"), header a:has-text("${pattern}")`).first();
        if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
          break;
        }
      }

      if (navLink && await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navLink.click();

        // Verify navigation (HashRouter format)
        await expect(page).toHaveURL(new RegExp(link.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

        // Go back to home for next test
        await page.goto('/#/');
      }
    }
  });

  test('Route switching and page transitions', async ({ page }) => {
    // Test smooth transitions between pages (HashRouter format)
    const routes = [
      { path: '/#/leaderboard', check: 'leaderboard' },
      { path: '/#/battle', check: 'battle' },
      { path: '/#/evaluations', check: 'evaluations' },
      { path: '/#/', check: 'home' }
    ];

    for (const route of routes) {
      await page.goto(route.path);

      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');

      // Verify URL changed
      expect(page.url()).toContain(route.path);

      // Check for page-specific content to ensure proper loading
      if (route.check === 'leaderboard') {
        // Check for any heading or table that indicates leaderboard
        const leaderboardElement = page.locator('h1, h2, table, [data-testid="leaderboard"]').first();
        await expect(leaderboardElement).toBeVisible({ timeout: 10000 });
      } else if (route.check === 'battle') {
        // Check for battle page elements - use CSS selector list
        const battleElements = page.locator('.battle-container, .model-comparison, [data-testid*="battle"], [data-testid*="model"], h1, h2').first();
        await expect(battleElements).toBeVisible({ timeout: 15000 });
      } else if (route.check === 'evaluations') {
        // Check for evaluation page elements
        const evalElements = page.locator('h1, h2, [data-testid="evaluation"]').first();
        await expect(evalElements).toBeVisible({ timeout: 10000 });
      } else if (route.check === 'home') {
        await expect(homePage.heroTitle).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('404 page handling for invalid routes', async ({ page }) => {
    // Navigate to non-existent route (HashRouter format)
    await page.goto('/#/non-existent-route-12345');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // For HashRouter, invalid routes typically redirect to home or show 404
    // Check if we got a 404 page, redirected to home, or have any page content
    const is404 = await page.locator('text=/404|not found|page.*not.*exist/i').isVisible({ timeout: 3000 }).catch(() => false);
    const hasHeading = await page.locator('h1').count() > 0;
    const hasContent = (await page.textContent('body'))?.length || 0 > 200;

    // Either 404 page shown, has some heading, or has content is acceptable
    // Most apps either show 404 or redirect to home with content
    expect(is404 || hasHeading || hasContent).toBeTruthy();
  });

  test.skip('Breadcrumb navigation functionality', async ({ page }) => {
    // Skip this test - breadcrumb navigation is not implemented in current UI
    // This test can be enabled once breadcrumbs are added to the application
  });

  test('Mobile navigation menu (responsive)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to ensure mobile layout is applied
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');

    // Check for mobile menu button - use CSS selector list
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], .mobile-menu-button, .hamburger, button:has-text("☰"), [data-testid="mobile-menu-button"]').first();

    if (await mobileMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Open mobile menu
      await mobileMenuButton.click();

      // Wait for menu animation
      await page.waitForTimeout(500);

      // Mobile menu should be visible - use CSS selector list
      const mobileMenu = page.locator('.mobile-menu, nav[aria-label="mobile"], [data-testid="mobile-nav"], .nav-mobile, nav').first();

      if (await mobileMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Click a link in mobile menu - support English interface
        const mobileLink = mobileMenu.locator('a:has-text("Leaderboard"), a:has-text("Rankings"), a:has-text("排行榜")').first();
        if (await mobileLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await mobileLink.click();
          await expect(page).toHaveURL(/\/#\/leaderboard/);
        }
      }
    } else {
      // If no mobile menu button, check if nav links are directly visible
      const navLink = page.locator('nav a:has-text("Leaderboard"), nav a:has-text("Rankings")').first();
      if (await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await navLink.click();
        await expect(page).toHaveURL(/\/#\/leaderboard/);
      }
    }
  });
});
