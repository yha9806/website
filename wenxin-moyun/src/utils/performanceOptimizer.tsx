/**
 * Performance Optimization Toolkit  
 * Provides code splitting, lazy loading, caching and other optimization features
 */

/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense, type ComponentType, useEffect, useRef } from 'react';

// Global type extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Performance level types
export type PerformanceLevel = 'high' | 'medium' | 'low';

// Performance configuration interface
export interface PerformanceConfig {
  emojiSizes: string[];
  animationComplexity: 'full' | 'medium' | 'simple';
  durations: number[];
  enableRotation: boolean;
  enableBlur: boolean;
  opacity: number;
  darkOpacity: number;
}

// Detect device performance capabilities
export function detectDevicePerformance(): PerformanceLevel {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check device memory if available (Chrome only)
  // @ts-expect-error - navigator.deviceMemory is not in TypeScript types yet
  const memory = navigator.deviceMemory || 4;
  
  // Check pixel ratio (high DPI screens need more resources)
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check max touch points (mobile/tablet indicator)
  const touchPoints = navigator.maxTouchPoints || 0;
  
  // Calculate performance score
  let score = 0;
  
  // CPU score (0-3 points)
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else if (cores >= 2) score += 1;
  
  // Memory score (0-3 points)
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else if (memory >= 2) score += 1;
  
  // Screen score (0-2 points)
  if (pixelRatio <= 1.5) score += 2;
  else if (pixelRatio <= 2) score += 1;
  
  // Device type penalty
  if (isMobile || touchPoints > 0) score -= 2;
  
  // Determine performance level
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

// Get performance configuration based on level
export function getPerformanceConfig(level: PerformanceLevel): PerformanceConfig {
  switch (level) {
    case 'high':
      return {
        emojiSizes: ['text-[500px] md:text-[700px]', 'text-[400px] md:text-[600px]', 'text-[350px] md:text-[500px]'],
        animationComplexity: 'full',
        durations: [25, 30, 35],
        enableRotation: true,
        enableBlur: true,
        opacity: 0.4,
        darkOpacity: 0.3
      };
    
    case 'medium':
      return {
        emojiSizes: ['text-[300px] md:text-[400px]', 'text-[250px] md:text-[350px]', 'text-[200px] md:text-[300px]'],
        animationComplexity: 'medium',
        durations: [20, 25, 30],
        enableRotation: true,
        enableBlur: false,
        opacity: 0.35,
        darkOpacity: 0.25
      };
    
    case 'low':
      return {
        emojiSizes: ['text-[200px] md:text-[250px]', 'text-[180px] md:text-[220px]', 'text-[150px] md:text-[200px]'],
        animationComplexity: 'simple',
        durations: [15, 20, 25],
        enableRotation: false,
        enableBlur: false,
        opacity: 0.3,
        darkOpacity: 0.2
      };
  }
}

// Custom hook for managing will-change property
export function useWillChange(
  ref: React.RefObject<HTMLElement>,
  properties: string[] = ['transform', 'opacity'],
  delay: number = 200
) {
  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    let timeoutId: NodeJS.Timeout;
    
    // Function to apply will-change
    const applyWillChange = () => {
      element.style.willChange = properties.join(', ');
      
      // Remove will-change after animation settles
      timeoutId = setTimeout(() => {
        element.style.willChange = 'auto';
      }, delay);
    };
    
    // Apply on mount
    applyWillChange();
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (element) {
        element.style.willChange = 'auto';
      }
    };
  }, [ref, properties, delay]);
}

// Generate optimized animation based on complexity
export function getOptimizedAnimation(
  complexity: 'full' | 'medium' | 'simple',
  index: number
) {
  switch (complexity) {
    case 'full':
      // Full complex animation with rotation
      if (index === 0) {
        return {
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          rotate: [0, 15, -10, 0],
        };
      } else if (index === 1) {
        return {
          x: [0, -80, 60, 0],
          y: [0, 80, -60, 0],
          rotate: [0, -20, 15, 0],
        };
      } else {
        return {
          x: [-50, 50, -30, -50],
          y: [-30, 30, -20, -30],
          rotate: [0, 10, -15, 0],
        };
      }
    
    case 'medium':
      // Medium complexity - less movement, keep rotation
      if (index === 0) {
        return {
          x: [0, 50, -25, 0],
          y: [0, -50, 25, 0],
          rotate: [0, 10, -5, 0],
        };
      } else if (index === 1) {
        return {
          x: [0, -40, 30, 0],
          y: [0, 40, -30, 0],
          rotate: [0, -10, 8, 0],
        };
      } else {
        return {
          x: [-25, 25, -15, -25],
          y: [-15, 15, -10, -15],
          rotate: [0, 5, -8, 0],
        };
      }
    
    case 'simple':
      // Simple animation - only position, no rotation
      if (index === 0) {
        return {
          x: [0, 30, -15, 0],
          y: [0, -30, 15, 0],
        };
      } else if (index === 1) {
        return {
          x: [0, -25, 20, 0],
          y: [0, 25, -20, 0],
        };
      } else {
        return {
          x: [-15, 15, -10, -15],
          y: [-10, 10, -5, -10],
        };
      }
  }
}

// CSS optimization styles for GPU acceleration
export const gpuAccelerationStyles: React.CSSProperties = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden',
  perspective: 1000,
  willChange: 'transform, opacity',
  contain: 'layout style paint',
};

/**
 * Lazy load component wrapper
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
 * Default loading component
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
  </div>
);

/**
 * Image lazy loading
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
 * Debounce function
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
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
  itemHeight: number;
  buffer: number;
  container: HTMLElement | null;
}

/**
 * Calculate virtual scroll visible items
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
 * Preload critical resources
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
 * Performance monitoring
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
      
      // Send to analytics service (if configured)
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
  
  // Get Web Vitals
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
      // Total Blocking Time (requires additional calculation)
      TBT: 0,
      // Cumulative Layout Shift (requires additional calculation)
      CLS: 0
    };
  }
}

/**
 * Memory cache
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private maxSize: number;
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }
  
  set(key: string, value: T, ttl = 300000) { // Default 5 minutes
    // If cache is full, delete the oldest item
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
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
 * Request deduplication
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();
  
  async deduplicate<T>(
    key: string,
    requestFunc: () => Promise<T>
  ): Promise<T> {
    // If the same request is in progress, return the same Promise
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    
    // Create new request
    const promise = requestFunc().finally(() => {
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

/**
 * Batch request optimization
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

// Export performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Export global cache instance
export const globalCache = new MemoryCache();

// Export request deduplicator
export const requestDedup = new RequestDeduplicator();