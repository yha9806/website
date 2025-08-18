import { defineConfig, devices } from '@playwright/test';

// Simplified CI configuration for basic tests only
export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './specs',
  
  // Only run basic tests, skip auth and battle
  testMatch: [
    '**/homepage.spec.ts',
    '**/ai-models.spec.ts',
    '**/ios-components.spec.ts',
    '**/evaluation.spec.ts',
    '**/performance.spec.ts'
  ],
  
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,  // Reduce retries for faster feedback
  workers: 1,
  timeout: 30000,  // 30 seconds timeout
  
  expect: {
    timeout: 10000,
  },
  
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',  // Disable video for speed
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120 * 1000,  // 2 minutes
    stdout: 'pipe',
    stderr: 'pipe',
  },
});