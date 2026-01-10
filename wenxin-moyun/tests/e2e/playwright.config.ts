import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 使用CI环境配置作为标准
  globalSetup: './global-setup.ts',
  testDir: './specs',
  fullyParallel: false,  // CI标准：禁用并行以确保稳定性
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // CI标准：增加重试次数
  workers: 1,  // CI标准：单worker确保稳定性
  timeout: 60000,  // 增加到60秒以提高稳定性
  expect: {
    timeout: 15000,  // 增加断言超时时间到15秒
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',  // CI标准：失败时保留追踪
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,  // 适度增加操作超时
    navigationTimeout: 30000,  // 适度增加导航超时
  },

  // 本地开发也使用CI标准配置（仅chromium）
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    }
  ],

  // Frontend server only configuration (backend optional)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,  // Always reuse to avoid conflicts
    timeout: 120 * 1000,  // 2 minutes timeout
    stdout: 'pipe',
    stderr: 'pipe',
  },
});