/**
 * Safe localStorage wrapper for CI compatibility
 * Falls back to window properties when localStorage is blocked
 */

interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class SafeStorage implements StorageInterface {
  private fallbackStorage: { [key: string]: string } = {};
  private useLocalStorage: boolean = true;

  constructor() {
    // Test localStorage availability
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.useLocalStorage = true;
    } catch (error) {
      console.warn('localStorage not available, using fallback storage');
      this.useLocalStorage = false;
      // Try to read from window properties if they exist (for tests)
      this.fallbackStorage = (window as any).__TEST_STORAGE__ || {};
    }
  }

  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage access failed, using fallback:', error);
        this.useLocalStorage = false;
      }
    }
    
    // Fallback: check both fallback storage and window properties
    const value = this.fallbackStorage[key] || 
                  (window as any)[`__TEST_${key.toUpperCase()}__`] ||
                  null;
    
    return value;
  }

  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (error) {
        console.warn('localStorage access failed, using fallback:', error);
        this.useLocalStorage = false;
      }
    }
    
    // Fallback: store in both fallback storage and window properties
    this.fallbackStorage[key] = value;
    (window as any)[`__TEST_${key.toUpperCase()}__`] = value;
    
    // Also update the main test storage object
    if (!(window as any).__TEST_STORAGE__) {
      (window as any).__TEST_STORAGE__ = {};
    }
    (window as any).__TEST_STORAGE__[key] = value;
  }

  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch (error) {
        console.warn('localStorage access failed, using fallback:', error);
        this.useLocalStorage = false;
      }
    }
    
    // Fallback: remove from both fallback storage and window properties
    delete this.fallbackStorage[key];
    delete (window as any)[`__TEST_${key.toUpperCase()}__`];
    
    if ((window as any).__TEST_STORAGE__) {
      delete (window as any).__TEST_STORAGE__[key];
    }
  }

  clear(): void {
    if (this.useLocalStorage) {
      try {
        localStorage.clear();
        return;
      } catch (error) {
        console.warn('localStorage access failed, using fallback:', error);
        this.useLocalStorage = false;
      }
    }
    
    // Fallback: clear fallback storage
    this.fallbackStorage = {};
    (window as any).__TEST_STORAGE__ = {};
  }
}

// Create singleton instance
export const safeStorage = new SafeStorage();

// Convenience functions that match localStorage API
export const getItem = (key: string) => safeStorage.getItem(key);
export const setItem = (key: string, value: string) => safeStorage.setItem(key, value);
export const removeItem = (key: string) => safeStorage.removeItem(key);
export const clearStorage = () => safeStorage.clear();