import { defineConfig, devices } from '@playwright/test';

// CI-specific Playwright configuration
export default defineConfig({
  // 全局设置，在每个测试前执行
  globalSetup: './global-setup.ts',
  testDir: './specs',
  fullyParallel: false,  // Disable parallel for CI stability
  forbidOnly: true,
  retries: 2,  // Increase retries for CI stability
  workers: 1,
  timeout: 45000,  // Increase timeout for CI environment
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000,  // Increase action timeout for CI
    navigationTimeout: 45000,  // Increase navigation timeout for CI
  },

  // Only chromium for CI speed
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    }
  ],

  // Let Playwright manage the server in CI
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,  // Always start fresh in CI
    timeout: 180 * 1000,  // Increase webServer timeout to 3 minutes
    stdout: 'pipe',
    stderr: 'pipe',
  },
});