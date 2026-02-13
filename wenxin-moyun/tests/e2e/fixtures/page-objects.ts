import { Page, Locator } from '@playwright/test';
import { withRoute, urlMatcher } from '../utils/route-helper';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string) {
    // Support dynamic port detection for MCP integration
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
    const fullURL = path.startsWith('http') ? path : `${baseURL}${withRoute(path)}`;
    await this.page.goto(fullURL);
  }

  /**
   * Wait for URL to match (supports both hash and non-hash patterns)
   */
  async expectURL(path: string) {
    await this.page.waitForURL(urlMatcher(path));
  }

  async waitForLoadComplete() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/visual/baseline/${name}.png`, fullPage: true });
  }
}

export class HomePage extends BasePage {
  readonly heroTitle: Locator;
  readonly exploreRankingsButton: Locator;
  readonly modelBattleButton: Locator;
  readonly leaderboardLink: Locator;
  readonly battleLink: Locator;
  readonly navMenu: Locator;
  readonly homeLink: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly startExperienceButton: Locator;

  constructor(page: Page) {
    super(page);
    // Updated selectors for iOS design system
    this.heroTitle = page.locator('main h1.text-large-title').first();
    this.exploreRankingsButton = page.locator('[data-testid="explore-rankings-button"], a[href="/models"], a[href="/leaderboard"], button:has-text("Explore Rankings"), button:has-text("排行榜")').first();
    this.modelBattleButton = page.locator('[data-testid="hero-try-demo"], a[href="/vulca"], button:has-text("Try Public Demo"), button:has-text("Model Battle"), button:has-text("模型对战")').first();
    this.leaderboardLink = page.locator('a[href="/models"], a[href="/leaderboard"], nav a:has-text("Models"), nav a:has-text("Leaderboard"), nav a:has-text("Rankings")').first();
    this.battleLink = page.locator('a[href="/vulca"], nav a:has-text("VULCA")').first();
    this.navMenu = page.locator('nav');
    this.homeLink = page.locator('[data-testid="nav-home"], a[href="/"], nav a:has-text("首页")');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("登录"), a[href*="login"]');
    this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("退出登录"), [data-testid="logout-btn"], .logout-button, nav button:has-text("Logout")');
    this.startExperienceButton = page.locator('button:has-text("Start Experience"), button:has-text("开始体验"), button:has-text("Guest Mode")');
  }

  async clickExploreRankings() {
    if (await this.exploreRankingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.exploreRankingsButton.click();
      return;
    }
    await this.navigate('/models');
  }

  async clickModelBattle() {
    if (await this.modelBattleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.modelBattleButton.click();
      return;
    }
    await this.navigate('/vulca');
  }

  async navigateToLogin() {
    // First try clicking login button if visible
    if (await this.loginButton.isVisible({ timeout: 2000 })) {
      await this.loginButton.click();
    } else {
      // Fallback: navigate directly to login page
      await this.navigate('/login');
    }
    // Wait for login page to load
    await this.page.waitForURL(urlMatcher('/login'));
  }

  async clickStartExperience() {
    if (await this.startExperienceButton.isVisible({ timeout: 2000 })) {
      await this.startExperienceButton.click();
    } else {
      // Fallback: just set guest mode manually
      console.log('Start experience button not found, setting guest mode via JavaScript');
      await this.page.evaluate(() => {
        // Create guest session directly
        const session = {
          id: 'test-guest-manual',
          dailyUsage: 0,
          lastReset: new Date().toDateString(),
          evaluations: []
        };
        try {
          if (localStorage) {
            localStorage.setItem('guest_session', JSON.stringify(session));
          }
        } catch (e) {
          console.log('localStorage not available, using window property');
        }
        (window as any).__TEST_GUEST_SESSION__ = session;
      });
    }
  }
}

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly guestModeButton: Locator;
  readonly loginForm: Locator;
  readonly successMessage: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Updated to match actual LoginPage.tsx implementation
    this.usernameInput = page.locator('input[name="username"], input[id="username"], input[placeholder*="username"], input[placeholder*="Username"]');
    this.passwordInput = page.locator('input[name="password"], input[id="password"], input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Signing in"), button:has-text("Login")');
    this.errorMessage = page.locator('.bg-red-50.border.border-red-200, .text-red-700, .error-message, div:has-text("failed")');
    this.guestModeButton = page.locator('button:has-text("Guest"), button:has-text("Continue as Guest"), button:has-text("Use admin account")');
    this.loginForm = page.locator('form, .glass-effect form');
    this.successMessage = page.locator('.success-message, text=/successfully/i, text=/signed in/i');
    this.welcomeMessage = page.locator('text=Profile, text=Dashboard, [data-testid="user-menu"], .user-menu, button:has-text("Logout"), button:has-text("退出登录"), text=/logged in/i, text=/welcome/i').first();
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async enterGuestMode() {
    await this.guestModeButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}

export class EvaluationPage extends BasePage {
  readonly newEvaluationButton: Locator;
  readonly modelSelect: Locator;
  readonly taskTypeSelect: Locator;
  readonly promptTextarea: Locator;
  readonly submitButton: Locator;
  readonly progressBar: Locator;
  readonly resultContainer: Locator;
  readonly evaluationForm: Locator;
  readonly historyList: Locator;
  readonly usageLimit: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    // Enhanced English interface support for evaluation system
    this.newEvaluationButton = page.locator('button:has-text("Create Task"), button:has-text("新建评测"), button:has-text("开始评测"), button:has-text("New Evaluation"), button:has-text("Start Evaluation"), button:has-text("Create"), .ios-button:has-text("New"), .ios-button:has-text("Start")');
    // Form elements are in modal - need to wait for modal to open first
    this.modelSelect = page.locator('.fixed.inset-0 form select, .modal form select, [role="dialog"] form select').first();
    this.taskTypeSelect = page.locator('.fixed.inset-0 .grid button, .modal .grid button, [role="dialog"] .grid button');
    this.promptTextarea = page.locator('.fixed.inset-0 textarea, .modal textarea, [role="dialog"] textarea');
    this.submitButton = page.locator('.fixed.inset-0 button[type="submit"], .modal button[type="submit"], [role="dialog"] button[type="submit"]');
    this.progressBar = page.locator('.progress-bar, [role="progressbar"], .progress, .ios-progress, .evaluation-progress');
    this.resultContainer = page.locator('.evaluation-result, .result-container, .results, .output, .evaluation-output');
    this.evaluationForm = page.locator('.fixed.inset-0 form, .modal form, [role="dialog"] form');
    this.historyList = page.locator('.history, .evaluation-history, .past-evaluations');
    this.usageLimit = page.locator('text=/剩余.*次/, text=/remaining/i, .usage-limit, .daily-limit');
    this.cancelButton = page.locator('.fixed.inset-0 button:has-text("取消"), .fixed.inset-0 button:has-text("Cancel"), .modal .cancel-btn');
  }

  async createEvaluation(modelId: string, taskType: string, prompt: string) {
    // Click the button to open modal
    await this.newEvaluationButton.click();
    
    // Wait for modal to open and form to be visible
    await this.page.waitForSelector('.fixed.inset-0 form, .modal form, [role="dialog"] form', { timeout: 10000 });
    
    // Wait for loading state to disappear (models to load)
    await this.page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 10000 }).catch(() => {
      console.log('No loading state found or it did not disappear');
    });
    
    // Wait a bit more for modal animation and data loading to complete  
    await this.page.waitForTimeout(1000);
    
    // Verify form elements are available
    console.log('Checking form elements availability...');
    const modelOptions = await this.modelSelect.locator('option').count();
    const taskButtons = await this.taskTypeSelect.count();
    console.log(`Model options: ${modelOptions}, Task buttons: ${taskButtons}`);
    
    // Fill form fields
    await this.modelSelect.selectOption(modelId);
    
    // Task type is button-based, not select-based - find and click the right button
    const taskTypeButton = this.taskTypeSelect.filter({ hasText: new RegExp(taskType === 'poem' ? 'Poetry Creation' : taskType === 'story' ? 'Story Creation' : taskType === 'painting' ? 'Painting Creation' : 'Music Creation', 'i') });
    await taskTypeButton.click();
    
    await this.promptTextarea.fill(prompt);
    await this.submitButton.click();
  }

  async waitForCompletion(timeout = 60000) {
    await this.page.waitForSelector('.evaluation-complete, .result-container', { timeout });
  }

  async getProgressPercentage() {
    const progressText = await this.progressBar.getAttribute('aria-valuenow');
    return progressText ? parseInt(progressText) : 0;
  }
}

export class BattlePage extends BasePage {
  readonly model1Container: Locator;
  readonly model2Container: Locator;
  readonly voteButton1: Locator;
  readonly voteButton2: Locator;
  readonly skipButton: Locator;
  readonly resultMessage: Locator;
  readonly battleContainer: Locator;
  readonly statsContainer: Locator;
  readonly nextBattleButton: Locator;

  constructor(page: Page) {
    super(page);
    // Updated to match actual BattlePage.tsx implementation - voting happens through model container clicks
    this.model1Container = page.locator('.grid.grid-cols-1.gap-6.lg\\:grid-cols-2 > :first-child');
    this.model2Container = page.locator('.grid.grid-cols-1.gap-6.lg\\:grid-cols-2 > :last-child');
    // Vote "buttons" are actually the entire model containers (they have onClick handlers)
    this.voteButton1 = this.model1Container;
    this.voteButton2 = this.model2Container;
    this.skipButton = page.locator('button:has-text("Refresh Battle"), .ios-button:has-text("Refresh"), button:has-text("Skip"), button:has-text("Next")');
    this.resultMessage = page.locator('text=/Vote Rate/, text=/votes/, .text-center:has-text("votes")').first();
    this.battleContainer = page.locator('.ios-glass.liquid-glass-container.rounded-xl.shadow-xl.p-8');
    this.statsContainer = page.locator('.mt-8.flex.justify-center.space-x-8');
    this.nextBattleButton = page.locator('button:has-text("Next Battle"), .ios-button svg.w-5.h-5');
  }

  async voteForModel1() {
    await this.voteButton1.click();
  }

  async voteForModel2() {
    await this.voteButton2.click();
  }

  async skipBattle() {
    await this.skipButton.click();
  }

  async getModelNames() {
    try {
      // 在未投票状态下，页面显示"Model A"/"Model B"，这是正常的设计
      // 投票后才显示真实模型名称，这确保了公平的匿名投票
      const model1Name = await this.model1Container.locator('h3').first().textContent() || 'Model A';
      const model2Name = await this.model2Container.locator('h3').first().textContent() || 'Model B';
      
      console.log(`Model names retrieved: "${model1Name.trim()}" vs "${model2Name.trim()}"`);
      return { model1: model1Name.trim(), model2: model2Name.trim() };
    } catch (error) {
      console.log('Could not get model names, using defaults');
      return { model1: 'Model A', model2: 'Model B' };
    }
  }

  async hasVoted() {
    try {
      // 检查是否有投票结果显示（百分比条形图）
      const voteBar = this.page.locator('.bg-primary-500, .bg-secondary-500').first();
      return await voteBar.isVisible({ timeout: 1000 });
    } catch (error) {
      return false;
    }
  }

  async getModelNamesAfterVote() {
    try {
      // 投票后应该显示真实的模型名称
      await this.page.waitForTimeout(1000); // 等待DOM更新
      const model1Name = await this.model1Container.locator('h3').first().textContent() || 'Unknown Model A';
      const model2Name = await this.model2Container.locator('h3').first().textContent() || 'Unknown Model B';
      
      console.log(`Post-vote model names: "${model1Name.trim()}" vs "${model2Name.trim()}"`);
      return { model1: model1Name.trim(), model2: model2Name.trim() };
    } catch (error) {
      console.log('Could not get post-vote model names');
      return { model1: 'Unknown Model A', model2: 'Unknown Model B' };
    }
  }
}

export class LeaderboardPage extends BasePage {
  readonly categoryTabs: Locator;
  readonly rankingTable: Locator;
  readonly searchInput: Locator;
  readonly sortSelect: Locator;
  readonly filterOptions: Locator;
  readonly modelCards: Locator;

  constructor(page: Page) {
    super(page);
    // Enhanced English interface support for leaderboard
    this.categoryTabs = page.locator('.category-tabs, [role="tablist"], .tabs, .filter-tabs, .model-type-tabs');
    this.rankingTable = page.locator('table, .ranking-table, .leaderboard-table, .models-list');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"], .search-input');
    this.sortSelect = page.locator('select[name="sort"], #sort-select, .sort-selector, .sort-dropdown');
    this.filterOptions = page.locator('.filter-options, .model-filters, .type-filters');
    this.modelCards = page.locator('.model-card, .ranking-item, .leaderboard-item');
  }

  async selectCategory(category: string) {
    await this.categoryTabs.locator(`button:has-text("${category}")`).click();
  }

  async searchModel(query: string) {
    await this.searchInput.fill(query);
  }

  async getTopModel() {
    const firstRow = this.rankingTable.locator('tbody tr:first-child, .ranking-item:first-child');
    const modelName = await firstRow.locator('.model-name, td:nth-child(2)').textContent();
    return modelName;
  }

  async getModelRank(modelName: string) {
    const row = this.rankingTable.locator(`tr:has-text("${modelName}"), .ranking-item:has-text("${modelName}")`);
    const rank = await row.locator('.rank, td:first-child').textContent();
    return rank;
  }
}
