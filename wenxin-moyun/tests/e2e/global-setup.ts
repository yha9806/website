// Playwright全局设置 - 增强存储兼容性
import { chromium, FullConfig } from '@playwright/test';
import { initSafeStorageInPage } from './utils/storage-mock.js';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up enhanced browser compatibility...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 注入增强的存储兼容性脚本
  await page.addInitScript(initSafeStorageInPage);
  
  // CI环境特殊处理：确保存储系统完全初始化
  await page.addInitScript(() => {
    // CI环境标记
    if (typeof process !== 'undefined' && process.env?.CI) {
      console.log('🔧 Initializing CI-specific storage enhancements...');
      
      // 增强的存储检查和初始化
      const initStorageForCI = () => {
        // 确保localStorage mock始终可用
        if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
          console.log('📦 Setting up localStorage mock for CI...');
          const mockStorage = {
            data: {},
            getItem(key) { return this.data[key] || null; },
            setItem(key, value) { this.data[key] = String(value); console.log(`CI localStorage.setItem: ${key} = ${value}`); },
            removeItem(key) { delete this.data[key]; console.log(`CI localStorage.removeItem: ${key}`); },
            clear() { this.data = {}; console.log('CI localStorage cleared'); },
            get length() { return Object.keys(this.data).length; },
            key(index) { const keys = Object.keys(this.data); return keys[index] || null; }
          };
          Object.defineProperty(window, 'localStorage', { value: mockStorage, writable: false });
        }
        
        // 增强测试存储
        window.__TEST_STORAGE__ = window.__TEST_STORAGE__ || {};
        window.__CI_ENVIRONMENT__ = true;
        
        console.log('✅ CI storage initialization complete');
      };
      
      // 立即初始化
      initStorageForCI();
      
      // 监听页面重新加载，重新初始化
      document.addEventListener('DOMContentLoaded', initStorageForCI);
    }
  });
  
  // 添加完整的存储API polyfill
  await page.addInitScript(() => {
    // 增强localStorage mock
    if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
      const mockLocalStorage = {
        data: {} as { [key: string]: string },
        getItem(key: string) { return this.data[key] || null; },
        setItem(key: string, value: string) { this.data[key] = String(value); },
        removeItem(key: string) { delete this.data[key]; },
        clear() { this.data = {}; },
        get length() { return Object.keys(this.data).length; },
        key(index: number) { const keys = Object.keys(this.data); return keys[index] || null; }
      };
      Object.defineProperty(window, 'localStorage', { 
        value: mockLocalStorage,
        writable: false,
        configurable: false
      });
    }
    
    // 增强sessionStorage mock
    if (!window.sessionStorage || typeof window.sessionStorage.getItem !== 'function') {
      const mockSessionStorage = {
        data: {} as { [key: string]: string },
        getItem(key: string) { return this.data[key] || null; },
        setItem(key: string, value: string) { this.data[key] = String(value); },
        removeItem(key: string) { delete this.data[key]; },
        clear() { this.data = {}; },
        get length() { return Object.keys(this.data).length; },
        key(index: number) { const keys = Object.keys(this.data); return keys[index] || null; }
      };
      Object.defineProperty(window, 'sessionStorage', { 
        value: mockSessionStorage,
        writable: false,
        configurable: false
      });
    }
    
    // Mock crypto.randomUUID for React 19
    if (!window.crypto?.randomUUID) {
      if (!window.crypto) {
        (window as any).crypto = {};
      }
      window.crypto.randomUUID = () => 'test-' + Math.random().toString(36).substring(2, 15);
    }
    
    // Mock performance.now for consistent timing
    if (!window.performance?.now) {
      if (!window.performance) {
        (window as any).performance = {};
      }
      const start = Date.now();
      window.performance.now = () => Date.now() - start;
    }
    
    console.log('✅ Enhanced storage and API mocks initialized');
  });
  
  await browser.close();
  console.log('✅ Global setup completed successfully');
}

export default globalSetup;