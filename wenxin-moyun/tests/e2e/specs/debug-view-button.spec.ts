import { test, expect } from '@playwright/test';

test.describe('View Button Debug', () => {
  test('Debug View button on production leaderboard', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log('Console:', msg.type(), msg.text());
    });

    // Enable network request logging
    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });

    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });

    // Navigate to production leaderboard
    console.log('Navigating to production leaderboard...');
    await page.goto('https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/leaderboard');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if leaderboard content is loaded
    console.log('Checking for leaderboard content...');
    const leaderboardExists = await page.locator('[data-testid="leaderboard"]').count() > 0;
    console.log('Leaderboard exists:', leaderboardExists);
    
    // Look for AI model cards
    const modelCards = await page.locator('[data-testid="model-card"]').count();
    console.log('Model cards found:', modelCards);
    
    // Look for View buttons
    const viewButtons = await page.locator('button').filter({ hasText: 'View' }).count();
    console.log('View buttons found:', viewButtons);
    
    if (viewButtons > 0) {
      console.log('Attempting to click first View button...');
      
      // Get the first View button
      const firstViewButton = page.locator('button').filter({ hasText: 'View' }).first();
      
      // Check if button is visible and enabled
      const isVisible = await firstViewButton.isVisible();
      const isEnabled = await firstViewButton.isEnabled();
      console.log('First View button - Visible:', isVisible, 'Enabled:', isEnabled);
      
      if (isVisible && isEnabled) {
        // Click the button and monitor network activity
        console.log('Clicking View button...');
        await firstViewButton.click();
        
        // Wait for potential navigation or modal
        await page.waitForTimeout(2000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after click:', currentUrl);
        
        // Check for any modals or overlays
        const modalExists = await page.locator('[role="dialog"], .modal, .overlay').count() > 0;
        console.log('Modal/overlay exists:', modalExists);
        
        // Check for error messages
        const errorMessages = await page.locator('.error, .alert-danger, [data-testid="error"]').count();
        console.log('Error messages found:', errorMessages);
        
        if (errorMessages > 0) {
          const errorText = await page.locator('.error, .alert-danger, [data-testid="error"]').first().textContent();
          console.log('Error message:', errorText);
        }
      }
    } else {
      console.log('No View buttons found on the page');
      
      // Debug: Check what elements are actually present
      const allButtons = await page.locator('button').count();
      console.log('Total buttons found:', allButtons);
      
      // Get text of all buttons for debugging
      const buttonTexts = await page.locator('button').allTextContents();
      console.log('Button texts:', buttonTexts);
      
      // Check for any loading states
      const loadingElements = await page.locator('.loading, .spinner, [data-testid="loading"]').count();
      console.log('Loading elements:', loadingElements);
    }
    
    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-view-button.png', fullPage: true });
    console.log('Screenshot saved as debug-view-button.png');
  });
});