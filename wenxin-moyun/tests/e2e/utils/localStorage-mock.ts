// localStorage Mock for CI Environment
// 提供localStorage和sessionStorage的完整模拟实现

export class MockStorage implements Storage {
  private data: { [key: string]: string } = {};

  get length(): number {
    return Object.keys(this.data).length;
  }

  clear(): void {
    this.data = {};
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  setItem(key: string, value: string): void {
    this.data[key] = String(value);
  }
}

export class MockLocalStorage extends MockStorage {
  // 可以添加localStorage特定的行为
}

export class MockSessionStorage extends MockStorage {
  // 可以添加sessionStorage特定的行为
}

// 全局mock函数
export function mockWebStorage() {
  // 检查是否在CI环境或测试环境
  if (typeof window !== 'undefined') {
    if (!window.localStorage || process.env.CI) {
      Object.defineProperty(window, 'localStorage', {
        value: new MockLocalStorage(),
        writable: true,
        configurable: true,
      });
    }

    if (!window.sessionStorage || process.env.CI) {
      Object.defineProperty(window, 'sessionStorage', {
        value: new MockSessionStorage(),
        writable: true,
        configurable: true,
      });
    }
  }
}

// 为Playwright测试提供的全局设置函数
export function setupStorageForTests() {
  mockWebStorage();
  
  // 确保crypto API可用 (React 19需要)
  if (typeof window !== 'undefined' && !window.crypto?.randomUUID) {
    Object.defineProperty(window, 'crypto', {
      value: {
        randomUUID: () => 'test-' + Math.random().toString(36).substring(2, 15),
        ...window.crypto,
      },
      writable: true,
      configurable: true,
    });
  }
}