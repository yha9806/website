import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get usernameInput() {
    return this.page.locator('input[name="username"], input[placeholder*="username" i]').first();
  }

  get passwordInput() {
    return this.page.locator('input[name="password"], input[type="password"]').first();
  }

  get submitButton() {
    return this.page.locator('button[type="submit"], button:has-text("Login"), button:has-text("登录")').first();
  }

  get loginForm() {
    return this.page.locator('form').first();
  }

  get errorMessage() {
    return this.page.locator('.error-message, [role="alert"]').first();
  }

  // Actions
  async goto() {
    await this.navigateTo('/login');
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  // Assertions
  async assertOnLoginPage() {
    await this.assertCurrentPath('/login');
    await expect(this.loginForm).toBeVisible();
  }

  async assertErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }
}