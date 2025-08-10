import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { getGuestHeaders } from '../utils/guestSession';
import { apiCache, staticCache, cacheKeys } from '../utils/cache';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: Number(API_TIMEOUT),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Add guest headers if not authenticated
      const guestHeaders = getGuestHeaders();
      Object.assign(config.headers, guestHeaders);
    }
    return config;
  },
  (error) => {
    // Ensure we reject with a proper Error object
    if (error instanceof Error) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error(String(error)));
  }
);

// Store for pending requests to retry after login
let pendingRequests: Array<() => void> = [];
let loginModalCallback: ((trigger: string) => void) | null = null;

// Set login modal callback
export const setLoginModalCallback = (callback: (trigger: string) => void) => {
  loginModalCallback = callback;
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Check for guest session info in response headers
    const guestSessionHeader = response.headers['x-guest-session'];
    if (guestSessionHeader) {
      try {
        const guestSession = JSON.parse(guestSessionHeader);
        
        // Store guest session info for tracking
        sessionStorage.setItem('guest_session', guestSessionHeader);
        
        // Check trigger scenarios
        if (guestSession.suggestions?.show_login_prompt && loginModalCallback) {
          const primaryScenario = guestSession.suggestions.primary_scenario;
          if (primaryScenario) {
            // Delay slightly to not interrupt user flow
            setTimeout(() => {
              loginModalCallback(primaryScenario.type);
            }, 500);
          }
        }
      } catch (error) {
        console.error('Failed to parse guest session header:', error);
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle guest limit reached (429 Too Many Requests)
    if (error.response?.status === 429) {
      const guestSessionHeader = error.response.headers['x-guest-session'];
      if (guestSessionHeader) {
        try {
          const guestSession = JSON.parse(guestSessionHeader);
          sessionStorage.setItem('guest_session', guestSessionHeader);
        } catch (e) {
          console.error('Failed to parse guest session from error:', e);
        }
      }
      
      if (loginModalCallback) {
        loginModalCallback('limit_reached');
        
        // Store request to retry after login
        const originalRequest = error.config;
        if (originalRequest) {
          return new Promise((resolve) => {
            pendingRequests.push(() => {
              resolve(apiClient(originalRequest));
            });
          });
        }
      }
    }
    
    // Handle authentication errors (401 Unauthorized)
    if (error.response?.status === 401) {
      if (!localStorage.getItem('access_token')) {
        // Guest user hit protected endpoint
        if (loginModalCallback) {
          loginModalCallback('auth_required');
        }
      } else {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        if (window.location.pathname !== '/login') {
          window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Retry pending requests after successful login
export const retryPendingRequests = () => {
  pendingRequests.forEach(callback => callback());
  pendingRequests = [];
};

export default apiClient;

// Cache management utilities
export const cacheUtils = {
  // Get cache statistics for debugging
  getStats: () => {
    return {
      api: apiCache.getStats(),
      static: staticCache.getStats(),
    };
  },
  
  // Clear all caches
  clearAll: () => {
    apiCache.clear();
    staticCache.clear();
  },
  
  // Warm up essential caches
  warmUp: async () => {
    try {
      // Preload commonly accessed data
      await Promise.allSettled([
        galleryApi.getArtworks(),
        modelsApi.getModels(),
        leaderboardApi.getLeaderboard(),
      ]);
      console.log('Cache: Warmed up successfully');
    } catch (error) {
      console.warn('Cache: Warm up failed:', error);
    }
  },
};

// API error handler with network detection
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    // Network errors (no response)
    if (!error.response) {
      // Add network error flag for offline detection
      (error as any).code = 'NETWORK_ERROR';
      
      if (error.code === 'ECONNABORTED') {
        return 'Request timeout - please check your connection';
      }
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        return 'Network error - please check your internet connection';
      }
      return 'Unable to connect to server';
    }
    
    // Server response errors
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
};

// Check if error is a network/offline error
export const isNetworkError = (error: any): boolean => {
  if (axios.isAxiosError(error)) {
    return !error.response || 
           error.code === 'ECONNABORTED' ||
           error.code === 'ERR_NETWORK' ||
           error.message?.includes('Network Error') ||
           error.message?.includes('fetch');
  }
  return false;
};

// Gallery API endpoints with intelligent caching
export const galleryApi = {
  // Get artworks with optional filtering (cached)
  getArtworks: async (params?: {
    type?: string;
    model_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const cacheKey = cacheKeys.artworks(params);
    return apiCache.get(
      cacheKey,
      () => apiClient.get('/artworks/', { params })
    );
  },

  // Get single artwork by ID (cached)
  getArtwork: async (id: string) => {
    const cacheKey = cacheKeys.artwork(id);
    return apiCache.get(
      cacheKey,
      () => apiClient.get(`/artworks/${id}`)
    );
  },

  // Like an artwork (invalidates cache)
  likeArtwork: async (id: string) => {
    const result = await apiClient.post(`/artworks/${id}/like`);
    // Invalidate artwork cache to reflect new like count
    apiCache.invalidate(cacheKeys.artwork(id));
    apiCache.invalidatePattern(/^artworks/); // Invalidate lists
    return result;
  },

  // Record a view for an artwork (invalidates cache)
  viewArtwork: async (id: string) => {
    const result = await apiClient.post(`/artworks/${id}/view`);
    // Invalidate artwork cache to reflect new view count
    apiCache.invalidate(cacheKeys.artwork(id));
    return result;
  },

  // Share an artwork (no cache invalidation needed)
  shareArtwork: (id: string) => {
    return apiClient.post(`/artworks/${id}/share`);
  },
};

// Models API with caching
export const modelsApi = {
  // Get all models (static cache - changes infrequently)
  getModels: async (params?: any) => {
    const cacheKey = cacheKeys.models(params);
    return staticCache.get(
      cacheKey,
      () => apiClient.get('/models/', { params })
    );
  },

  // Get single model (static cache)
  getModel: async (id: string) => {
    const cacheKey = cacheKeys.model(id);
    return staticCache.get(
      cacheKey,
      () => apiClient.get(`/models/${id}`)
    );
  },
};

// Leaderboard API with static caching
export const leaderboardApi = {
  // Get leaderboard (static cache - updates infrequently)
  getLeaderboard: async (category?: string) => {
    const cacheKey = cacheKeys.leaderboard(category);
    return staticCache.get(
      cacheKey,
      () => apiClient.get(`/leaderboard/${category || ''}`.replace(/\/$/, ''))
    );
  },
};

// Evaluations API with caching
export const evaluationsApi = {
  // Get evaluations list (cached)
  getEvaluations: async (params?: any) => {
    const cacheKey = cacheKeys.evaluations(params);
    return apiCache.get(
      cacheKey,
      () => apiClient.get('/evaluations/', { params })
    );
  },

  // Get single evaluation (cached)
  getEvaluation: async (id: string) => {
    const cacheKey = cacheKeys.evaluation(id);
    return apiCache.get(
      cacheKey,
      () => apiClient.get(`/evaluations/${id}`)
    );
  },

  // Create evaluation (invalidates cache)
  createEvaluation: async (data: any) => {
    const result = await apiClient.post('/evaluations/', data);
    // Invalidate evaluations list cache
    apiCache.invalidatePattern(/^evaluations/);
    return result;
  },
};

// Battles API with real-time caching
export const battlesApi = {
  // Get battles (short cache due to real-time nature)
  getBattles: async (params?: any) => {
    const cacheKey = cacheKeys.battles(params);
    return apiCache.get(
      cacheKey,
      () => apiClient.get('/battles/', { params }),
      60000 // 1 minute TTL for battles
    );
  },

  // Vote on battle (invalidates cache)
  voteBattle: async (battleId: string, choice: string) => {
    const result = await apiClient.post(`/battles/${battleId}/vote`, { choice });
    // Invalidate battles cache to reflect new votes
    apiCache.invalidatePattern(/^battles/);
    // Also invalidate leaderboard as it might change
    staticCache.invalidatePattern(/^leaderboard/);
    return result;
  },
};