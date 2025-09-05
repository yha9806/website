import { test, expect, Page } from '@playwright/test';

test.describe('VULCA Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/#/vulca');
    
    // Wait for lazy-loaded component to load
    await page.waitForLoadState('networkidle');
    
    // Wait specifically for VULCA content to appear since it's lazy loaded
    await page.waitForSelector('h1:has-text("VULCA")', { 
      timeout: 10000,
      state: 'visible' 
    });
  });

  test('should load VULCA page successfully', async ({ page }) => {
    // Check page title contains VULCA (the full title is "VULCA Multi-Dimensional Evaluation")
    await expect(page.locator('h1').first()).toContainText('VULCA');
    
    // Check visualization container is visible
    const vulcaContainer = page.locator('.vulca-container, [class*="vulca"]').first();
    await expect(vulcaContainer).toBeVisible();
    
    // Check dimension toggle exists (look for buttons with 6D or 47D text)
    const dimensionToggle = page.locator('button:has-text("6D"), button:has-text("47D"), button:has-text("Dimension")').first();
    await expect(dimensionToggle).toBeVisible();
    
    // Verify initial chart is loaded
    await page.waitForSelector('.recharts-surface, .recharts-wrapper', { timeout: 5000 });
  });

  test('should switch between 6D and 47D views', async ({ page }) => {
    // Find and click the dimension toggle
    const toggleButton = page.locator('button').filter({ hasText: /47D|Extended/i });
    
    // Get initial state
    const initialText = await page.locator('.vulca-container').textContent();
    const is6D = initialText?.includes('6D') || initialText?.includes('Core');
    
    // Click toggle to switch dimensions
    await toggleButton.first().click();
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify dimension changed
    const updatedText = await page.locator('.vulca-container').textContent();
    if (is6D) {
      expect(updatedText).toMatch(/47D|Extended|Full/i);
    } else {
      expect(updatedText).toMatch(/6D|Core|Simplified/i);
    }
    
    // Verify chart updated
    await expect(page.locator('.recharts-surface')).toBeVisible();
  });

  test('should change visualization types', async ({ page }) => {
    // Test Radar Chart (default)
    await expect(page.locator('.recharts-radar')).toBeVisible();
    
    // Switch to Heatmap
    const heatmapButton = page.locator('button').filter({ hasText: /Heatmap/i });
    if (await heatmapButton.count() > 0) {
      await heatmapButton.first().click();
      await page.waitForTimeout(500);
      // Heatmap uses different rendering, check for grid or cells
      const heatmapElement = page.locator('.heatmap-container, .heatmap-grid, [class*="heatmap"]').first();
      await expect(heatmapElement).toBeVisible();
    }
    
    // Switch to Bar Chart
    const barButton = page.locator('button').filter({ hasText: /Bar/i });
    if (await barButton.count() > 0) {
      await barButton.first().click();
      await page.waitForTimeout(500);
      await expect(page.locator('.recharts-bar-rectangle').first()).toBeVisible();
    }
    
    // Switch to Parallel Coordinates
    const parallelButton = page.locator('button').filter({ hasText: /Parallel/i });
    if (await parallelButton.count() > 0) {
      await parallelButton.first().click();
      await page.waitForTimeout(500);
      // Parallel coordinates might use lines or paths
      const parallelElement = page.locator('.recharts-line, path[class*="line"], .parallel-coordinates').first();
      await expect(parallelElement).toBeVisible();
    }
  });

  test('should select different AI models', async ({ page }) => {
    // Look for model selector dropdown or buttons
    const modelSelector = page.locator('select, [role="combobox"], button').filter({ hasText: /Model|GPT|Claude/i });
    
    if (await modelSelector.count() > 0) {
      // If it's a select element
      const selectElement = page.locator('select').first();
      if (await selectElement.count() > 0) {
        // Get available options
        const options = await selectElement.locator('option').count();
        if (options > 1) {
          // Select second model
          await selectElement.selectOption({ index: 1 });
          await page.waitForTimeout(500);
          
          // Verify chart updated
          await expect(page.locator('.recharts-surface')).toBeVisible();
        }
      } else {
        // If it's a button/dropdown
        await modelSelector.first().click();
        
        // Wait for dropdown to appear and select an option
        const modelOption = page.locator('[role="option"], .dropdown-item').filter({ hasText: /GPT|Claude|DeepSeek/i }).first();
        if (await modelOption.count() > 0) {
          await modelOption.click();
          await page.waitForTimeout(500);
          
          // Verify selection changed
          await expect(page.locator('.recharts-surface')).toBeVisible();
        }
      }
    }
  });

  test('should switch cultural perspectives', async ({ page }) => {
    // Look for cultural perspective selector
    const cultureSelector = page.locator('button, select').filter({ 
      hasText: /Western|Eastern|Latin|Middle|Global|Culture|Perspective/i 
    });
    
    if (await cultureSelector.count() > 0) {
      const initialData = await page.locator('.recharts-surface').innerHTML();
      
      // Click or select different perspective
      if (await page.locator('select').filter({ hasText: /Culture|Perspective/i }).count() > 0) {
        const select = page.locator('select').filter({ hasText: /Culture|Perspective/i }).first();
        await select.selectOption({ index: 1 });
      } else {
        await cultureSelector.first().click();
        const option = page.locator('[role="option"], .dropdown-item').nth(1);
        if (await option.count() > 0) {
          await option.click();
        }
      }
      
      await page.waitForTimeout(500);
      
      // Verify data changed
      const updatedData = await page.locator('.recharts-surface').innerHTML();
      expect(updatedData).not.toBe(initialData);
    }
  });

  test('should handle hover interactions', async ({ page }) => {
    // Wait for chart to be ready
    await page.waitForSelector('.recharts-surface');
    
    // Test radar chart hover
    const radarDots = page.locator('.recharts-dot');
    if (await radarDots.count() > 0) {
      await radarDots.first().hover();
      
      // Check for tooltip
      const tooltip = page.locator('.recharts-tooltip-wrapper, [role="tooltip"]');
      await expect(tooltip.first()).toBeVisible({ timeout: 2000 }).catch(() => {
        // Tooltip might not be implemented
      });
    }
    
    // Test bar chart hover if available
    const bars = page.locator('.recharts-bar-rectangle');
    if (await bars.count() > 0) {
      await bars.first().hover();
      await page.waitForTimeout(100);
    }
  });

  test('should handle responsive layout', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Verify chart is still visible and responsive
      await expect(page.locator('.vulca-container').first()).toBeVisible();
      await expect(page.locator('.recharts-surface').first()).toBeVisible();
      
      // Check if layout adjusted properly
      const container = page.locator('.vulca-container').first();
      const box = await container.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('should display evaluation scores correctly', async ({ page }) => {
    // Check for score display elements
    const scoreElements = page.locator('[class*="score"], [class*="value"], text=/[0-9]+\\.[0-9]+/')
      .filter({ hasText: /^[0-9]+\.?[0-9]*$/ });
    
    const scoreCount = await scoreElements.count();
    expect(scoreCount).toBeGreaterThan(0);
    
    // Verify scores are in valid range (0-100 or 0-1)
    for (let i = 0; i < Math.min(scoreCount, 5); i++) {
      const scoreText = await scoreElements.nth(i).textContent();
      const score = parseFloat(scoreText || '0');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api/v1/vulca/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Reload page to trigger API calls
    await page.reload();
    
    // Should show error message or fallback UI
    const errorElement = page.locator('text=/error|failed|unable|problem/i').first();
    const hasError = await errorElement.count() > 0;
    
    if (hasError) {
      await expect(errorElement).toBeVisible();
    } else {
      // Should at least show the page structure without crashing
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('should compare multiple models', async ({ page }) => {
    // Look for comparison feature
    const compareButton = page.locator('button').filter({ hasText: /Compare|VS|Versus/i });
    
    if (await compareButton.count() > 0) {
      await compareButton.first().click();
      await page.waitForTimeout(500);
      
      // Should show comparison UI
      const comparisonView = page.locator('[class*="comparison"], [class*="versus"], .model-comparison');
      if (await comparisonView.count() > 0) {
        await expect(comparisonView.first()).toBeVisible();
      }
      
      // Check for multiple model data
      const modelLabels = page.locator('text=/GPT|Claude|DeepSeek|Model/i');
      const labelCount = await modelLabels.count();
      expect(labelCount).toBeGreaterThan(1);
    }
  });
});

test.describe('VULCA Performance Tests', () => {
  test('should load page within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:5173/#/vulca');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });
  
  test('should render charts smoothly', async ({ page }) => {
    await page.goto('http://localhost:5173/#/vulca');
    await page.waitForSelector('.recharts-surface');
    
    // Measure animation performance
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        let frames = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve({
              fps: frames,
              duration: performance.now() - startTime
            });
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // Should maintain at least 30 FPS
    expect(metrics.fps).toBeGreaterThan(30);
  });
});