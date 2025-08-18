import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('Homepage loads successfully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:5173/#/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if title is visible
    await expect(page.locator('h1:has-text("WenXin MoYun")')).toBeVisible({ timeout: 10000 });
    
    // Check if main buttons are visible
    await expect(page.locator('[data-testid="explore-rankings-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="model-battle-button"]')).toBeVisible();
  });

  test('Can navigate to leaderboard', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:5173/#/');
    await page.waitForLoadState('networkidle');
    
    // Click explore rankings button
    await page.locator('[data-testid="explore-rankings-button"]').click();
    
    // Should navigate to leaderboard
    await page.waitForURL('**/leaderboard', { timeout: 10000 });
    
    // Verify on leaderboard page
    const url = page.url();
    expect(url).toContain('#/leaderboard');
  });

  test('Can navigate to login page directly', async ({ page }) => {
    // Navigate directly to login page
    await page.goto('http://localhost:5173/#/login');
    await page.waitForLoadState('networkidle');
    
    // Check if login form elements are present
    await expect(page.locator('input[name="username"], input[placeholder*="username" i]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login")').first()).toBeVisible();
  });

  test('Backend health check works', async ({ request }) => {
    // Check backend health endpoint
    const response = await request.get('http://localhost:8001/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});