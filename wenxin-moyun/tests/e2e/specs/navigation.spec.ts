import { test, expect } from '@playwright/test';
import { HomePage, LeaderboardPage } from '../fixtures/page-objects';
import { TEST_URLS } from '../fixtures/test-data';
import { cleanupTestData } from '../helpers/test-utils';

test.describe('Navigation System', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Main navigation menu functionality', async ({ page }) => {
    // Check main navigation links
    const navLinks = [
      { text: '排行榜', url: '/leaderboard' },
      { text: '对战', url: '/battle' },
      { text: '评测', url: '/evaluations' },
      { text: '关于', url: '/about' }
    ];
    
    for (const link of navLinks) {
      // Find and click navigation link
      const navLink = page.locator(`nav a:has-text("${link.text}"), header a:has-text("${link.text}")`);
      
      if (await navLink.isVisible()) {
        await navLink.click();
        
        // Verify navigation
        await expect(page).toHaveURL(new RegExp(link.url));
        
        // Go back to home for next test
        await page.goto('/');
      }
    }
  });

  test('Route switching and page transitions', async ({ page }) => {
    // Test smooth transitions between pages
    const routes = [
      '/leaderboard',
      '/battle',
      '/evaluations',
      '/about',
      '/'
    ];
    
    for (const route of routes) {
      await page.goto(route);
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      
      // Verify URL changed
      expect(page.url()).toContain(route);
      
      // Check for page-specific content to ensure proper loading
      if (route === '/leaderboard') {
        await expect(page.locator('text=/排行榜|Leaderboard/i')).toBeVisible();
      } else if (route === '/battle') {
        await expect(page.locator('text=/对战|Battle/i')).toBeVisible();
      } else if (route === '/evaluations') {
        await expect(page.locator('text=/评测|Evaluation/i')).toBeVisible();
      } else if (route === '/about') {
        await expect(page.locator('text=/关于|About/i')).toBeVisible();
      } else if (route === '/') {
        await expect(homePage.heroTitle).toBeVisible();
      }
    }
  });

  test('404 page handling for invalid routes', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/non-existent-route-12345');
    
    // Should show 404 page
    const notFoundMessage = page.locator('text=/404|页面不存在|Page not found/i');
    await expect(notFoundMessage).toBeVisible({ timeout: 5000 });
    
    // Should have link back to home
    const homeLink = page.locator('a:has-text("首页"), a:has-text("Home"), a[href="/"]');
    await expect(homeLink).toBeVisible();
    
    // Click home link should navigate back
    await homeLink.click();
    await expect(page).toHaveURL('/');
    await expect(homePage.heroTitle).toBeVisible();
  });

  test('Breadcrumb navigation functionality', async ({ page }) => {
    // Navigate to a deep page (e.g., specific model page)
    await page.goto('/leaderboard');
    
    // Click on a model to go to detail page
    const modelLink = page.locator('a[href*="/model/"]').first();
    
    if (await modelLink.isVisible()) {
      await modelLink.click();
      
      // Check for breadcrumbs
      const breadcrumbs = page.locator('nav[aria-label="breadcrumb"], .breadcrumbs, .breadcrumb');
      
      if (await breadcrumbs.isVisible()) {
        // Verify breadcrumb structure
        const homecrumb = breadcrumbs.locator('a:has-text("首页"), a:has-text("Home")');
        const leaderboardCrumb = breadcrumbs.locator('text=/排行榜|Leaderboard/i');
        
        // Click breadcrumb to navigate back
        if (await leaderboardCrumb.isVisible()) {
          await leaderboardCrumb.click();
          await expect(page).toHaveURL('/leaderboard');
        }
      }
    }
  });

  test('Mobile navigation menu (responsive)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label*="menu"], .mobile-menu-button, .hamburger');
    
    if (await mobileMenuButton.isVisible()) {
      // Open mobile menu
      await mobileMenuButton.click();
      
      // Mobile menu should be visible
      const mobileMenu = page.locator('.mobile-menu, nav[aria-label="mobile"], [data-testid="mobile-nav"]');
      await expect(mobileMenu).toBeVisible();
      
      // Click a link in mobile menu
      const mobileLink = mobileMenu.locator('a:has-text("排行榜")');
      if (await mobileLink.isVisible()) {
        await mobileLink.click();
        await expect(page).toHaveURL('/leaderboard');
        
        // Menu should close after navigation
        await expect(mobileMenu).not.toBeVisible();
      }
    }
  });
});