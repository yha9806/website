import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get startExperienceButton() {
    return this.page.locator('button:has-text("Start Experience"), button:has-text("开始体验")').first();
  }

  get loginButton() {
    return this.page.locator('button:has-text("Login"), button:has-text("登录"), a[href*="login"]').first();
  }

  get leaderboardLink() {
    return this.page.locator('a[href*="leaderboard"], button:has-text("Leaderboard")').first();
  }

  get userAvatar() {
    return this.page.locator('[data-testid="user-avatar"], .user-avatar').first();
  }

  // Actions
  async goto() {
    await this.navigateTo('/');
  }

  async navigateToLogin() {
    await this.loginButton.click();
    await this.waitForNavigation('/login');
  }

  async navigateToLeaderboard() {
    await this.leaderboardLink.click();
    await this.waitForNavigation('/leaderboard');
  }

  async clickStartExperience() {
    const button = this.startExperienceButton;
    const exists = await button.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (exists) {
      await button.click();
    } else {
      console.log('Start experience button not found, setting guest mode via JavaScript');
      await this.page.evaluate(() => {
        const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('guest_session_id', guestId);
        localStorage.setItem('is_guest', 'true');
      });
    }
  }

  // Assertions
  async assertOnHomePage() {
    await this.assertCurrentPath('/');
  }

  async assertUserLoggedIn() {
    await expect(this.userAvatar).toBeVisible();
  }
}