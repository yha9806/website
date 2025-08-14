import { FullConfig } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * MCP Global Setup
 * Prepares the test environment for MCP-enhanced testing
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 MCP Global Setup');
  console.log('==================');

  // Ensure test-results directory exists
  const testResultsDir = join(process.cwd(), 'test-results');
  if (!existsSync(testResultsDir)) {
    mkdirSync(testResultsDir, { recursive: true });
    console.log('📁 Created test-results directory');
  }

  // Log MCP configuration
  console.log(`🌐 Base URL: ${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'}`);
  console.log(`🔄 CI Mode: ${process.env.CI ? 'Yes' : 'No'}`);
  console.log(`👥 Workers: ${config.workers}`);
  console.log(`🔁 Retries: ${config.retries}`);
  
  // MCP-specific setup
  console.log('🎭 MCP Features:');
  console.log('   • Dynamic port detection');
  console.log('   • Enhanced error reporting');
  console.log('   • iOS component testing');
  console.log('   • Performance monitoring');
  
  console.log('✅ MCP Global Setup Complete');
  console.log('');
}

export default globalSetup;