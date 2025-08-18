import { Page, expect } from '@playwright/test';
import { withRoute, urlMatcher } from '../../../src/test-utils/route';

export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a route with proper hash/browser handling
   */
  async navigateTo(path: string) {
    await this.page.goto(withRoute(path));
    await this.page.waitForURL(urlMatcher(path), { timeout: 10000 });
  }

  /**
   * Assert current URL matches expected path
   */
  async assertCurrentPath(path: string) {
    await expect(this.page).toHaveURL(urlMatcher(path));
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(path: string) {
    await this.page.waitForURL(urlMatcher(path), { timeout: 10000 });
  }
}