import { test, expect } from '@playwright/test';
import { HomePage, LeaderboardPage } from '../fixtures/page-objects';
import { TEST_URLS } from '../fixtures/test-data';
import { cleanupTestData } from '../helpers/test-utils';

test.describe('Navigation System', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate('/');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Main navigation menu functionality', async ({ page }) => {
    // Check main navigation links - support both English and Chinese
    const navLinks = [
      { patterns: ['排行榜', 'Leaderboard', 'Rankings'], url: '/leaderboard' },
      { patterns: ['对战', 'Battle', 'VS'], url: '/battle' },
      { patterns: ['评测', 'Evaluation', 'Evaluations', 'Test'], url: '/evaluations' },
      { patterns: ['关于', 'About'], url: '/about' }
    ];
    
    for (const link of navLinks) {
      // Find navigation link using multiple text patterns
      let navLink = null;
      for (const pattern of link.patterns) {
        navLink = page.locator(`nav a:has-text("${pattern}")`)
          .or(page.locator(`header a:has-text("${pattern}")`)
          .or(page.locator(`a[href="${link.url}"]`)));
        if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
          break;
        }
      }
      
      if (navLink && await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
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
        await expect(page.getByRole('heading', { name: /leaderboard|rankings/i }).first()).toBeVisible();
      } else if (route === '/battle') {
        await expect(page.getByRole('heading', { name: /battle|vs|vote/i }).first()).toBeVisible();
      } else if (route === '/evaluations') {
        await expect(page.getByRole('heading', { name: /evaluation|test|assessment/i }).first()).toBeVisible();
      } else if (route === '/about') {
        await expect(page.getByRole('heading', { name: /about|information|platform/i }).first()).toBeVisible();
      } else if (route === '/') {
        await expect(homePage.heroTitle).toBeVisible();
      }
    }
  });

  test('404 page handling for invalid routes', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/non-existent-route-12345');
    
    // Should show 404 page - use specific element
    const notFoundTitle = page.getByRole('heading', { name: '404' });
    await expect(notFoundTitle).toBeVisible({ timeout: 5000 });
    
    // Should have link back to home
    const homeLink = page.getByRole('link', { name: /home|go home/i }).first();
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
      const breadcrumbs = page.locator('nav[aria-label="breadcrumb"]')
        .or(page.locator('.breadcrumbs'))
        .or(page.locator('.breadcrumb'));
      
      if (await breadcrumbs.isVisible()) {
        // Verify breadcrumb structure - support English interface
        const homecrumb = breadcrumbs.locator('a:has-text("首页")')
          .or(breadcrumbs.locator('a:has-text("Home")'))
          .or(breadcrumbs.locator('a[href="/"]'));
        const leaderboardCrumb = breadcrumbs.locator('text=/排行榜|Leaderboard|Rankings/i')
          .or(breadcrumbs.locator('a:has-text("Leaderboard")'))
          .or(breadcrumbs.locator('a[href="/leaderboard"]'));
        
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
    
    // Check for mobile menu button - enhanced selector for English interface
    const mobileMenuButton = page.locator('button[aria-label*="menu"]')
      .or(page.locator('button[aria-label*="Menu"]'))
      .or(page.locator('.mobile-menu-button'))
      .or(page.locator('.hamburger'))
      .or(page.locator('button:has-text("☰")'))
      .or(page.locator('[data-testid="mobile-menu-button"]'));
    
    if (await mobileMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Open mobile menu
      await mobileMenuButton.click();
      
      // Mobile menu should be visible
      const mobileMenu = page.locator('.mobile-menu')
        .or(page.locator('nav[aria-label="mobile"]'))
        .or(page.locator('[data-testid="mobile-nav"]'))
        .or(page.locator('.nav-mobile'));
      await expect(mobileMenu).toBeVisible();
      
      // Click a link in mobile menu - support English interface
      const mobileLink = mobileMenu.locator('a:has-text("排行榜")')
        .or(mobileMenu.locator('a:has-text("Leaderboard")'))
        .or(mobileMenu.locator('a:has-text("Rankings")'))
        .or(mobileMenu.locator('a[href="/leaderboard"]'));
      if (await mobileLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mobileLink.click();
        await expect(page).toHaveURL('/leaderboard');
        
        // Menu should close after navigation
        await expect(mobileMenu).not.toBeVisible();
      }
    }
  });
});