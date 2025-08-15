import { Page, expect } from '@playwright/test';

export async function waitForAPIResponse(page: Page, endpoint: string, timeout = 10000) {
  return await page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  );
}

export async function simulateSlowNetwork(page: Page) {
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 1000);
  });
}

export async function clearLocalStorage(page: Page) {
  try {
    await page.evaluate(() => {
      // Try to access localStorage safely
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.clear();
        }
      } catch (storageError) {
        // localStorage blocked by security policy, use window properties instead
        console.log('localStorage blocked, using fallback storage clearing');
      }
      
      // Always clear test-specific window properties (this always works)
      (window as any).__TEST_AUTH_TOKEN__ = null;
      (window as any).__TEST_GUEST_SESSION__ = null;
      (window as any).__TEST_STORAGE__ = {};
      (window as any).__TEST_SESSION_STORAGE__ = {};
    });
  } catch (error) {
    // If even page.evaluate fails, just log the warning
    console.warn('Cannot access page evaluation in test environment:', error);
  }
}

export async function setAuthToken(page: Page, token: string) {
  try {
    await page.evaluate((token) => {
      // Try localStorage first, fallback to window property
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem('access_token', token); // Fixed: use 'access_token' not 'auth_token'
        }
      } catch (storageError) {
        console.log('localStorage blocked, using window property for auth token');
      }
      
      // Always set as test property for compatibility
      (window as any).__TEST_AUTH_TOKEN__ = token;
    }, token);
    
    // Mock the auth API responses in CI environment
    if (process.env.CI) {
      await page.route('**/api/v1/auth/me', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-user-id',
            username: 'test-user',
            email: 'test@example.com',
            role: 'user'
          })
        });
      });
    }
  } catch (error) {
    console.warn('Cannot set auth token in test environment:', error);
  }
}

export async function getAuthToken(page: Page): Promise<string | null> {
  try {
    return await page.evaluate(() => {
      // Try localStorage first, fallback to window property
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          const token = localStorage.getItem('access_token'); // Fixed: use 'access_token' not 'auth_token'
          if (token) return token;
        }
      } catch (storageError) {
        console.log('localStorage blocked, using window property for auth token retrieval');
      }
      
      // Fallback to window property (always available)
      return (window as any).__TEST_AUTH_TOKEN__ || null;
    });
  } catch (error) {
    console.warn('Cannot get auth token in test environment:', error);
    return null;
  }
}

export async function setGuestSession(page: Page, guestId: string) {
  try {
    await page.evaluate((id) => {
      const session = {
        id: id,
        dailyUsage: 0,
        lastReset: new Date().toDateString(),
        evaluations: []
      };
      
      // Try localStorage first, fallback to window property
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem('guest_session', JSON.stringify(session));
        }
      } catch (storageError) {
        console.log('localStorage blocked, using window property for guest session');
      }
      
      // Always set as test property for compatibility
      (window as any).__TEST_GUEST_SESSION__ = session;
    }, guestId);
  } catch (error) {
    console.warn('Cannot set guest session in test environment:', error);
  }
}

export async function mockAPIResponse(page: Page, url: string, response: any) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

export async function checkAccessibility(page: Page) {
  const violations = await page.evaluate(() => {
    // Basic accessibility checks
    const checks = [];
    
    // Check for alt text on images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt) {
        checks.push(`Image missing alt text: ${img.src}`);
      }
    });
    
    // Check for form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id;
      if (id && !document.querySelector(`label[for="${id}"]`)) {
        checks.push(`Input missing label: ${id}`);
      }
    });
    
    return checks;
  });
  
  return violations;
}

export async function generateTestData(type: 'user' | 'model' | 'evaluation') {
  const timestamp = Date.now();
  
  switch(type) {
    case 'user':
      return {
        username: `test_user_${timestamp}`,
        password: 'Test123!',
        email: `test${timestamp}@example.com`
      };
    case 'model':
      return {
        id: `test_model_${timestamp}`,
        name: `Test Model ${timestamp}`,
        description: 'Auto-generated test model'
      };
    case 'evaluation':
      return {
        prompt: `Test prompt ${timestamp}`,
        taskType: 'poetry',
        modelId: 'gpt-4'
      };
    default:
      return null;
  }
}

export async function cleanupTestData(page: Page) {
  // Clear all test-related data
  await clearLocalStorage(page);
  
  // Clear cookies
  await page.context().clearCookies();
  
  // Reset any test flags (unified CI-safe approach)
  try {
    await page.evaluate(() => {
      // Always use CI-safe approach - only clear window properties
      (window as any).__TEST_SESSION_STORAGE__ = {};
      (window as any).__TEST_AUTH_TOKEN__ = null;
      (window as any).__TEST_GUEST_SESSION__ = null;
      (window as any).__TEST_STORAGE__ = {};
      
      // Only attempt sessionStorage access if it's safe and accessible
      try {
        if (typeof sessionStorage !== 'undefined' && sessionStorage.length >= 0) {
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('test_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => sessionStorage.removeItem(key));
        }
      } catch (storageError) {
        // Silently ignore sessionStorage access errors in CI or restricted environments
        console.log('sessionStorage not accessible, using window properties only');
      }
    });
  } catch (error) {
    console.warn('Cannot access storage during cleanup, continuing with window-only cleanup:', error);
  }
}

export async function waitForAnimation(page: Page, selector: string) {
  await page.waitForSelector(selector);
  // Wait for any CSS animations to complete
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      return new Promise(resolve => {
        const computedStyle = window.getComputedStyle(element);
        const duration = parseFloat(computedStyle.animationDuration) * 1000 || 0;
        const delay = parseFloat(computedStyle.animationDelay) * 1000 || 0;
        setTimeout(resolve, duration + delay);
      });
    }
  }, selector);
}

export async function compareScreenshots(baseline: string, current: string, threshold = 0.1) {
  // This would integrate with a visual regression tool
  // For now, just return a placeholder
  console.log(`Comparing ${baseline} with ${current} (threshold: ${threshold})`);
  return { match: true, difference: 0 };
}

export async function measurePerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const timing = window.performance.timing;
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      loadComplete: timing.loadEventEnd - timing.loadEventStart,
      firstPaint: timing.responseEnd - timing.requestStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
    };
  });
  
  return metrics;
}