import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string) {
    await this.page.goto(path);
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
  readonly startButton: Locator;
  readonly loginButton: Locator;
  readonly leaderboardLink: Locator;
  readonly battleLink: Locator;
  readonly navMenu: Locator;
  readonly homeLink: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    // Comprehensive English iOS interface support
    this.heroTitle = page.locator('h1:has-text("WenXin MoYun"), h1:has-text("AI Art Evaluation"), h1:has-text("文心墨韵"), h1:has-text("AI"), h1.text-large-title');
    this.startButton = page.locator('button:has-text("Explore Rankings"), button:has-text("Get Started"), button:has-text("开始体验"), button:has-text("Start"), .ios-button:has-text("Explore"), .ios-button:has-text("Rankings")');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("登录"), .ios-button:has-text("Login"), .ios-button:has-text("Sign")');
    this.leaderboardLink = page.locator('a[href="/leaderboard"], a:has-text("Leaderboard"), a:has-text("Rankings"), a:has-text("排行榜")');
    this.battleLink = page.locator('a[href="/battle"], a:has-text("Battle"), a:has-text("对战")');
    this.navMenu = page.locator('nav, .nav, .navigation, header nav');
    this.homeLink = page.locator('a:has-text("首页"), a:has-text("Home"), a[href="/"]');
    this.userMenu = page.locator('.user-menu, .profile-menu, [data-testid="user-menu"]');
    this.logoutButton = page.locator('button:has-text("退出"), button:has-text("登出"), button:has-text("Logout"), button:has-text("Sign Out")');
  }

  async clickStartExperience() {
    await this.startButton.click();
  }

  async navigateToLogin() {
    await this.loginButton.click();
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
    this.welcomeMessage = page.locator('h2:has-text("Welcome Back"), text=Welcome Back, .gradient-text, text=Profile, text=Dashboard');
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
    this.newEvaluationButton = page.locator('button:has-text("新建评测"), button:has-text("开始评测"), button:has-text("New Evaluation"), button:has-text("Start Evaluation"), button:has-text("Create"), .ios-button:has-text("New"), .ios-button:has-text("Start")');
    this.modelSelect = page.locator('select[name="model"], #model-select, select:has-option, .model-selector, .ios-select');
    this.taskTypeSelect = page.locator('select[name="taskType"], #task-type-select, select:has(option[value*="type"]), .task-type-selector');
    this.promptTextarea = page.locator('textarea[name="prompt"], textarea[placeholder*="输入"], textarea[placeholder*="Enter"], textarea[placeholder*="Type"], .prompt-input');
    this.submitButton = page.locator('button:has-text("提交"), button:has-text("开始"), button:has-text("Submit"), button:has-text("Start"), button[type="submit"], .ios-button[type="submit"]');
    this.progressBar = page.locator('.progress-bar, [role="progressbar"], .progress, .ios-progress, .evaluation-progress');
    this.resultContainer = page.locator('.evaluation-result, .result-container, .results, .output, .evaluation-output');
    this.evaluationForm = page.locator('form, .evaluation-form, .create-evaluation');
    this.historyList = page.locator('.history, .evaluation-history, .past-evaluations');
    this.usageLimit = page.locator('text=/剩余.*次/, text=/remaining/i, .usage-limit, .daily-limit');
    this.cancelButton = page.locator('button:has-text("取消"), button:has-text("Cancel"), .cancel-btn');
  }

  async createEvaluation(modelId: string, taskType: string, prompt: string) {
    await this.newEvaluationButton.click();
    await this.modelSelect.selectOption(modelId);
    await this.taskTypeSelect.selectOption(taskType);
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
    // Updated to match actual BattlePage.tsx implementation
    this.model1Container = page.locator('.grid.grid-cols-1.gap-6.lg\\:grid-cols-2 > :first-child, [class*="border-2 rounded-xl p-6"]:first-of-type');
    this.model2Container = page.locator('.grid.grid-cols-1.gap-6.lg\\:grid-cols-2 > :last-child, [class*="border-2 rounded-xl p-6"]:last-of-type');
    this.voteButton1 = page.locator('button:has-text("Vote for Model A"), .ios-button:has-text("Vote for Model A")');
    this.voteButton2 = page.locator('button:has-text("Vote for Model B"), .ios-button:has-text("Vote for Model B")');
    this.skipButton = page.locator('button:has-text("Skip"), button:has-text("Next"), .ios-button:has-text("Refresh Battle")');
    this.resultMessage = page.locator('text=/Vote Rate/, text=/votes/, .text-center:has-text("votes")');
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
    const model1Name = await this.model1Container.locator('h3:has-text("Model A"), h3:has-text("Model")')?.textContent() || 'Model A';
    const model2Name = await this.model2Container.locator('h3:has-text("Model B"), h3:has-text("Model")')?.textContent() || 'Model B';
    return { model1: model1Name, model2: model2Name };
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