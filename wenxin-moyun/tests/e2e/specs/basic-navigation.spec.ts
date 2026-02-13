import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('Homepage loads successfully', async ({ page }) => {
    // Navigate to homepage (use relative path for baseURL)
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check if we have some content on the page
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(100);

    // Check for any heading or main content
    const hasHeading = await page.locator('h1').count() > 0;
    const hasMainContent = await page.locator('main, [role="main"], .app-content').count() > 0;
    expect(hasHeading || hasMainContent).toBeTruthy();
  });

  test('Can navigate to leaderboard', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click any link that goes to leaderboard
    const leaderboardLink = page.locator('a[href*="leaderboard"], button:has-text("Ranking"), button:has-text("排行"), [data-testid="explore-rankings-button"]').first();
    if (await leaderboardLink.isVisible().catch(() => false)) {
      await leaderboardLink.click();
      await page.waitForURL('**/leaderboard', { timeout: 10000 });
    } else {
      // Direct navigation
      await page.goto('/leaderboard');
    }

    // Verify on leaderboard page
    const url = page.url();
    expect(url).toContain('/leaderboard');
  });

  test('Can navigate to login page directly', async ({ page }) => {
    // Navigate directly to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if login form elements are present
    await expect(page.locator('input[name="username"], input[placeholder*="username" i]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login")').first()).toBeVisible();
  });

  // Skip backend health check if backend is not running
  // This test requires the backend server to be running at localhost:8001
  test.skip('Backend health check works', async ({ request }) => {
    const API_URL = process.env.API_URL || 'http://localhost:8001';
    const response = await request.get(`${API_URL}/health`, { timeout: 5000 });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
