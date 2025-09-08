const { chromium } = require('playwright');

async function testVulca47D() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('📊 Testing VULCA 47D Display Issues on Leaderboard Page...\n');
  
  // Navigate to leaderboard
  await page.goto('http://localhost:5173/#/leaderboard');
  await page.waitForTimeout(2000);
  
  // Find and click the first 47D button
  const button47D = await page.locator('button:has-text("47D")').first();
  
  if (await button47D.isVisible()) {
    console.log('✅ Found 47D button, clicking to expand...');
    await button47D.click();
    await page.waitForTimeout(1000);
    
    // Check if VULCA visualization is loaded
    const vulcaSection = await page.locator('.vulca-visualization');
    if (await vulcaSection.isVisible()) {
      console.log('✅ VULCA visualization section is visible');
      
      // Check for different view modes
      const viewModes = await page.locator('[role="tablist"] button, button:has-text("Overview"), button:has-text("Grouped"), button:has-text("Detailed")');
      const viewModeCount = await viewModes.count();
      console.log(`📊 Found ${viewModeCount} view mode buttons`);
      
      // Check for dimension data
      const dimensions = await page.locator('.dimension-item, [class*="dimension"], text=/originality|imagination|precision/i');
      const dimensionCount = await dimensions.count();
      console.log(`📊 Found ${dimensionCount} dimension elements`);
      
      // Check for scores display
      const scores = await page.locator('text=/[0-9]+\.[0-9]+/').all();
      console.log(`📊 Found ${scores.length} score values displayed`);
      
      // Check for any error messages
      const errors = await page.locator('text=/error|fail|undefined|NaN/i').all();
      if (errors.length > 0) {
        console.log(`⚠️ Found ${errors.length} potential error indicators`);
        for (const error of errors) {
          const text = await error.textContent();
          console.log(`  - Error text: "${text}"`);
        }
      }
      
      // Take screenshot for visual inspection
      await page.screenshot({ path: 'vulca-47d-expanded.png', fullPage: true });
      console.log('📸 Screenshot saved as vulca-47d-expanded.png');
      
      // Try to find the actual chart/visualization element
      const charts = await page.locator('canvas, svg:has(g), .recharts-wrapper, [class*="chart"], [class*="radar"]');
      const chartCount = await charts.count();
      console.log(`📊 Found ${chartCount} chart/visualization elements`);
      
      // Check for data labels
      const labels = await page.locator('text=/Creativity|Technical|Emotional|Contextual|Innovation|Impact/').all();
      console.log(`📊 Found ${labels.length} category labels`);
      
      // Inspect the DOM structure
      const vulcaContent = await vulcaSection.innerHTML();
      const hasRadarChart = vulcaContent.includes('radar') || vulcaContent.includes('Radar');
      const hasParallelCoords = vulcaContent.includes('parallel') || vulcaContent.includes('Parallel');
      const hasDimensions = vulcaContent.includes('dimension') || vulcaContent.includes('Dimension');
      
      console.log('\n📋 Content Analysis:');
      console.log(`  - Has radar chart references: ${hasRadarChart}`);
      console.log(`  - Has parallel coordinates references: ${hasParallelCoords}`);
      console.log(`  - Has dimension references: ${hasDimensions}`);
      
      // Check for incomplete rendering
      const loadingIndicators = await page.locator('text=/loading|Loading|加载/i, .spinner, [class*="spin"]').all();
      if (loadingIndicators.length > 0) {
        console.log(`⚠️ Found ${loadingIndicators.length} loading indicators - content may not be fully loaded`);
      }
      
      // Check viewport and scrollability
      const vulcaBox = await vulcaSection.boundingBox();
      if (vulcaBox) {
        console.log(`\n📐 Visualization dimensions: ${vulcaBox.width}x${vulcaBox.height}px`);
        if (vulcaBox.height < 200) {
          console.log('⚠️ Visualization height seems too small, content might be collapsed');
        }
      }
      
    } else {
      console.log('❌ VULCA visualization section not found after clicking 47D button');
    }
  } else {
    console.log('❌ No 47D button found on the page');
  }
  
  // Keep browser open for manual inspection
  console.log('\n🔍 Browser will stay open for manual inspection. Close it when done.');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

testVulca47D().catch(console.error);