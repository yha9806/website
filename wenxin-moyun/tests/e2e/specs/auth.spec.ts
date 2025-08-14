import { test, expect } from '@playwright/test';
import { LoginPage, HomePage } from '../fixtures/page-objects';
import { TEST_USERS, TEST_URLS } from '../fixtures/test-data';
import { 
  clearLocalStorage, 
  getAuthToken, 
  setGuestSession,
  cleanupTestData 
} from '../helpers/test-utils';

test.describe('Authentication Flow', () => {
  let homePage: HomePage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loginPage = new LoginPage(page);
    
    // Mock authentication API endpoints
    await page.route('**/api/v1/auth/login', route => {
      const postData = route.request().postData();
      const params = new URLSearchParams(postData || '');
      const username = params.get('username');
      const password = params.get('password');
      
      // Check credentials
      if ((username === 'demo' && password === 'demo123') || 
          (username === 'admin' && password === 'admin123')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: `mock-jwt-token-${Date.now()}`,
            token_type: 'bearer'
          })
        });
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Invalid username or password'
          })
        });
      }
    });
    
    // Mock user profile endpoint
    await page.route('**/api/v1/auth/me', route => {
      const authHeader = route.request().headers()['authorization'];
      if (authHeader && authHeader.startsWith('Bearer mock-jwt-token')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-user-id',
            username: 'demo',
            email: 'demo@example.com',
            full_name: 'Demo User',
            is_active: true,
            is_superuser: false,
            created_at: new Date().toISOString()
          })
        });
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Could not validate credentials'
          })
        });
      }
    });
    
    await clearLocalStorage(page);
    await page.goto('/');
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page);
  });

  test('User can successfully login with valid credentials', async ({ page }) => {
    // Navigate to login
    await homePage.navigateToLogin();
    
    // Perform login
    await loginPage.login(TEST_USERS.valid.username, TEST_USERS.valid.password);
    
    // Wait for redirect after successful login
    await page.waitForURL('/', { timeout: 5000 });
    
    // Verify auth token is stored
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
    
    // Verify user is logged in (look for user menu or welcome message)
    await expect(loginPage.welcomeMessage).toBeVisible({ timeout: 5000 });
  });

  test('Guest mode allows access without authentication', async ({ page }) => {
    // Click start experience button (should trigger guest mode)
    await homePage.clickStartExperience();
    
    // Verify guest session is created
    const guestSession = await page.evaluate(() => {
      // Try localStorage first, fallback to window property
      try {
        const stored = localStorage?.getItem('guest_session');
        if (stored) return stored;
      } catch (error) {
        console.log('localStorage blocked, checking window properties');
      }
      
      // Fallback to test properties
      const session = (window as any).__TEST_GUEST_SESSION__;
      return session ? JSON.stringify(session) : null;
    });
    expect(guestSession).toBeTruthy();
    
    // Parse and verify guest session structure
    const session = JSON.parse(guestSession!);
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('dailyUsage');
    expect(session.dailyUsage).toBe(0);
    
    // Verify can access evaluation page as guest
    await page.goto('/evaluations');
    await expect(page).toHaveURL('/evaluations');
  });

  test('Login fails with invalid credentials', async ({ page }) => {
    // Navigate to login
    await homePage.navigateToLogin();
    
    // Attempt login with invalid credentials
    await loginPage.login(TEST_USERS.invalid.username, TEST_USERS.invalid.password);
    
    // Wait for error message
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify error message content
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toMatch(/(用户名或密码错误|Invalid username|Invalid password|Login failed|Authentication failed)/i);
    
    // Verify still on login page
    await expect(page).toHaveURL(/login/);
    
    // Verify no auth token stored
    const token = await getAuthToken(page);
    expect(token).toBeFalsy();
  });

  test('JWT token persists across page refreshes', async ({ page }) => {
    // Login first
    await homePage.navigateToLogin();
    await loginPage.login(TEST_USERS.valid.username, TEST_USERS.valid.password);
    await page.waitForURL('/');
    
    // Get initial token
    const initialToken = await getAuthToken(page);
    expect(initialToken).toBeTruthy();
    
    // Refresh page
    await page.reload();
    
    // Verify token still exists
    const tokenAfterRefresh = await getAuthToken(page);
    expect(tokenAfterRefresh).toBe(initialToken);
    
    // Verify user still logged in
    await expect(loginPage.welcomeMessage).toBeVisible();
  });

  test('Logout functionality clears authentication', async ({ page }) => {
    // Login first
    await homePage.navigateToLogin();
    await loginPage.login(TEST_USERS.valid.username, TEST_USERS.valid.password);
    await page.waitForURL('/');
    
    // Verify logged in
    const token = await getAuthToken(page);
    expect(token).toBeTruthy();
    
    // Find and click logout button
    await homePage.logoutButton.click();
    
    // Verify token is cleared
    const tokenAfterLogout = await getAuthToken(page);
    expect(tokenAfterLogout).toBeFalsy();
    
    // Verify redirected to home or login page
    await expect(page).toHaveURL(/(\/$|\/login)/);
    
    // Verify login button is visible again
    await expect(homePage.loginButton).toBeVisible();
  });

  test('Admin user has access to admin features', async ({ page }) => {
    // Login as admin
    await homePage.navigateToLogin();
    await loginPage.login(TEST_USERS.admin.username, TEST_USERS.admin.password);
    await page.waitForURL('/');
    
    // Look for admin-specific elements
    const adminMenu = page.locator('[data-testid="admin-menu"]')
      .or(page.locator('.admin-menu'))
      .or(page.locator('text=管理'))
      .or(page.locator('text=Admin'))
      .or(page.locator('text=Management'))
      .or(page.locator('.admin-panel'))
      .or(page.locator('.admin-section'));
    
    // Admin menu should be visible
    await expect(adminMenu).toBeVisible({ timeout: 5000 });
  });

  test('Guest session respects daily usage limits', async ({ page }) => {
    // Set up a guest session with usage near limit
    await setGuestSession(page, 'test-guest-limit');
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
        session.dailyUsage = 2; // One away from limit of 3
        
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
    
    // Navigate to evaluations
    await page.goto('/evaluations');
    
    // Should show remaining usage
    const usageIndicator = page.locator('text=/剩余.*次/')
      .or(page.locator('text=/remaining/i'));
    await expect(usageIndicator).toBeVisible();
    
    // Verify shows correct remaining count
    const usageText = await usageIndicator.textContent();
    expect(usageText).toContain('1');
  });
});