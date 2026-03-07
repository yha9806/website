import { test, expect } from '@playwright/test';
import { withRoute } from '../utils/route-helper';

test.describe('Admin Page', () => {
  test.setTimeout(60000);

  test('unauthenticated user is redirected to login', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
    // Clear any stored tokens
    await page.goto(`${baseURL}${withRoute('/')}`);
    await page.evaluate(() => localStorage.removeItem('access_token'));
    // Navigate to admin
    await page.goto(`${baseURL}${withRoute('/admin')}`);
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('non-admin user is redirected to home', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
    await page.goto(`${baseURL}${withRoute('/')}`);
    // Set a fake JWT with is_superuser=false
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'demo', is_superuser: false }));
    const fakeToken = `${header}.${payload}.fakesig`;
    await page.evaluate((t) => localStorage.setItem('access_token', t), fakeToken);
    await page.goto(`${baseURL}${withRoute('/admin')}`);
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to home (not login, since token exists)
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  });

  test('admin user sees dashboard', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
    await page.goto(`${baseURL}${withRoute('/')}`);
    // Set a fake JWT with is_superuser=true
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'admin', is_superuser: true }));
    const fakeToken = `${header}.${payload}.fakesig`;
    await page.evaluate((t) => localStorage.setItem('access_token', t), fakeToken);
    await page.goto(`${baseURL}${withRoute('/admin')}`);
    await page.waitForLoadState('domcontentloaded');
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toContainText(/Dashboard|Admin/i);
  });
});
