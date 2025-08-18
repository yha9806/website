/**
 * Route utilities for HashRouter/BrowserRouter compatibility
 * Shared between frontend and E2E tests
 */

// Handle both browser and Node.js environments
declare const process: any;

export const ROUTER_MODE = 
  typeof process !== 'undefined' && process.env?.VITE_ROUTER_MODE 
    ? process.env.VITE_ROUTER_MODE
    : (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_ROUTER_MODE) 
      ? (window as any).import.meta.env.VITE_ROUTER_MODE 
      : 'hash'; // Default to hash router

/**
 * Convert a path to the correct format based on router mode
 * @param p - Path starting with or without /
 * @returns Properly formatted path for current router mode
 */
export const withRoute = (p: string) => {
  // Ensure path starts with /
  const path = p.startsWith('/') ? p : `/${p}`;
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};

/**
 * Create a URL matcher regex for assertions
 * @param path - Path to match
 * @returns RegExp that matches the path in current router mode
 */
export const urlMatcher = (path: string) => {
  const cleanPath = path.replace(/^\//, '');
  const pattern = ROUTER_MODE === 'hash' 
    ? `/#/${cleanPath}(\\?.*)?$`
    : `/${cleanPath}(\\?.*)?$`;
  return new RegExp(pattern);
};

/**
 * Get the base path for the current router mode
 */
export const getBasePath = () => {
  return ROUTER_MODE === 'hash' ? '/#/' : '/';
};

/**
 * Check if current URL matches a path
 */
export const isCurrentPath = (currentUrl: string, path: string): boolean => {
  return urlMatcher(path).test(currentUrl);
};