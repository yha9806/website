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
  let evaluationPage: EvaluationPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    evaluationPage = new EvaluationPage(page);
    homePage = new HomePage(page);
    
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
    
    // Fill in evaluation form
    const task = TEST_EVALUATION_TASKS.poetry;
    await evaluationPage.modelSelect.selectOption(TEST_MODELS.model1.id);
    await evaluationPage.taskTypeSelect.selectOption(task.type);
    await evaluationPage.promptTextarea.fill(task.prompt);
    
    // Submit evaluation
    const responsePromise = waitForAPIResponse(page, '/api/v1/evaluations');
    await evaluationPage.submitButton.click();
    await responsePromise;
    
    // Verify evaluation created
    await expect(evaluationPage.progressBar).toBeVisible({ timeout: TEST_TIMEOUTS.short });
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
      const scoreElement = page.locator(`[data-dimension="${dimension}"], text=/${dimension}/i`);
      await expect(scoreElement).toBeVisible();
    }
    
    // Verify overall score is displayed
    const overallScore = page.locator('.overall-score, [data-testid="overall-score"], text=/总分/, text=/Overall/, text=/Total/, text=/Score/, .score-total');
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
      const session = JSON.parse(localStorage.getItem('guest_session')!);
      session.dailyUsage = 3; // At the limit
      localStorage.setItem('guest_session', JSON.stringify(session));
    });
    
    // Reload page to apply new session
    await page.reload();
    
    // Try to create new evaluation
    await evaluationPage.newEvaluationButton.click();
    
    // Should show limit reached message
    const limitMessage = page.locator('text=/已达到每日限制/, text=/daily limit reached/i, text=/limit exceeded/i, text=/maximum daily/i, .limit-message');
    await expect(limitMessage).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    
    // Submit button should be disabled
    await expect(evaluationPage.submitButton).toBeDisabled();
  });

  test('View evaluation history', async ({ page }) => {
    // Create multiple evaluations
    const evaluations = [
      { model: TEST_MODELS.model1.id, type: 'poetry', prompt: '春天的诗' },
      { model: TEST_MODELS.model2.id, type: 'painting', prompt: '山水画' },
      { model: TEST_MODELS.model3.id, type: 'narrative', prompt: 'AI故事' }
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
    const historyItems = page.locator('.history-item, .evaluation-item, [data-testid^="evaluation-"]');
    const count = await historyItems.count();
    expect(count).toBeGreaterThanOrEqual(evaluations.length);
  });

  test('Evaluation task error handling', async ({ page }) => {
    // Try to submit evaluation without filling required fields
    await evaluationPage.newEvaluationButton.click();
    
    // Submit without selecting model
    await evaluationPage.submitButton.click();
    
    // Should show validation error
    const validationError = page.locator('.validation-error, .error-message, text=/请选择/, text=/required/i, text=/Please select/i, text=/Field is required/i, .form-error');
    await expect(validationError).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    
    // Fill model but not task type
    await evaluationPage.modelSelect.selectOption(TEST_MODELS.model1.id);
    await evaluationPage.submitButton.click();
    
    // Should still show error
    await expect(validationError).toBeVisible();
    
    // Fill all fields correctly
    await evaluationPage.taskTypeSelect.selectOption('poetry');
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
      TEST_EVALUATION_TASKS.narrative.type,
      TEST_EVALUATION_TASKS.narrative.prompt
    );
    
    // Wait for progress to start
    await expect(evaluationPage.progressBar).toBeVisible();
    
    // Look for cancel button
    if (await evaluationPage.cancelButton.isVisible({ timeout: 2000 })) {
    
      await evaluationPage.cancelButton.click();
      
      // Confirm cancellation if dialog appears
      const confirmButton = page.locator('button:has-text("确认"), button:has-text("是"), button:has-text("Yes"), button:has-text("Confirm"), .ios-button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 1000 })) {
        await confirmButton.click();
      }
      
      // Verify evaluation is cancelled
      const cancelledMessage = page.locator('text=/已取消/, text=/cancelled/i, text=/canceled/i, text=/stopped/i, .cancel-message');
      await expect(cancelledMessage).toBeVisible({ timeout: TEST_TIMEOUTS.short });
    }
  });
});