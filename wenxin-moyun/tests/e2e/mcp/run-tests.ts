#!/usr/bin/env node

/**
 * MCP-Enhanced Test Runner Script
 * Provides intelligent test execution with server management
 */

import { mcpTestRunner } from './mcp-test-runner';

async function main() {
  const args = process.argv.slice(2);
  const testPattern = args.length > 0 ? args.join(' ') : undefined;

  console.log('🎭 MCP-Enhanced Playwright Test Runner');
  console.log('=====================================');
  
  if (testPattern) {
    console.log(`📋 Test Pattern: ${testPattern}`);
  } else {
    console.log('📋 Running all tests');
  }
  
  console.log('');

  try {
    const success = await mcpTestRunner.runTests(testPattern);
    
    if (success) {
      console.log('');
      console.log('🎉 All tests passed! MCP integration successful.');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ Some tests failed. Check output above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Handle process cleanup
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal, cleaning up...');
  await mcpTestRunner.stopDevServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received terminate signal, cleaning up...');
  await mcpTestRunner.stopDevServer();
  process.exit(0);
});

main().catch(console.error);