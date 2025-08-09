/**
 * 性能优化工具集
 * 提供代码分割、懒加载、缓存等优化功能
 */

import { lazy, Suspense, ComponentType } from 'react';

/**
 * 懒加载组件包装器
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: any) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * 默认加载组件
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  );
}

/**
 * 图片懒加载
 */
export function lazyLoadImage(src: string, alt: string, className?: string) {
  return {
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
    'data-src': src,
    alt,
    className: `lazy-image ${className || ''}`,
    loading: 'lazy' as const,
    onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      }
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  buffer: number;
  container: HTMLElement | null;
}

/**
 * 计算虚拟滚动可见项
 */
export function calculateVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  buffer = 5
) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
  );
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  };
}

/**
 * 预加载关键资源
 */
export function preloadResources(resources: string[]) {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      link.as = 'image';
    } else if (resource.match(/\.(woff|woff2|ttf|otf)$/i)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start && end) {
      const duration = end - start;
      console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
      
      // 发送到分析服务（如果配置）
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
          event_category: 'Performance'
        });
      }
      
      return duration;
    }
    
    return 0;
  }
  
  // 获取Web Vitals
  static getWebVitals() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0] as any;
    
    return {
      // First Contentful Paint
      FCP: fcp?.startTime || 0,
      // Largest Contentful Paint  
      LCP: lcp?.startTime || 0,
      // Time to Interactive
      TTI: navigation.domInteractive - navigation.fetchStart,
      // Total Blocking Time (需要额外计算)
      TBT: 0,
      // Cumulative Layout Shift (需要额外计算)
      CLS: 0
    };
  }
}

/**
 * 内存缓存
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private maxSize: number;
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }
  
  set(key: string, value: T, ttl = 300000) { // 默认5分钟
    // 如果缓存满了，删除最早的项
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
}

/**
 * 请求去重
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();
  
  async deduplicate<T>(
    key: string,
    requestFunc: () => Promise<T>
  ): Promise<T> {
    // 如果已有相同请求在进行，返回同一个Promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    
    // 创建新请求
    const promise = requestFunc().finally(() => {
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

/**
 * 批量请求优化
 */
export class BatchRequestOptimizer<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private delay: number;
  private batchProcessor: (items: T[]) => Promise<R[]>;
  
  constructor(
    batchProcessor: (items: T[]) => Promise<R[]>,
    batchSize = 10,
    delay = 100
  ) {
    this.batchProcessor = batchProcessor;
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay);
      }
    });
  }
  
  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    const items = batch.map(b => b.item);
    
    try {
      const results = await this.batchProcessor(items);
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
  }
}

// 导出性能监控实例
export const perfMonitor = new PerformanceMonitor();

// 导出全局缓存实例
export const globalCache = new MemoryCache();

// 导出请求去重器
export const requestDedup = new RequestDeduplicator();