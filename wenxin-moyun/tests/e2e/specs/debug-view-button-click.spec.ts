import { test, expect } from '@playwright/test';

test.describe('View Button Click Analysis', () => {
  test('Click View button and analyze behavior', async ({ page }) => {
    // Enable comprehensive logging
    page.on('console', msg => {
      console.log(`Console [${msg.type()}]:`, msg.text());
    });

    page.on('request', request => {
      console.log(`→ Request: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      console.log(`← Response: ${response.status()} ${response.url()}`);
    });

    // Track navigation events
    page.on('framenavigated', frame => {
      console.log('Navigation:', frame.url());
    });

    // Navigate to production leaderboard
    console.log('🔍 Navigating to production leaderboard...');
    await page.goto('https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/leaderboard');
    
    // Wait for content to load
    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(5000);
    
    // Look for View buttons specifically in the table
    const viewButtons = page.locator('table tbody tr button:has-text("View")');
    const viewButtonCount = await viewButtons.count();
    console.log(`📊 Found ${viewButtonCount} View buttons in table`);
    
    if (viewButtonCount > 0) {
      // Get the first View button and its parent row data
      const firstViewButton = viewButtons.first();
      const parentRow = firstViewButton.locator('..').locator('..');
      
      // Get model name from the row
      const modelName = await parentRow.locator('td:nth-child(2)').textContent();
      console.log(`🎯 Target model: ${modelName}`);
      
      // Ensure button is visible and ready
      await firstViewButton.waitFor({ state: 'visible' });
      console.log('✅ View button is visible');
      
      // Check if button is enabled
      const isEnabled = await firstViewButton.isEnabled();
      console.log(`🔘 Button enabled: ${isEnabled}`);
      
      // Record current URL before click
      const urlBeforeClick = page.url();
      console.log(`📍 URL before click: ${urlBeforeClick}`);
      
      // Click the View button
      console.log('👆 Clicking View button...');
      await firstViewButton.click();
      
      // Wait for potential navigation or modal
      await page.waitForTimeout(3000);
      
      // Check URL after click
      const urlAfterClick = page.url();
      console.log(`📍 URL after click: ${urlAfterClick}`);
      
      // Check if URL changed (navigation occurred)
      if (urlBeforeClick !== urlAfterClick) {
        console.log('🔄 Navigation detected!');
        
        // Wait for new page to load
        await page.waitForTimeout(2000);
        
        // Check if we're on a model detail page
        const isModelDetailPage = urlAfterClick.includes('#/model/');
        console.log(`📄 Is model detail page: ${isModelDetailPage}`);
        
        if (isModelDetailPage) {
          // Check if model detail content loaded
          const modelDetailContent = await page.locator('[data-testid="model-detail"], .model-detail, h1, .model-name').count();
          console.log(`📋 Model detail elements found: ${modelDetailContent}`);
          
          // Check for any error messages
          const errorElements = await page.locator('.error, .alert-danger, [data-testid="error"]').count();
          console.log(`❌ Error elements found: ${errorElements}`);
          
          // Get page title/heading
          const pageTitle = await page.locator('h1, h2, .model-name, .title').first().textContent();
          console.log(`📝 Page title/heading: ${pageTitle}`);
        }
      } else {
        console.log('❌ No navigation occurred');
        
        // Check for modals or overlays
        const modalElements = await page.locator('[role="dialog"], .modal, .overlay, .popup').count();
        console.log(`📱 Modal/overlay elements found: ${modalElements}`);
        
        // Check for any error messages
        const errorElements = await page.locator('.error, .alert-danger, [data-testid="error"]').count();
        console.log(`❌ Error elements found: ${errorElements}`);
        
        if (errorElements > 0) {
          const errorText = await page.locator('.error, .alert-danger, [data-testid="error"]').first().textContent();
          console.log(`📝 Error message: ${errorText}`);
        }
      }
      
      // Take a screenshot of the final state
      await page.screenshot({ path: 'view-button-clicked-result.png', fullPage: true });
      console.log('📸 Screenshot saved: view-button-clicked-result.png');
      
    } else {
      console.log('❌ No View buttons found');
      
      // Debug: Check table structure
      const tableRows = await page.locator('table tbody tr').count();
      console.log(`📊 Table rows found: ${tableRows}`);
      
      if (tableRows > 0) {
        const firstRowButtons = await page.locator('table tbody tr:first-child button').count();
        console.log(`🔘 Buttons in first row: ${firstRowButtons}`);
        
        const firstRowButtonTexts = await page.locator('table tbody tr:first-child button').allTextContents();
        console.log(`📝 First row button texts:`, firstRowButtonTexts);
      }
    }
  });
});