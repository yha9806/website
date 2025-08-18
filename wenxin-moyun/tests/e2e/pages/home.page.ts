import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  get exploreRankingsButton() {
    return this.page.locator('[data-testid="explore-rankings-button"]').first();
  }

  get modelBattleButton() {
    return this.page.locator('[data-testid="model-battle-button"]').first();
  }

  get leaderboardLink() {
    return this.page.locator('a[href*="leaderboard"], [data-testid="explore-rankings-button"]').first();
  }

  get userAvatar() {
    return this.page.locator('[data-testid="user-avatar"], .user-avatar').first();
  }

  // Actions
  async goto() {
    await this.navigateTo('/');
  }

  async navigateToLogin() {
    // Since there's no login button on homepage, navigate directly to login page
    await this.navigateTo('/login');
  }

  async navigateToLeaderboard() {
    await this.leaderboardLink.click();
    await this.waitForNavigation('/leaderboard');
  }

  async clickExploreRankings() {
    await this.exploreRankingsButton.click();
    await this.waitForNavigation('/leaderboard');
  }

  async clickModelBattle() {
    await this.modelBattleButton.click();
    await this.waitForNavigation('/battle');
  }

  async setGuestMode() {
    // Set guest mode directly via JavaScript since there's no guest button
    await this.page.evaluate(() => {
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_session_id', guestId);
      localStorage.setItem('is_guest', 'true');
    });
  }

  // Assertions
  async assertOnHomePage() {
    await this.assertCurrentPath('/');
  }

  async assertUserLoggedIn() {
    await expect(this.userAvatar).toBeVisible();
  }
}