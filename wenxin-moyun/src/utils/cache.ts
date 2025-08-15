/**
 * Advanced Caching System for API Data
 * Provides intelligent caching with TTL, LRU eviction, and background refresh
 */

import React from 'react';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cache entries
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh data
  backgroundRefresh: boolean; // Refresh data in background before expiration
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  accessCount: number;
  lastAccess: number;
  refreshPromise?: Promise<T>;
}

export class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 300000, // 5 minutes default
      maxSize: 100, // 100 entries default
      staleWhileRevalidate: true,
      backgroundRefresh: true,
      ...config,
    };
  }

  /**
   * Get cached data or fetch fresh data
   */
  async get<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);
    const ttl = customTTL || this.config.ttl;

    // Cache hit - data is fresh
    if (entry && now < entry.expiry) {
      entry.accessCount++;
      entry.lastAccess = now;
      
      // Background refresh if enabled and close to expiration
      if (
        this.config.backgroundRefresh && 
        !entry.refreshPromise &&
        now > entry.expiry - ttl * 0.1 // Refresh when 10% of TTL remains
      ) {
        entry.refreshPromise = this.backgroundRefresh(key, fetchFunction, ttl);
      }

      return entry.data;
    }

    // Cache hit - stale data but stale-while-revalidate enabled
    if (entry && this.config.staleWhileRevalidate && !entry.refreshPromise) {
      entry.refreshPromise = this.backgroundRefresh(key, fetchFunction, ttl);
      entry.accessCount++;
      entry.lastAccess = now;
      return entry.data;
    }

    // Cache miss or data expired - fetch fresh
    return this.fetchAndCache(key, fetchFunction, ttl);
  }

  /**
   * Set data in cache manually
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.config.ttl;

    this.evictLRU();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
      accessCount: 1,
      lastAccess: now,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let fresh = 0;
    let stale = 0;
    const total = this.cache.size;

    for (const entry of this.cache.values()) {
      if (now < entry.expiry) {
        fresh++;
      } else {
        stale++;
      }
    }

    return {
      total,
      fresh,
      stale,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Private: Fetch data and store in cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      const staleEntry = this.cache.get(key);
      if (staleEntry) {
        console.warn(`Cache: Fetch failed for ${key}, returning stale data`);
        return staleEntry.data;
      }
      throw error;
    }
  }

  /**
   * Private: Background refresh of cache entry
   */
  private async backgroundRefresh<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const data = await fetchFunction();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.warn(`Cache: Background refresh failed for ${key}:`, error);
      const entry = this.cache.get(key);
      if (entry) {
        entry.refreshPromise = undefined;
      }
      throw error;
    }
  }

  /**
   * Private: Evict least recently used entries if cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < this.config.maxSize) return;

    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Private: Calculate cache hit rate
   */
  private calculateHitRate(): number {
    if (this.cache.size === 0) return 0;
    
    let totalAccess = 0;
    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
    }
    
    return totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;
  }
}

/**
 * Cache configurations for different data types
 */
export const cacheConfigs = {
  // Fast-changing data
  realtime: {
    ttl: 30000, // 30 seconds
    maxSize: 50,
    staleWhileRevalidate: true,
    backgroundRefresh: true,
  },
  
  // Regular API data
  default: {
    ttl: 300000, // 5 minutes
    maxSize: 100,
    staleWhileRevalidate: true,
    backgroundRefresh: true,
  },
  
  // Static/slow-changing data
  static: {
    ttl: 1800000, // 30 minutes
    maxSize: 200,
    staleWhileRevalidate: true,
    backgroundRefresh: false,
  },
  
  // User-specific data
  user: {
    ttl: 600000, // 10 minutes
    maxSize: 50,
    staleWhileRevalidate: true,
    backgroundRefresh: true,
  },
};

/**
 * Global cache instances
 */
export const apiCache = new APICache(cacheConfigs.default);
export const realtimeCache = new APICache(cacheConfigs.realtime);
export const staticCache = new APICache(cacheConfigs.static);
export const userCache = new APICache(cacheConfigs.user);

/**
 * Cache key generators
 */
export const cacheKeys = {
  artworks: (params?: any) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return `artworks${query ? `?${query}` : ''}`;
  },
  
  artwork: (id: string) => `artwork:${id}`,
  
  models: (params?: any) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return `models${query ? `?${query}` : ''}`;
  },
  
  model: (id: string) => `model:${id}`,
  
  leaderboard: (category?: string) => `leaderboard${category ? `:${category}` : ''}`,
  
  battles: (params?: any) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return `battles${query ? `?${query}` : ''}`;
  },
  
  evaluations: (params?: any) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return `evaluations${query ? `?${query}` : ''}`;
  },
  
  evaluation: (id: string) => `evaluation:${id}`,
  
  user: (id: string) => `user:${id}`,
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate all artwork-related caches
  artworks: () => {
    apiCache.invalidatePattern(/^artworks/);
    apiCache.invalidatePattern(/^artwork:/);
  },
  
  // Invalidate specific artwork
  artwork: (id: string) => {
    apiCache.invalidate(cacheKeys.artwork(id));
    apiCache.invalidatePattern(/^artworks/); // Also invalidate lists
  },
  
  // Invalidate all model-related caches
  models: () => {
    apiCache.invalidatePattern(/^models/);
    apiCache.invalidatePattern(/^model:/);
    staticCache.invalidatePattern(/^leaderboard/);
  },
  
  // Invalidate specific model
  model: (id: string) => {
    apiCache.invalidate(cacheKeys.model(id));
    apiCache.invalidatePattern(/^models/);
    staticCache.invalidatePattern(/^leaderboard/);
  },
  
  // Invalidate leaderboard
  leaderboard: () => {
    staticCache.invalidatePattern(/^leaderboard/);
  },
  
  // Invalidate user data
  user: (id: string) => {
    userCache.invalidate(cacheKeys.user(id));
  },
};

/**
 * Cache warming - preload commonly accessed data
 */
export const warmCache = {
  essential: async () => {
    // Preload essential data that users are likely to access
    try {
      const { galleryApi } = await import('../services/api');
      
      // Warm up artworks list
      await apiCache.get(
        cacheKeys.artworks(), 
        () => galleryApi.getArtworks().then(res => res.data)
      );
      
      console.log('Cache: Essential data warmed up');
    } catch (error) {
      console.warn('Cache: Failed to warm up essential data:', error);
    }
  },
};

/**
 * React hook for cache statistics (development)
 */
export const useCacheStats = () => {
  const [stats, setStats] = React.useState({
    api: apiCache.getStats(),
    realtime: realtimeCache.getStats(),
    static: staticCache.getStats(),
    user: userCache.getStats(),
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        api: apiCache.getStats(),
        realtime: realtimeCache.getStats(),
        static: staticCache.getStats(),
        user: userCache.getStats(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};