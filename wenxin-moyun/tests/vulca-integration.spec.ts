import { test, expect } from '@playwright/test';

test.describe('VULCA-Rankings Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/#/leaderboard');
  });

  test('should display 47D button for models with VULCA data', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    // Check if 47D buttons exist
    const vulcaButtons = page.locator('button:has-text("47D")');
    const count = await vulcaButtons.count();
    
    // At least some models should have VULCA data
    expect(count).toBeGreaterThan(0);
  });

  test('should expand VULCA visualization when 47D button is clicked', async ({ page }) => {
    // Wait for leaderboard to load
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    // Find and click first 47D button
    const firstVulcaButton = page.locator('button:has-text("47D")').first();
    const buttonExists = await firstVulcaButton.isVisible();
    
    if (buttonExists) {
      await firstVulcaButton.click();
      
      // Check if VULCA visualization appears
      // Note: The actual selector depends on implementation
      await expect(page.locator('.vulca-visualization').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show loading state while fetching VULCA data', async ({ page }) => {
    // Navigate to page
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    // Check for loading indicator
    const loadingIndicator = page.locator('.loading-spinner, .skeleton');
    
    // Initially might show loading
    if (await loadingIndicator.isVisible()) {
      // Should eventually hide
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }
  });

  test('should maintain state when toggling VULCA views', async ({ page }) => {
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    const vulcaButton = page.locator('button:has-text("47D")').first();
    
    if (await vulcaButton.isVisible()) {
      // Click to expand
      await vulcaButton.click();
      
      // Check chevron direction changes
      const chevronUp = page.locator('.lucide-chevron-up').first();
      await expect(chevronUp).toBeVisible({ timeout: 5000 });
      
      // Click to collapse
      await vulcaButton.click();
      
      // Check chevron direction changes back
      const chevronDown = page.locator('.lucide-chevron-down').first();
      await expect(chevronDown).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display correct VULCA data format', async ({ page }) => {
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    // Check for models with scores
    const modelRows = page.locator('tr[data-testid^="model-row"]');
    const rowCount = await modelRows.count();
    
    if (rowCount > 0) {
      // Check first model has score displayed
      const firstScore = page.locator('.overall-score').first();
      const scoreText = await firstScore.textContent();
      
      // Score should be a number
      expect(scoreText).toMatch(/\d+\.?\d*/);
    }
  });

  test('performance: should load leaderboard quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5173/#/leaderboard');
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and force an error
    await page.route('**/api/v1/models/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('http://localhost:5173/#/leaderboard');
    
    // Should show error state
    const errorMessage = page.locator('text=/error|failed|problem/i').first();
    await expect(errorMessage.or(page.locator('.error-state'))).toBeVisible({ timeout: 10000 });
  });

  test('should preserve VULCA expansion state during sorting', async ({ page }) => {
    await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
    
    const vulcaButton = page.locator('button:has-text("47D")').first();
    
    if (await vulcaButton.isVisible()) {
      // Expand VULCA
      await vulcaButton.click();
      await page.waitForTimeout(500);
      
      // Sort by a column
      const sortButton = page.locator('th button').first();
      await sortButton.click();
      
      // VULCA should still be expanded
      const chevronUp = page.locator('.lucide-chevron-up').first();
      await expect(chevronUp).toBeVisible();
    }
  });
});