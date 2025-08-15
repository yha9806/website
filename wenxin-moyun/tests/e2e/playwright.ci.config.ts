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
  timeout: 60000,  // Increase timeout to 60 seconds for CI stability
  expect: {
    timeout: 15000,  // Increase expect timeout to 15 seconds
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,  // Increase action timeout to 30 seconds for CI
    navigationTimeout: 60000,  // Increase navigation timeout to 60 seconds for CI
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