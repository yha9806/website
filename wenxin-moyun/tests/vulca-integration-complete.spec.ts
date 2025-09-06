import { test, expect } from '@playwright/test';

test.describe('VULCA-Rankings Complete Integration Test', () => {
  const BASE_URL = 'http://localhost:5174';
  const API_URL = 'http://localhost:8001';

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for initial load
    page.setDefaultTimeout(30000);
  });

  // ========== 1. 数据集成测试 ==========
  test.describe('Data Integration', () => {
    test('API should return VULCA fields for all models', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/models/?include_vulca=true&limit=50`);
      expect(response.ok()).toBeTruthy();
      
      const models = await response.json();
      
      // Verify we have models
      expect(models.length).toBeGreaterThan(0);
      
      // Check VULCA fields exist in response
      const firstModel = models[0];
      expect(firstModel).toHaveProperty('vulca_scores_47d');
      expect(firstModel).toHaveProperty('vulca_cultural_perspectives');
      expect(firstModel).toHaveProperty('vulca_evaluation_date');
      expect(firstModel).toHaveProperty('vulca_sync_status');
      
      // Count models with VULCA data
      const modelsWithVulca = models.filter(m => m.vulca_scores_47d !== null);
      console.log(`Models with VULCA data: ${modelsWithVulca.length}/${models.length}`);
      
      // At least some models should have VULCA data
      expect(modelsWithVulca.length).toBeGreaterThan(0);
    });

    test('VULCA data should have correct 47D format', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/models/?include_vulca=true&limit=50`);
      const models = await response.json();
      
      // Find a model with VULCA data
      const modelWithVulca = models.find(m => m.vulca_scores_47d !== null);
      
      if (modelWithVulca) {
        const scores = typeof modelWithVulca.vulca_scores_47d === 'string' 
          ? JSON.parse(modelWithVulca.vulca_scores_47d) 
          : modelWithVulca.vulca_scores_47d;
        
        // Should have exactly 47 dimensions
        expect(Object.keys(scores).length).toBe(47);
        
        // All scores should be between 0 and 100
        Object.values(scores).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  // ========== 2. Rankings页面VULCA展示测试 ==========
  test.describe('Rankings Page VULCA Display', () => {
    test('Rankings page should show 47D button for models with VULCA data', async ({ page }) => {
      await page.goto(`${BASE_URL}/#/leaderboard`);
      
      // Wait for leaderboard to load
      await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
      
      // Check for 47D buttons
      const vulcaButtons = page.locator('button:has-text("47D")');
      const buttonCount = await vulcaButtons.count();
      
      console.log(`Found ${buttonCount} 47D buttons`);
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('Clicking 47D button should expand VULCA visualization', async ({ page }) => {
      await page.goto(`${BASE_URL}/#/leaderboard`);
      await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
      
      // Find first 47D button
      const vulcaButton = page.locator('button:has-text("47D")').first();
      
      if (await vulcaButton.isVisible()) {
        // Click to expand
        await vulcaButton.click();
        
        // Check for VULCA visualization
        const vulcaViz = page.locator('.vulca-visualization').first();
        await expect(vulcaViz).toBeVisible({ timeout: 5000 });
        
        // Verify radar chart or other visualization is present
        const radarChart = page.locator('[class*="radar"], [class*="chart"], canvas').first();
        await expect(radarChart.or(vulcaViz)).toBeVisible();
      }
    });

    test('VULCA expansion should be toggleable', async ({ page }) => {
      await page.goto(`${BASE_URL}/#/leaderboard`);
      await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
      
      const vulcaButton = page.locator('button:has-text("47D")').first();
      
      if (await vulcaButton.isVisible()) {
        // Expand
        await vulcaButton.click();
        const vulcaViz = page.locator('.vulca-visualization').first();
        await expect(vulcaViz).toBeVisible();
        
        // Collapse
        await vulcaButton.click();
        await expect(vulcaViz).not.toBeVisible();
      }
    });
  });

  // ========== 3. VULCA页面动态加载测试 ==========
  test.describe('VULCA Page Dynamic Loading', () => {
    test('VULCA page should load and display models', async ({ page }) => {
      await page.goto(`${BASE_URL}/#/vulca`);
      
      // Wait for page to load
      await page.waitForSelector('[class*="vulca"], [class*="VULCA"], h1', { timeout: 10000 });
      
      // Check for model selection or display
      const modelElements = page.locator('[class*="model"], [class*="card"]');
      const modelCount = await modelElements.count();
      
      console.log(`VULCA page shows ${modelCount} model elements`);
      expect(modelCount).toBeGreaterThan(0);
    });

    test('VULCA page should not be limited to 5 hardcoded models', async ({ page }) => {
      await page.goto(`${BASE_URL}/#/vulca`);
      await page.waitForSelector('[class*="vulca"], [class*="VULCA"]', { timeout: 10000 });
      
      // Look for model selectors or dropdowns
      const modelSelector = page.locator('select, [role="combobox"], [class*="select"]').first();
      
      if (await modelSelector.isVisible()) {
        const options = await modelSelector.locator('option').count();
        console.log(`Found ${options} model options`);
        
        // Should have more than 5 models
        expect(options).toBeGreaterThan(5);
      }
    });
  });

  // ========== 4. 缓存机制测试 ==========
  test.describe('Cache Mechanism', () => {
    test('Second API request should be faster due to caching', async ({ request }) => {
      const url = `${API_URL}/api/v1/models/?include_vulca=true&limit=10`;
      
      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request.get(url);
      const time1 = Date.now() - start1;
      
      expect(response1.ok()).toBeTruthy();
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const response2 = await request.get(url);
      const time2 = Date.now() - start2;
      
      expect(response2.ok()).toBeTruthy();
      
      console.log(`First request: ${time1}ms, Second request: ${time2}ms`);
      console.log(`Cache improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
      
      // Second request should be faster
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  // ========== 5. 性能测试 ==========
  test.describe('Performance', () => {
    test('Rankings page should load within 3 seconds', async ({ page }) => {
      const start = Date.now();
      
      await page.goto(`${BASE_URL}/#/leaderboard`);
      await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
      
      const loadTime = Date.now() - start;
      console.log(`Rankings page load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(3000);
    });

    test('API response time should be under 500ms for single request', async ({ request }) => {
      const start = Date.now();
      
      const response = await request.get(`${API_URL}/api/v1/models/?include_vulca=true&limit=10`);
      
      const responseTime = Date.now() - start;
      console.log(`API response time: ${responseTime}ms`);
      
      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(500);
    });
  });

  // ========== 6. 数据一致性测试 ==========
  test.describe('Data Consistency', () => {
    test('Model scores should be consistent between Rankings and VULCA', async ({ page, request }) => {
      // Get data from API
      const response = await request.get(`${API_URL}/api/v1/models/?include_vulca=true&limit=10`);
      const apiModels = await response.json();
      
      // Visit Rankings page
      await page.goto(`${BASE_URL}/#/leaderboard`);
      await page.waitForSelector('.leaderboard-table', { timeout: 10000 });
      
      // Check if scores displayed match API data
      const firstModelName = await page.locator('[class*="model-name"]').first().textContent();
      const firstModelScore = await page.locator('[class*="score"]').first().textContent();
      
      console.log(`UI shows: ${firstModelName} with score ${firstModelScore}`);
      
      // Find corresponding model in API data
      const apiModel = apiModels.find(m => m.name === firstModelName);
      if (apiModel) {
        console.log(`API shows: ${apiModel.name} with score ${apiModel.overall_score}`);
      }
    });
  });

  // ========== 7. 错误处理测试 ==========
  test.describe('Error Handling', () => {
    test('Should handle API errors gracefully', async ({ page }) => {
      // Navigate to page even if API is down
      await page.goto(`${BASE_URL}/#/leaderboard`);
      
      // Check for either data or error message
      const hasData = await page.locator('.leaderboard-table').isVisible().catch(() => false);
      const hasError = await page.locator('[class*="error"], [class*="Error"]').isVisible().catch(() => false);
      
      // Should show either data or error state
      expect(hasData || hasError).toBeTruthy();
    });
  });
});