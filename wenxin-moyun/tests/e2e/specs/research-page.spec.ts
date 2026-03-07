import { test, expect } from '@playwright/test';
import { withRoute } from '../utils/route-helper';

test.describe('Research Page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
    await page.goto(`${baseURL}${withRoute('/research')}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('page loads and shows heading', async ({ page }) => {
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('tab navigation is present', async ({ page }) => {
    const tabs = page.locator('button, [role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
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
