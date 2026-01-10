import { test, expect } from '@playwright/test';

test.describe('VULCA Simple Tests', () => {
  test('should navigate to VULCA page', async ({ page }) => {
    // Simply navigate to the page (use relative path for baseURL)
    await page.goto('/#/vulca');
    
    // Wait a bit for page to load
    await page.waitForTimeout(3000);
    
    // Check that we're on the right page (URL contains vulca)
    expect(page.url()).toContain('#/vulca');
    
    // Check that page has some content (not blank)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should show loading or content', async ({ page }) => {
    await page.goto('/#/vulca');
    await page.waitForTimeout(3000);
    
    // Check if either initialization message or main content is visible
    const hasInitMessage = await page.locator('text="Initializing VULCA System"').count() > 0;
    const hasVULCATitle = await page.locator('text=/VULCA/i').count() > 0;
    const hasControls = await page.locator('text="Controls"').count() > 0;
    
    // At least one should be true
    expect(hasInitMessage || hasVULCATitle || hasControls).toBeTruthy();
  });

  test('should eventually show main content', async ({ page }) => {
    await page.goto('/#/vulca');
    
    // Wait up to 30 seconds for main content
    const mainContent = await page.waitForSelector('text=/VULCA|Controls|Visualization|Dimensions/i', {
      timeout: 30000,
      state: 'visible'
    }).catch(() => null);
    
    // Should have found something
    expect(mainContent).toBeTruthy();
  });
});

test.describe('VULCA API Tests', () => {
  // Skip API tests - they require running backend on localhost:8001
  test.skip(true, 'VULCA API tests require running backend');

  test('should have working VULCA API', async ({ request }) => {
    // Test the VULCA info endpoint
    const response = await request.get('http://localhost:8001/api/v1/vulca/info');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.name).toContain('VULCA');
    expect(data.dimensions).toBeDefined();
  });

  test('should get cultural perspectives', async ({ request }) => {
    const response = await request.get('http://localhost:8001/api/v1/vulca/cultural-perspectives');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('should get dimensions', async ({ request }) => {
    const response = await request.get('http://localhost:8001/api/v1/vulca/dimensions');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBe(47); // Should have 47 dimensions
  });
});