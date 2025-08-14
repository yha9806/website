import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

/**
 * MCP-Enhanced Test Reporter
 * Provides detailed reporting optimized for Claude Code MCP integration
 */
class MCPReporter implements Reporter {
  private startTime: number = 0;
  private testResults: Array<{
    test: TestCase;
    result: TestResult;
    status: 'passed' | 'failed' | 'skipped';
  }> = [];

  onBegin() {
    this.startTime = Date.now();
    console.log('');
    console.log('🎭 MCP Enhanced Playwright Reporter');
    console.log('===================================');
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`🔧 MCP Integration: Active`);
    console.log(`🌐 Base URL: ${process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'}`);
    console.log('');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const status = result.status as 'passed' | 'failed' | 'skipped';
    this.testResults.push({ test, result, status });

    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
    const duration = `${result.duration}ms`;
    
    console.log(`${emoji} ${test.title} (${duration})`);

    if (status === 'failed') {
      console.log(`   📍 Error: ${result.error?.message || 'Unknown error'}`);
      if (result.attachments.length > 0) {
        console.log(`   📎 Attachments: ${result.attachments.length} files`);
      }
    }
  }

  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;
    const total = this.testResults.length;

    console.log('');
    console.log('📊 MCP Test Summary');
    console.log('==================');
    console.log(`⏱️  Total time: ${Math.round(duration / 1000)}s`);
    console.log(`📈 Total tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Success rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);

    // MCP-specific analysis
    this.generateMCPAnalysis(result);

    console.log('');
    console.log(`🎯 MCP Status: ${failed === 0 ? 'SUCCESS' : 'NEEDS_ATTENTION'}`);
    
    // Generate MCP-compatible output
    this.generateMCPOutput();
  }

  private generateMCPAnalysis(result: FullResult) {
    console.log('');
    console.log('🔍 MCP Analysis');
    console.log('==============');

    // Analyze test patterns
    const failedTests = this.testResults.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      console.log('❌ Failed Test Patterns:');
      const patterns = new Map<string, number>();
      
      failedTests.forEach(({ test }) => {
        const suite = test.parent.title;
        patterns.set(suite, (patterns.get(suite) || 0) + 1);
      });

      patterns.forEach((count, suite) => {
        console.log(`   • ${suite}: ${count} failures`);
      });
    }

    // Performance analysis
    const slowTests = this.testResults
      .filter(r => r.result.duration > 10000)
      .sort((a, b) => b.result.duration - a.result.duration);

    if (slowTests.length > 0) {
      console.log('⏱️  Performance Insights:');
      slowTests.slice(0, 3).forEach(({ test, result }) => {
        console.log(`   • ${test.title}: ${result.duration}ms`);
      });
    }

    // iOS Component specific analysis
    const iosTests = this.testResults.filter(r => 
      r.test.title.includes('iOS') || r.test.parent.title.includes('iOS')
    );
    
    if (iosTests.length > 0) {
      const iosPassed = iosTests.filter(r => r.status === 'passed').length;
      console.log(`📱 iOS Component Tests: ${iosPassed}/${iosTests.length} passed`);
    }
  }

  private generateMCPOutput() {
    const mcpData = {
      timestamp: new Date().toISOString(),
      baseURL: process.env.PLAYWRIGHT_BASE_URL,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'passed').length,
        failed: this.testResults.filter(r => r.status === 'failed').length,
        skipped: this.testResults.filter(r => r.status === 'skipped').length,
      },
      mcpIntegration: {
        active: true,
        version: '1.0.0',
        capabilities: ['dynamic-port', 'enhanced-reporting', 'ios-components']
      }
    };

    // Write MCP-compatible output
    require('fs').writeFileSync(
      './test-results/mcp-report.json',
      JSON.stringify(mcpData, null, 2)
    );
  }
}

export default MCPReporter;