import { test, expect } from '@playwright/test';
import { withRoute } from '../utils/route-helper';

test.describe('Evaluate Page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
    await page.goto(`${baseURL}${withRoute('/evaluate')}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads and shows heading', async ({ page }) => {
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('intent input area is visible', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 15000 });
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('net::'));
    expect(critical.length).toBe(0);
  });
});
