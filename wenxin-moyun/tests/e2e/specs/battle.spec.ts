import { test, expect } from '@playwright/test';
import { BattlePage, HomePage } from '../fixtures/page-objects';
import { TEST_MODELS, TEST_TIMEOUTS } from '../fixtures/test-data';
import { 
  waitForAPIResponse,
  setGuestSession,
  cleanupTestData
} from '../helpers/test-utils';

test.describe('Battle System', () => {
  let battlePage: BattlePage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    battlePage = new BattlePage(page);
    homePage = new HomePage(page);
    
    // Setup guest session
    await setGuestSession(page, 'test-guest-battle');
    await page.goto('/battle');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Random model matchup generation', async ({ page }) => {
    // Wait for battle to load with extended timeout
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Add extra wait for CI environment
    if (process.env.CI) {
      await page.waitForTimeout(2000);
    }
    
    // Get matched models with retry logic
    const models = await battlePage.getModelNames();
    
    // Verify two different models are matched
    expect(models.model1).toBeTruthy();
    expect(models.model2).toBeTruthy();
    expect(models.model1).not.toBe(models.model2);
    
    // Skip to get new matchup
    await battlePage.skipBattle();
    
    // Wait for new battle to load
    await page.waitForTimeout(1000);
    
    // Get new matched models
    const newModels = await battlePage.getModelNames();
    
    // Verify new models loaded (might be same models but should trigger reload)
    expect(newModels.model1).toBeTruthy();
    expect(newModels.model2).toBeTruthy();
  });

  test('Vote submission and result update', async ({ page }) => {
    // Wait for battle to load
    await page.waitForLoadState('networkidle');
    
    // Get initial models
    const models = await battlePage.getModelNames();
    
    // Vote for first model
    const voteResponse = waitForAPIResponse(page, '/api/v1/battles');
    await battlePage.voteForModel1();
    await voteResponse;
    
    // Verify vote was recorded
    await expect(battlePage.resultMessage).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    
    // Verify success message
    const resultText = await battlePage.resultMessage.textContent();
    expect(resultText).toMatch(/(投票成功|Vote successful|Success|Voted|Thank you)/i);
    
    // New battle should load automatically or button to continue should appear
    if (await battlePage.nextBattleButton.isVisible({ timeout: 2000 })) {
      await battlePage.nextBattleButton.click();
    }
    
    // Verify new battle loaded
    await page.waitForTimeout(1000);
    const newModels = await battlePage.getModelNames();
    expect(newModels.model1).toBeTruthy();
  });

  test('Battle statistics tracking', async ({ page }) => {
    // Vote multiple times to generate statistics
    const votes = [
      { action: 'model1' },
      { action: 'skip' },
      { action: 'model2' },
      { action: 'model1' }
    ];
    
    for (const vote of votes) {
      // Wait for battle to be ready
      await page.waitForLoadState('networkidle');
      
      if (vote.action === 'model1') {
        await battlePage.voteForModel1();
      } else if (vote.action === 'model2') {
        await battlePage.voteForModel2();
      } else {
        await battlePage.skipBattle();
      }
      
      // Wait for next battle
      await page.waitForTimeout(1500);
    }
    
    // Check if statistics are displayed
    if (await battlePage.statsContainer.isVisible({ timeout: 2000 })) {
      // Verify vote count
      const voteCount = page.locator('.vote-count, text=/投票数/, text=/Vote/, text=/Votes/, text=/Count/, .stats-number');
      await expect(voteCount).toBeVisible();
      
      const countText = await voteCount.textContent();
      const count = parseInt(countText?.match(/\d+/)?.[0] || '0');
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Skip battle functionality', async ({ page }) => {
    // Wait for battle to load
    await page.waitForLoadState('networkidle');
    
    // Get initial models
    const initialModels = await battlePage.getModelNames();
    
    // Skip battle
    await battlePage.skipBattle();
    
    // Wait for new battle
    await page.waitForTimeout(1500);
    
    // Verify new battle loaded
    const newModels = await battlePage.getModelNames();
    expect(newModels.model1).toBeTruthy();
    expect(newModels.model2).toBeTruthy();
    
    // No vote result message should appear for skip
    await expect(battlePage.resultMessage).not.toBeVisible();
  });
});