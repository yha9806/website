import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { getGuestHeaders } from '../utils/guestSession';

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

// API error handler
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
};