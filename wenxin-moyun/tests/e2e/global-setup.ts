// Playwright全局设置 - CI环境兼容性
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // 在CI环境中进行一次性的全局设置
  if (process.env.CI) {
    console.log('🔧 CI environment detected: Setting up browser compatibility...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 添加localStorage和sessionStorage的polyfill
    await page.addInitScript(() => {
      // Mock localStorage for CI
      if (!window.localStorage) {
        const mockLocalStorage = {
          data: {} as { [key: string]: string },
          getItem(key: string) { return this.data[key] || null; },
          setItem(key: string, value: string) { this.data[key] = value; },
          removeItem(key: string) { delete this.data[key]; },
          clear() { this.data = {}; },
          get length() { return Object.keys(this.data).length; },
          key(index: number) { const keys = Object.keys(this.data); return keys[index] || null; }
        };
        Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
      }
      
      // Mock sessionStorage for CI
      if (!window.sessionStorage) {
        const mockSessionStorage = {
          data: {} as { [key: string]: string },
          getItem(key: string) { return this.data[key] || null; },
          setItem(key: string, value: string) { this.data[key] = value; },
          removeItem(key: string) { delete this.data[key]; },
          clear() { this.data = {}; },
          get length() { return Object.keys(this.data).length; },
          key(index: number) { const keys = Object.keys(this.data); return keys[index] || null; }
        };
        Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
      }
      
      // Mock crypto.randomUUID for React 19
      if (!window.crypto?.randomUUID) {
        if (!window.crypto) {
          (window as any).crypto = {};
        }
        window.crypto.randomUUID = () => 'test-' + Math.random().toString(36).substring(2, 15);
      }
      
      console.log('✅ CI storage mocks initialized');
    });
    
    await browser.close();
  }
}

export default globalSetup;