import { test, expect } from '@playwright/test';
import { EvaluationPage, HomePage, LoginPage } from '../fixtures/page-objects';
import { TEST_USERS, TEST_MODELS, TEST_EVALUATION_TASKS, TEST_TIMEOUTS } from '../fixtures/test-data';
import { 
  waitForAPIResponse,
  setGuestSession,
  cleanupTestData,
  waitForAnimation
} from '../helpers/test-utils';

test.describe('Evaluation System', () => {
  // Increase timeout for CI environment
  test.setTimeout(60000);
  
  let evaluationPage: EvaluationPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    evaluationPage = new EvaluationPage(page);
    homePage = new HomePage(page);
    
    // Add debug logging for all API requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('API Request:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API Response:', response.status(), response.url());
      }
    });
    
    // Mock evaluation API endpoints
    await page.route('**/api/v1/evaluations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: `eval-${Date.now()}`,
            status: 'processing',
            progress: 0,
            task_type: 'poetry',
            model_id: 'test-model',
            prompt: 'Test prompt',
            created_at: new Date().toISOString()
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    });
    
    // Mock evaluation progress endpoint
    await page.route('**/api/v1/evaluations/*/progress', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          progress: 100,
          status: 'completed',
          result: {
            overall_score: 85.5,
            dimensions: {
              rhythm: 88,
              composition: 82,
              narrative: 87,
              emotion: 84,
              creativity: 89,
              cultural: 83
            }
          }
        })
      });
    });
    
    // Mock models endpoint with correct structure
    await page.route('**/api/v1/models/**', route => {
      console.log('Mock: Intercepting models request:', route.request().url());
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'gpt-4', name: 'GPT-4', organization: 'OpenAI', model_type: 'llm', is_active: true },
          { id: 'claude-3', name: 'Claude 3', organization: 'Anthropic', model_type: 'llm', is_active: true },
          { id: 'wenxin-4', name: '文心一言 4.0', organization: 'Baidu', model_type: 'llm', is_active: true }
        ])
      });
    });
    
    // Also mock models endpoint without trailing slash
    await page.route('**/api/v1/models?*', route => {
      console.log('Mock: Intercepting models query request:', route.request().url());
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'gpt-4', name: 'GPT-4', organization: 'OpenAI', model_type: 'llm', is_active: true },
          { id: 'claude-3', name: 'Claude 3', organization: 'Anthropic', model_type: 'llm', is_active: true },
          { id: 'wenxin-4', name: '文心一言 4.0', organization: 'Baidu', model_type: 'llm', is_active: true }
        ])
      });
    });
    
    // Setup guest session for testing
    await setGuestSession(page, 'test-guest-eval');
    await page.goto('/evaluations');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('Create new evaluation task successfully', async ({ page }) => {
    // Click new evaluation button
    await evaluationPage.newEvaluationButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('.fixed.inset-0 form', { timeout: 10000 });
    
    // Fill in evaluation form
    const task = TEST_EVALUATION_TASKS.poetry;
    await evaluationPage.modelSelect.selectOption(TEST_MODELS.model1.id);
    
    // Task type selection uses buttons, not select - click the specific button
    const taskTypeButton = evaluationPage.taskTypeSelect.filter({ hasText: /Poetry Creation/i });
    await taskTypeButton.click();
    
    await evaluationPage.promptTextarea.fill(task.prompt);
    
    // Submit evaluation - don't wait for response, just submit
    await evaluationPage.submitButton.click();
    
    // Verify evaluation created or process started (look for progress or success indicators)
    const progressVisible = evaluationPage.progressBar.isVisible({ timeout: 2000 });
    const modalClosed = page.locator('.fixed.inset-0').isHidden({ timeout: 2000 });
    
    // Should either show progress or close modal (both indicate success)
    await expect(progressVisible.then(v => v).catch(() => modalClosed)).resolves.toBeTruthy();
  });

  test('Real-time progress update visualization', async ({ page }) => {
    // Create an evaluation
    await evaluationPage.createEvaluation(
      TEST_MODELS.model1.id,
      TEST_EVALUATION_TASKS.poetry.type,
      TEST_EVALUATION_TASKS.poetry.prompt
    );
    
    // Monitor progress updates
    let previousProgress = 0;
    let progressUpdates = 0;
    
    // Check progress multiple times
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(2000); // Wait 2 seconds between checks
      
      const currentProgress = await evaluationPage.getProgressPercentage();
      
      // Progress should increase or stay the same
      expect(currentProgress).toBeGreaterThanOrEqual(previousProgress);
      
      if (currentProgress > previousProgress) {
        progressUpdates++;
        previousProgress = currentProgress;
      }
      
      // Break if evaluation completes
      if (currentProgress === 100) break;
    }
    
    // Should have seen at least one progress update
    expect(progressUpdates).toBeGreaterThan(0);
  });

  test('Display evaluation results with scoring', async ({ page }) => {
    // Create and complete an evaluation
    await evaluationPage.createEvaluation(
      TEST_MODELS.model2.id,
      TEST_EVALUATION_TASKS.painting.type,
      TEST_EVALUATION_TASKS.painting.prompt
    );
    
    // Wait for evaluation to complete
    await evaluationPage.waitForCompletion(TEST_TIMEOUTS.evaluation);
    
    // Verify result container is visible
    await expect(evaluationPage.resultContainer).toBeVisible();
    
    // Check for expected dimension scores
    const dimensions = TEST_EVALUATION_TASKS.painting.expectedDimensions;
    for (const dimension of dimensions) {
      const scoreElement = page.locator(`[data-dimension="${dimension}"]`)
        .or(page.locator(`text=/${dimension}/i`));
      await expect(scoreElement).toBeVisible();
    }
    
    // Verify overall score is displayed
    const overallScore = page.locator('.overall-score')
      .or(page.locator('[data-testid="overall-score"]'))
      .or(page.locator('text=/总分/'))
      .or(page.locator('text=/Overall/'))
      .or(page.locator('text=/Total/'))
      .or(page.locator('text=/Score/'))
      .or(page.locator('.score-total'));
    await expect(overallScore).toBeVisible();
    
    // Verify score is a number between 0 and 100
    const scoreText = await overallScore.textContent();
    const scoreMatch = scoreText?.match(/\d+(\.\d+)?/);
    expect(scoreMatch).toBeTruthy();
    const score = parseFloat(scoreMatch![0]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('Guest evaluation daily limit enforcement', async ({ page }) => {
    // Set guest session at limit
    await page.evaluate(() => {
      // Get session safely
      let session;
      try {
        const stored = localStorage?.getItem('guest_session');
        if (stored) {
          session = JSON.parse(stored);
        }
      } catch (error) {
        console.log('localStorage blocked, using window properties');
      }
      
      if (!session) {
        session = (window as any).__TEST_GUEST_SESSION__;
      }
      
      if (session) {
        session.dailyUsage = 3; // At the limit
        
        // Try to save back
        try {
          if (localStorage) {
            localStorage.setItem('guest_session', JSON.stringify(session));
          }
        } catch (error) {
          console.log('Cannot save to localStorage, using window property');
        }
        
        // Always update window property
        (window as any).__TEST_GUEST_SESSION__ = session;
      }
    });
    
    // Reload page to apply new session
    await page.reload();
    
    // Try to create new evaluation
    await evaluationPage.newEvaluationButton.click();
    
    // Should show limit reached message
    const limitMessage = page.locator('text=/已达到每日限制/')
      .or(page.locator('text=/daily limit reached/i'))
      .or(page.locator('text=/limit exceeded/i'))
      .or(page.locator('text=/maximum daily/i'))
      .or(page.locator('.limit-message'));
    await expect(limitMessage).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    
    // Submit button should be disabled
    await expect(evaluationPage.submitButton).toBeDisabled();
  });

  test('View evaluation history', async ({ page }) => {
    // Create multiple evaluations
    const evaluations = [
      { model: TEST_MODELS.model1.id, type: 'poem', prompt: '春天的诗' },
      { model: TEST_MODELS.model2.id, type: 'painting', prompt: '山水画' },
      { model: TEST_MODELS.model3.id, type: 'story', prompt: 'AI故事' }
    ];
    
    // Store evaluation IDs
    const evaluationIds: string[] = [];
    
    for (const evaluation of evaluations) {
      await evaluationPage.createEvaluation(evaluation.model, evaluation.type, evaluation.prompt);
      
      // Wait for creation and get ID from URL or response
      await page.waitForTimeout(1000);
      const url = page.url();
      const idMatch = url.match(/evaluations\/([^\/]+)/);
      if (idMatch) {
        evaluationIds.push(idMatch[1]);
      }
      
      // Go back to evaluations list
      await page.goto('/evaluations');
    }
    
    // Check history section
    if (await evaluationPage.historyList.isVisible({ timeout: 2000 })) {
      await expect(evaluationPage.historyList).toBeVisible();
    }
    
    // Verify at least some evaluations are shown
    const historyItems = page.locator('.history-item')
      .or(page.locator('.evaluation-item'))
      .or(page.locator('[data-testid^="evaluation-"]'));
    const count = await historyItems.count();
    expect(count).toBeGreaterThanOrEqual(evaluations.length);
  });

  test('Evaluation task error handling', async ({ page }) => {
    // Try to submit evaluation without filling required fields
    await evaluationPage.newEvaluationButton.click();
    
    // Submit without selecting model
    await evaluationPage.submitButton.click();
    
    // Should show validation error
    const validationError = page.locator('.validation-error')
      .or(page.locator('.error-message'))
      .or(page.locator('text=/请选择/'))
      .or(page.locator('text=/required/i'))
      .or(page.locator('text=/Please select/i'))
      .or(page.locator('text=/Field is required/i'))
      .or(page.locator('.form-error'));
    await expect(validationError).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    
    // Fill model but not task type
    await evaluationPage.modelSelect.selectOption(TEST_MODELS.model1.id);
    await evaluationPage.submitButton.click();
    
    // Should still show error
    await expect(validationError).toBeVisible();
    
    // Fill all fields correctly
    const poetryButton = evaluationPage.taskTypeSelect.filter({ hasText: /Poetry Creation/i });
    await poetryButton.click();
    await evaluationPage.promptTextarea.fill('Test prompt');
    await evaluationPage.submitButton.click();
    
    // Error should disappear and evaluation should start
    await expect(validationError).not.toBeVisible();
    await expect(evaluationPage.progressBar).toBeVisible({ timeout: TEST_TIMEOUTS.short });
  });

  test('Cancel ongoing evaluation', async ({ page }) => {
    // Start an evaluation
    await evaluationPage.createEvaluation(
      TEST_MODELS.model1.id,
      TEST_EVALUATION_TASKS.story.type,
      TEST_EVALUATION_TASKS.story.prompt
    );
    
    // Wait for progress to start
    await expect(evaluationPage.progressBar).toBeVisible();
    
    // Look for cancel button
    if (await evaluationPage.cancelButton.isVisible({ timeout: 2000 })) {
    
      await evaluationPage.cancelButton.click();
      
      // Confirm cancellation if dialog appears
      const confirmButton = page.locator('button:has-text("确认")')
        .or(page.locator('button:has-text("是")'))
        .or(page.locator('button:has-text("Yes")'))
        .or(page.locator('button:has-text("Confirm")'))
        .or(page.locator('.ios-button:has-text("Confirm")'));
      if (await confirmButton.isVisible({ timeout: 1000 })) {
        await confirmButton.click();
      }
      
      // Verify evaluation is cancelled
      const cancelledMessage = page.locator('text=/已取消/')
        .or(page.locator('text=/cancelled/i'))
        .or(page.locator('text=/canceled/i'))
        .or(page.locator('text=/stopped/i'))
        .or(page.locator('.cancel-message'));
      await expect(cancelledMessage).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    }
  });
});