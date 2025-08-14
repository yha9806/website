import { spawn, ChildProcess } from 'child_process';
import { Page } from '@playwright/test';

/**
 * MCP-Enhanced Playwright Test Runner
 * Provides advanced test orchestration and monitoring capabilities
 */
export class MCPTestRunner {
  private devServer: ChildProcess | null = null;
  private basePort = 5173;
  private currentPort: number | null = null;

  constructor() {
    // Initialize MCP integration
  }

  /**
   * Start development server with port detection
   */
  async startDevServer(): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting development server...');
      
      this.devServer = spawn('npm', ['run', 'dev'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: process.cwd()
      });

      let output = '';
      
      this.devServer.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        console.log('📝 Dev server output:', chunk.trim());
        
        // Detect port from Vite output - more flexible matching
        const portMatch = chunk.match(/(?:Local|localhost):\s*http:\/\/localhost:(\d+)/i) || 
                         chunk.match(/ready.*(\d+)/i);
        if (portMatch && !this.currentPort) {
          this.currentPort = parseInt(portMatch[1]);
          const baseURL = `http://localhost:${this.currentPort}`;
          console.log(`✅ Dev server ready at ${baseURL}`);
          resolve(baseURL);
        }
      });

      this.devServer.stderr?.on('data', (data) => {
        console.error('Dev server error:', data.toString());
      });

      this.devServer.on('error', (error) => {
        console.error('Failed to start dev server:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.currentPort) {
          reject(new Error('Dev server failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }

  /**
   * Stop development server
   */
  async stopDevServer(): Promise<void> {
    if (this.devServer) {
      console.log('🛑 Stopping development server...');
      this.devServer.kill('SIGTERM');
      this.devServer = null;
      this.currentPort = null;
    }
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer(baseURL: string, maxAttempts = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(baseURL);
        if (response.ok) {
          console.log(`✅ Server is ready at ${baseURL}`);
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.error('❌ Server failed to become ready');
    return false;
  }

  /**
   * Enhanced page setup with MCP capabilities
   */
  async setupPage(page: Page, baseURL: string): Promise<void> {
    // Set base URL globally
    process.env.PLAYWRIGHT_BASE_URL = baseURL;
    
    // Add MCP-specific page enhancements
    await page.addInitScript(() => {
      // Add test markers for MCP detection
      (window as any).__MCP_TEST_MODE__ = true;
      (window as any).__MCP_START_TIME__ = Date.now();
    });

    // Add network monitoring
    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.warn(`⚠️  HTTP ${response.status()}: ${response.url()}`);
      }
    });

    // Add console monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`🐞 Browser Error: ${msg.text()}`);
      }
    });
  }

  /**
   * Run tests with MCP enhancements
   */
  async runTests(testPattern?: string): Promise<boolean> {
    try {
      const baseURL = await this.startDevServer();
      
      if (!await this.waitForServer(baseURL)) {
        throw new Error('Server failed to start');
      }

      // Set environment variable for tests
      process.env.PLAYWRIGHT_BASE_URL = baseURL;

      // Run Playwright tests
      console.log('🧪 Running Playwright tests with MCP integration...');
      
      const testCommand = testPattern 
        ? `npx playwright test ${testPattern} --reporter=line`
        : 'npx playwright test --reporter=line';

      const testProcess = spawn(testCommand, {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL }
      });

      return new Promise((resolve) => {
        testProcess.on('close', (code) => {
          console.log(`🏁 Tests completed with exit code: ${code}`);
          resolve(code === 0);
        });
      });

    } catch (error) {
      console.error('❌ MCP Test Runner Error:', error);
      return false;
    } finally {
      await this.stopDevServer();
    }
  }

  /**
   * Get current server information
   */
  getServerInfo() {
    return {
      port: this.currentPort,
      baseURL: this.currentPort ? `http://localhost:${this.currentPort}` : null,
      isRunning: this.devServer !== null
    };
  }
}

// Export singleton instance
export const mcpTestRunner = new MCPTestRunner();