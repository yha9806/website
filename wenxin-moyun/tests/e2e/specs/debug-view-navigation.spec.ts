import { test, expect } from '@playwright/test';

test.describe('View Button Navigation Debug', () => {
  test('Debug View button navigation flow on production', async ({ page }) => {
    // Enable comprehensive logging
    page.on('console', msg => {
      console.log('Console:', msg.type(), msg.text());
    });

    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });

    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });

    // Monitor page errors
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });

    // Navigate to production leaderboard
    console.log('Navigating to production leaderboard...');
    await page.goto('https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/leaderboard');
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    console.log('Current URL:', page.url());
    
    // Look for actual View buttons in the table
    // Try different selectors based on the screenshot
    const viewButtonSelectors = [
      'button:has-text("View")',
      'button[aria-label*="View"]',
      'a:has-text("View")',
      '.leaderboard-table button',
      'table button',
      '[data-testid*="view"]',
      'button.btn-primary',
      'button[class*="view"]'
    ];

    let viewButton = null;
    let usedSelector = '';

    for (const selector of viewButtonSelectors) {
      const count = await page.locator(selector).count();
      console.log(`Selector "${selector}" found ${count} elements`);
      
      if (count > 0) {
        viewButton = page.locator(selector).first();
        usedSelector = selector;
        break;
      }
    }

    if (viewButton) {
      console.log(`Found View button using selector: ${usedSelector}`);
      
      // Check button properties
      const isVisible = await viewButton.isVisible();
      const isEnabled = await viewButton.isEnabled();
      const buttonText = await viewButton.textContent();
      console.log('Button - Visible:', isVisible, 'Enabled:', isEnabled, 'Text:', buttonText);
      
      if (isVisible && isEnabled) {
        console.log('=== FIRST CLICK ===');
        
        // Capture URL before click
        const urlBeforeClick = page.url();
        console.log('URL before click:', urlBeforeClick);
        
        // Click the button
        await viewButton.click();
        
        // Wait for navigation/response
        await page.waitForTimeout(3000);
        
        // Capture URL after click
        const urlAfterClick = page.url();
        console.log('URL after click:', urlAfterClick);
        
        // Check for XML content or error pages
        const pageContent = await page.content();
        const isXMLError = pageContent.includes('<?xml') || pageContent.includes('<Error>') || pageContent.includes('billing');
        const hasModelDetail = pageContent.includes('model') && (pageContent.includes('detail') || pageContent.includes('stats'));
        
        console.log('Is XML/Error page:', isXMLError);
        console.log('Has model detail content:', hasModelDetail);
        
        if (isXMLError) {
          console.log('=== XML ERROR DETECTED ===');
          const errorMatch = pageContent.match(/<Message>(.*?)<\/Message>/);
          if (errorMatch) {
            console.log('Error message:', errorMatch[1]);
          }
          
          // Try to navigate back
          console.log('=== NAVIGATING BACK ===');
          await page.goBack();
          await page.waitForTimeout(2000);
          
          console.log('URL after going back:', page.url());
          
          // Try clicking the same button again
          console.log('=== SECOND CLICK ATTEMPT ===');
          const secondViewButton = page.locator(usedSelector).first();
          
          if (await secondViewButton.isVisible()) {
            await secondViewButton.click();
            await page.waitForTimeout(3000);
            
            const urlAfterSecondClick = page.url();
            console.log('URL after second click:', urlAfterSecondClick);
            
            const secondPageContent = await page.content();
            const isSecondXMLError = secondPageContent.includes('<?xml') || secondPageContent.includes('<Error>');
            const hasSecondModelDetail = secondPageContent.includes('model') && (secondPageContent.includes('detail') || secondPageContent.includes('stats'));
            
            console.log('Second attempt - Is XML/Error page:', isSecondXMLError);
            console.log('Second attempt - Has model detail content:', hasSecondModelDetail);
            
            if (!isSecondXMLError && hasSecondModelDetail) {
              console.log('SUCCESS: Second click worked correctly!');
            }
          }
        } else if (hasModelDetail) {
          console.log('SUCCESS: First click worked correctly!');
        }
        
        // Take screenshots for debugging
        await page.screenshot({ path: 'debug-after-view-click.png', fullPage: true });
      }
    } else {
      console.log('No View buttons found with any selector');
      
      // Debug: Get all button text content
      const allButtons = await page.locator('button').all();
      console.log('All button texts:');
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        const classes = await allButtons[i].getAttribute('class');
        console.log(`  ${i}: "${text}" (classes: ${classes})`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'debug-view-navigation-final.png', fullPage: true });
  });
});