/**
 * 存储API模拟工具 - 为CI和本地环境提供统一的存储访问接口
 * 解决CI环境中localStorage/sessionStorage访问限制问题
 */

export interface MockStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

/**
 * 内存存储实现，完全模拟localStorage/sessionStorage API
 */
export class MemoryStorage implements MockStorage {
  private data: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.data[key] || null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  }

  get length(): number {
    return Object.keys(this.data).length;
  }
}

/**
 * 安全的存储访问器，自动回退到内存存储
 */
export class SafeStorageAccessor {
  private localStorage: MockStorage;
  private sessionStorage: MockStorage;

  constructor() {
    // 尝试访问真实的localStorage
    this.localStorage = this.createStorageProxy('localStorage');
    this.sessionStorage = this.createStorageProxy('sessionStorage');
  }

  private createStorageProxy(storageType: 'localStorage' | 'sessionStorage'): MockStorage {
    try {
      // 测试是否可以访问真实存储
      const realStorage = window[storageType];
      if (realStorage && typeof realStorage.getItem === 'function') {
        // 测试读写操作
        const testKey = '__storage_test__';
        realStorage.setItem(testKey, 'test');
        const testValue = realStorage.getItem(testKey);
        realStorage.removeItem(testKey);
        
        if (testValue === 'test') {
          return realStorage as MockStorage;
        }
      }
    } catch (error) {
      console.log(`${storageType} not accessible, using memory storage:`, error.message);
    }

    // 回退到内存存储
    return new MemoryStorage();
  }

  getLocalStorage(): MockStorage {
    return this.localStorage;
  }

  getSessionStorage(): MockStorage {
    return this.sessionStorage;
  }

  /**
   * 安全设置localStorage项目
   */
  setLocalItem(key: string, value: string): void {
    try {
      this.localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set localStorage item ${key}:`, error);
    }
  }

  /**
   * 安全获取localStorage项目
   */
  getLocalItem(key: string): string | null {
    try {
      return this.localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get localStorage item ${key}:`, error);
      return null;
    }
  }

  /**
   * 安全删除localStorage项目
   */
  removeLocalItem(key: string): void {
    try {
      this.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage item ${key}:`, error);
    }
  }

  /**
   * 安全清空localStorage
   */
  clearLocal(): void {
    try {
      this.localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * 安全设置sessionStorage项目
   */
  setSessionItem(key: string, value: string): void {
    try {
      this.sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to set sessionStorage item ${key}:`, error);
    }
  }

  /**
   * 安全获取sessionStorage项目
   */
  getSessionItem(key: string): string | null {
    try {
      return this.sessionStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get sessionStorage item ${key}:`, error);
      return null;
    }
  }

  /**
   * 安全删除sessionStorage项目
   */
  removeSessionItem(key: string): void {
    try {
      this.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove sessionStorage item ${key}:`, error);
    }
  }

  /**
   * 安全清空sessionStorage
   */
  clearSession(): void {
    try {
      this.sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }

  /**
   * 清空所有存储并重置测试状态
   * 用于测试环境的完全清理
   */
  clearAll(): void {
    // 清理存储
    this.clearLocal();
    this.clearSession();
    
    // 清理window测试属性
    if (typeof window !== 'undefined') {
      delete (window as any).__TEST_AUTH_TOKEN__;
      delete (window as any).__TEST_GUEST_SESSION__;
      delete (window as any).__TEST_USER_DATA__;
      
      // 重置为null确保测试检查正确
      (window as any).__TEST_AUTH_TOKEN__ = null;
      (window as any).__TEST_GUEST_SESSION__ = null;
    }
  }
}

/**
 * 全局存储访问器实例
 */
export const safeStorage = new SafeStorageAccessor();

/**
 * 在页面上下文中初始化安全存储
 * 用于Playwright测试环境
 */
export function initSafeStorageInPage() {
  return `
    // 存储API模拟和安全访问器
    window.__SAFE_STORAGE__ = {
      localStorage: {},
      sessionStorage: {},
      
      setLocalItem: function(key, value) {
        try {
          if (window.localStorage) {
            window.localStorage.setItem(key, value);
          } else {
            this.localStorage[key] = value;
          }
        } catch (e) {
          this.localStorage[key] = value;
        }
      },
      
      getLocalItem: function(key) {
        try {
          if (window.localStorage) {
            return window.localStorage.getItem(key);
          } else {
            return this.localStorage[key] || null;
          }
        } catch (e) {
          return this.localStorage[key] || null;
        }
      },
      
      removeLocalItem: function(key) {
        try {
          if (window.localStorage) {
            window.localStorage.removeItem(key);
          } else {
            delete this.localStorage[key];
          }
        } catch (e) {
          delete this.localStorage[key];
        }
      },
      
      clearLocal: function() {
        try {
          if (window.localStorage) {
            window.localStorage.clear();
          } else {
            this.localStorage = {};
          }
        } catch (e) {
          this.localStorage = {};
        }
      },
      
      setSessionItem: function(key, value) {
        try {
          if (window.sessionStorage) {
            window.sessionStorage.setItem(key, value);
          } else {
            this.sessionStorage[key] = value;
          }
        } catch (e) {
          this.sessionStorage[key] = value;
        }
      },
      
      getSessionItem: function(key) {
        try {
          if (window.sessionStorage) {
            return window.sessionStorage.getItem(key);
          } else {
            return this.sessionStorage[key] || null;
          }
        } catch (e) {
          return this.sessionStorage[key] || null;
        }
      },
      
      removeSessionItem: function(key) {
        try {
          if (window.sessionStorage) {
            window.sessionStorage.removeItem(key);
          } else {
            delete this.sessionStorage[key];
          }
        } catch (e) {
          delete this.sessionStorage[key];
        }
      },
      
      clearSession: function() {
        try {
          if (window.sessionStorage) {
            window.sessionStorage.clear();
          } else {
            this.sessionStorage = {};
          }
        } catch (e) {
          this.sessionStorage = {};
        }
      },
      
      clearAll: function() {
        // 清理所有存储
        this.clearLocal();
        this.clearSession();
        
        // 清理window测试属性
        delete window.__TEST_AUTH_TOKEN__;
        delete window.__TEST_GUEST_SESSION__;
        delete window.__TEST_USER_DATA__;
        
        // 重置为null确保测试检查正确
        window.__TEST_AUTH_TOKEN__ = null;
        window.__TEST_GUEST_SESSION__ = null;
      }
    };
    
    console.log('✅ 安全存储访问器已初始化');
  `;
}