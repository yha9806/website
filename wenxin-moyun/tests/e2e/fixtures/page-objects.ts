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

  constructor(page: Page) {
    super(page);
    // Updated for English iOS interface
    this.heroTitle = page.locator('h1:has-text("WenXin MoYun"), h1:has-text("AI Art Evaluation"), h1:has-text("文心墨韵")');
    this.startButton = page.locator('button:has-text("Explore Rankings"), button:has-text("Get Started"), button:has-text("开始体验")');
    this.loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("登录")');
    this.leaderboardLink = page.locator('a[href="/leaderboard"]');
    this.battleLink = page.locator('a[href="/battle"]');
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

  constructor(page: Page) {
    super(page);
    // Updated for English interface
    this.usernameInput = page.locator('input[name="username"], input[placeholder*="Username"], input[placeholder*="用户名"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("登录")');
    this.errorMessage = page.locator('.error-message, .text-red-500');
    this.guestModeButton = page.locator('button:has-text("Guest"), button:has-text("Continue as Guest"), button:has-text("访客模式"), button:has-text("游客")');
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

  constructor(page: Page) {
    super(page);
    this.newEvaluationButton = page.locator('button:has-text("新建评测"), button:has-text("开始评测")');
    this.modelSelect = page.locator('select[name="model"], #model-select');
    this.taskTypeSelect = page.locator('select[name="taskType"], #task-type-select');
    this.promptTextarea = page.locator('textarea[name="prompt"], textarea[placeholder*="输入"]');
    this.submitButton = page.locator('button:has-text("提交"), button:has-text("开始")');
    this.progressBar = page.locator('.progress-bar, [role="progressbar"]');
    this.resultContainer = page.locator('.evaluation-result, .result-container');
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

  constructor(page: Page) {
    super(page);
    this.model1Container = page.locator('.battle-model-1, [data-testid="model-1"]');
    this.model2Container = page.locator('.battle-model-2, [data-testid="model-2"]');
    this.voteButton1 = page.locator('button:has-text("投票"):first, button[data-model="1"]');
    this.voteButton2 = page.locator('button:has-text("投票"):last, button[data-model="2"]');
    this.skipButton = page.locator('button:has-text("跳过"), button:has-text("下一个")');
    this.resultMessage = page.locator('.vote-result, .success-message');
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
    const model1Name = await this.model1Container.locator('h3, .model-name').textContent();
    const model2Name = await this.model2Container.locator('h3, .model-name').textContent();
    return { model1: model1Name, model2: model2Name };
  }
}

export class LeaderboardPage extends BasePage {
  readonly categoryTabs: Locator;
  readonly rankingTable: Locator;
  readonly searchInput: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.categoryTabs = page.locator('.category-tabs, [role="tablist"]');
    this.rankingTable = page.locator('table, .ranking-table');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="搜索"]');
    this.sortSelect = page.locator('select[name="sort"], #sort-select');
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