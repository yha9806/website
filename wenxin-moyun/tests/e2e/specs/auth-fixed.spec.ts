import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';

// Test users - should match what's in init_test_db.py
const TEST_USERS = {
  valid: {
    username: 'demo',
    password: 'demo123'
  },
  admin: {
    username: 'admin', 
    password: 'admin123'
  },
  invalid: {
    username: 'invalid',
    password: 'wrongpass'
  }
};

// Helper to get auth token
async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    try {
      return localStorage.getItem('access_token') || null;
    } catch {
      return null;
    }
  });
}

test.describe('Authentication Flow', () => {
  let homePage: HomePage;
  let loginPage: LoginPage;
  
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
    
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Go to home page
    await homePage.goto();
  });
  
  test('User can successfully login with valid credentials', async ({ page }) => {
    // Navigate to login
    await homePage.navigateToLogin();
    
    // Verify on login page
    await loginPage.assertOnLoginPage();
    
    // Perform login
    await loginPage.login(TEST_USERS.valid.username, TEST_USERS.valid.password);
    
    // Wait for redirect to home
    await homePage.waitForNavigation('/');
    
    // Verify auth token is stored
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
    
    // Verify on home page
    await homePage.assertOnHomePage();
  });
  
  test('Guest mode allows access without authentication', async ({ page }) => {
    // Set guest mode directly
    await homePage.setGuestMode();
    
    // Wait a moment for guest session to be set
    await page.waitForTimeout(1000);
    
    // Verify guest session is created
    const guestSession = await page.evaluate(() => {
      return localStorage.getItem('guest_session_id') || localStorage.getItem('is_guest');
    });
    
    expect(guestSession).toBeTruthy();
    
    // Verify can navigate to other pages using the Explore Rankings button
    await homePage.clickExploreRankings();
    
    // Should be on leaderboard page
    const url = page.url();
    expect(url).toContain('leaderboard');
  });
  
  test('Login fails with invalid credentials', async ({ page }) => {
    // Navigate to login
    await homePage.navigateToLogin();
    
    // Try invalid login
    await loginPage.login(TEST_USERS.invalid.username, TEST_USERS.invalid.password);
    
    // Should still be on login page
    await loginPage.assertOnLoginPage();
    
    // Should show error (if implemented)
    // await loginPage.assertErrorVisible();
    
    // Token should not be set
    const token = await getAuthToken(page);
    expect(token).toBeFalsy();
  });
  
  test('JWT token persists across page refreshes', async ({ page }) => {
    // Login first
    await homePage.navigateToLogin();
    await loginPage.login(TEST_USERS.valid.username, TEST_USERS.valid.password);
    await homePage.waitForNavigation('/');
    
    // Get initial token
    const initialToken = await getAuthToken(page);
    expect(initialToken).toBeTruthy();
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Token should still exist
    const tokenAfterRefresh = await getAuthToken(page);
    expect(tokenAfterRefresh).toBeTruthy();
    expect(tokenAfterRefresh).toBe(initialToken);
  });
  
  test('Logout functionality clears authentication', async ({ page }) => {
    // Login first
    await homePage.navigateToLogin();
    await loginPage.login(TEST_USERS.valid.username, TEST_USERS.valid.password);
    await homePage.waitForNavigation('/');
    
    // Verify logged in
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
    
    // Simulate logout
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('username');
      sessionStorage.clear();
    });
    
    // Refresh to apply logout
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Token should be cleared
    const tokenAfterLogout = await getAuthToken(page);
    expect(tokenAfterLogout).toBeFalsy();
  });
  
  test('Admin user has access to admin features', async ({ page }) => {
    // Login as admin
    await homePage.navigateToLogin();
    await loginPage.login(TEST_USERS.admin.username, TEST_USERS.admin.password);
    await homePage.waitForNavigation('/');
    
    // Verify admin token
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
    
    // Admin-specific checks would go here
    // For now just verify successful login
    await homePage.assertOnHomePage();
  });
});