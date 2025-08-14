import { defineConfig, devices } from '@playwright/test';

/**
 * MCP-Enhanced Playwright Configuration
 * Optimized for Claude Code MCP integration
 */
export default defineConfig({
  testDir: '../specs',
  fullyParallel: process.env.CI ? false : true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Increased retries for MCP stability
  workers: process.env.CI ? 1 : undefined,
  timeout: 45000, // Increased timeout for MCP operations
  
  // Enhanced reporting for MCP
  reporter: [
    ['html', { outputFolder: '../playwright-report', open: 'never' }],
    ['line'],
    ['json', { outputFile: '../test-results.json' }],
    ['junit', { outputFile: '../test-results.xml' }],
    // MCP-specific reporter  
    ['./mcp-reporter.ts']
  ],
  
  use: {
    // Dynamic baseURL from environment (set by MCP runner)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000, // Increased for MCP operations
    navigationTimeout: 45000, // Increased for MCP navigation
    
    // MCP-specific settings
    extraHTTPHeaders: {
      'X-MCP-Test': 'true',
      'X-Test-Runner': 'playwright-mcp'
    }
  },

  projects: process.env.CI ? [
    // CI: Only chromium for speed
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    }
  ] : [
    // Development: Full browser matrix
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 }
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
    },
  ],

  // MCP-managed webServer (disabled here, managed by MCP runner)
  // webServer: undefined,

  // Global setup for MCP integration
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
});