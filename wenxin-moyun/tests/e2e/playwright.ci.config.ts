import { defineConfig, devices } from '@playwright/test';

// CI-specific Playwright configuration
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,  // Disable parallel for CI stability
  forbidOnly: true,
  retries: 1,
  workers: 1,
  timeout: 30000,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
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
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});