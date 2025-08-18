import { test, expect } from '@playwright/test';

test.describe('View Links Functionality Test', () => {
  test('Test actual View link functionality', async ({ page }) => {
    console.log('🔍 Navigating to production leaderboard...');
    await page.goto('https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/leaderboard');
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    console.log('=== TESTING VIEW LINKS (NOT BUTTONS) ===');
    
    // Find View LINKS (not buttons)
    const viewLinks = page.locator('a:has-text("View")');
    const viewLinkCount = await viewLinks.count();
    console.log(`🔗 Total View links found: ${viewLinkCount}`);
    
    if (viewLinkCount > 0) {
      const firstViewLink = viewLinks.first();
      
      // Get link details
      const linkHref = await firstViewLink.getAttribute('href');
      const linkText = await firstViewLink.textContent();
      console.log(`📋 First link href: ${linkHref}`);
      console.log(`📋 First link text: "${linkText}"`);
      
      // Record current URL
      const urlBefore = page.url();
      console.log(`📍 URL before click: ${urlBefore}`);
      
      // Click the link
      console.log('👆 Clicking View link...');
      await firstViewLink.click();
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check URL after click
      const urlAfter = page.url();
      console.log(`📍 URL after click: ${urlAfter}`);
      
      if (urlBefore !== urlAfter) {
        console.log('✅ Navigation successful!');
        
        // Check if we're on the expected model detail page
        const expectedUrl = `https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html${linkHref}`;
        const actualUrl = urlAfter;
        console.log(`📍 Expected URL: ${expectedUrl}`);
        console.log(`📍 Actual URL: ${actualUrl}`);
        console.log(`✅ URLs match: ${expectedUrl === actualUrl}`);
        
        // Wait for model detail page to load
        await page.waitForTimeout(2000);
        
        // Check for page content
        const pageTitle = await page.locator('h1, h2, .title, .model-name').first().textContent();
        console.log(`📝 Page title: ${pageTitle}`);
        
        // Check for errors
        const errorElements = await page.locator('.error, [data-testid="error"], .alert-danger').count();
        console.log(`❌ Error elements: ${errorElements}`);
        
        if (errorElements > 0) {
          const errorText = await page.locator('.error, [data-testid="error"], .alert-danger').first().textContent();
          console.log(`📝 Error message: ${errorText}`);
        }
        
        // Check if model detail content is present
        const modelDetailContent = await page.locator('[data-testid="model-detail"], .model-detail, .model-info').count();
        console.log(`📊 Model detail elements: ${modelDetailContent}`);
        
        // Take screenshot of model detail page
        await page.screenshot({ path: 'model-detail-page.png', fullPage: true });
        console.log('📸 Model detail screenshot saved');
        
      } else {
        console.log('❌ No navigation occurred');
      }
      
    } else {
      console.log('❌ No View links found');
      
      // Debug: Check what links do exist
      const allLinks = await page.locator('a').count();
      console.log(`🔗 Total links on page: ${allLinks}`);
      
      // Check table cell content again
      const lastCellLinks = await page.locator('table tbody tr td:last-child a').count();
      console.log(`🔗 Links in last table column: ${lastCellLinks}`);
    }
  });
});