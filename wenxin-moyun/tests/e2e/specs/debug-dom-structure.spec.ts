import { test, expect } from '@playwright/test';

test.describe('DOM Structure Analysis', () => {
  test('Analyze complete DOM structure of leaderboard', async ({ page }) => {
    console.log('🔍 Navigating to production leaderboard...');
    await page.goto('https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html#/leaderboard');
    
    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Find all View buttons anywhere on the page
    console.log('=== ANALYZING VIEW BUTTONS ===');
    const allViewButtons = page.locator('button:has-text("View")');
    const viewButtonCount = await allViewButtons.count();
    console.log(`📊 Total View buttons on page: ${viewButtonCount}`);
    
    for (let i = 0; i < Math.min(viewButtonCount, 5); i++) {
      const button = allViewButtons.nth(i);
      const buttonText = await button.textContent();
      const buttonClass = await button.getAttribute('class');
      const parentElement = button.locator('..');
      const parentTag = await parentElement.evaluate(el => el.tagName);
      const parentClass = await parentElement.getAttribute('class');
      
      console.log(`Button ${i + 1}:`);
      console.log(`  Text: "${buttonText}"`);
      console.log(`  Classes: ${buttonClass}`);
      console.log(`  Parent: ${parentTag}.${parentClass}`);
      console.log(`  ---`);
    }
    
    console.log('\n=== ANALYZING TABLE STRUCTURE ===');
    // Check table structure
    const table = page.locator('table').first();
    const tableExists = await table.count() > 0;
    console.log(`📊 Table exists: ${tableExists}`);
    
    if (tableExists) {
      const headerCells = await table.locator('thead th').allTextContents();
      console.log(`📋 Header cells: ${JSON.stringify(headerCells)}`);
      
      const bodyRows = await table.locator('tbody tr').count();
      console.log(`📊 Body rows: ${bodyRows}`);
      
      if (bodyRows > 0) {
        // Analyze first row structure
        const firstRow = table.locator('tbody tr').first();
        const firstRowCells = await firstRow.locator('td').count();
        console.log(`📊 First row cells: ${firstRowCells}`);
        
        // Get content of each cell in first row
        for (let i = 0; i < firstRowCells; i++) {
          const cell = firstRow.locator(`td:nth-child(${i + 1})`);
          const cellContent = await cell.textContent();
          const cellButtons = await cell.locator('button').count();
          console.log(`  Cell ${i + 1}: "${cellContent}" (${cellButtons} buttons)`);
        }
        
        // Check if there are buttons in the last column specifically
        const lastCell = firstRow.locator('td').last();
        const lastCellButtons = await lastCell.locator('button').count();
        const lastCellHTML = await lastCell.innerHTML();
        console.log(`📊 Last cell buttons: ${lastCellButtons}`);
        console.log(`📋 Last cell HTML: ${lastCellHTML}`);
      }
    }
    
    console.log('\n=== ANALYZING CARD STRUCTURE ===');
    // Check if there are cards instead of/in addition to table
    const cards = page.locator('.card, [data-testid="model-card"], .model-card');
    const cardCount = await cards.count();
    console.log(`📊 Model cards found: ${cardCount}`);
    
    if (cardCount > 0) {
      const firstCard = cards.first();
      const cardButtons = await firstCard.locator('button').count();
      const cardButtonTexts = await firstCard.locator('button').allTextContents();
      console.log(`📊 First card buttons: ${cardButtons}`);
      console.log(`📋 First card button texts: ${JSON.stringify(cardButtonTexts)}`);
    }
    
    console.log('\n=== CHECKING VIEW MODE ===');
    // Check current view mode
    const viewModeButtons = page.locator('button:has-text("Table"), button:has-text("Card")');
    const viewModeCount = await viewModeButtons.count();
    console.log(`📊 View mode buttons: ${viewModeCount}`);
    
    if (viewModeCount > 0) {
      const activeViewMode = await page.locator('button[class*="active"], button[aria-pressed="true"]').textContent();
      console.log(`📋 Active view mode: ${activeViewMode}`);
    }
    
    // Try clicking View button if found
    if (viewButtonCount > 0) {
      console.log('\n=== ATTEMPTING TO CLICK VIEW BUTTON ===');
      const firstViewButton = allViewButtons.first();
      
      // Record current URL
      const urlBefore = page.url();
      console.log(`📍 URL before click: ${urlBefore}`);
      
      // Click the button
      await firstViewButton.click();
      
      // Wait for potential changes
      await page.waitForTimeout(2000);
      
      // Check URL after click
      const urlAfter = page.url();
      console.log(`📍 URL after click: ${urlAfter}`);
      
      if (urlBefore !== urlAfter) {
        console.log('✅ Navigation occurred!');
        
        // Check if we're on a model detail page
        const isModelDetail = urlAfter.includes('#/model/');
        console.log(`📄 Is model detail page: ${isModelDetail}`);
        
        if (isModelDetail) {
          // Wait for content and check for errors
          await page.waitForTimeout(2000);
          const errorCount = await page.locator('.error, [data-testid="error"]').count();
          console.log(`❌ Errors on detail page: ${errorCount}`);
          
          if (errorCount > 0) {
            const errorText = await page.locator('.error, [data-testid="error"]').first().textContent();
            console.log(`📝 Error message: ${errorText}`);
          }
        }
      } else {
        console.log('❌ No navigation occurred');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'dom-analysis-result.png', fullPage: true });
      console.log('📸 Screenshot saved: dom-analysis-result.png');
    }
  });
});