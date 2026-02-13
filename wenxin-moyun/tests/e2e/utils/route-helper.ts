/**
 * Route utilities for E2E tests
 * Handles BrowserRouter/HashRouter URL formatting
 */

// BrowserRouter is current default in app; can be overridden when needed.
const ROUTER_MODE = process.env.VITE_ROUTER_MODE || 'browser';

/**
 * Convert a path to the correct format based on router mode
 * @param p - Path starting with or without /
 * @returns Properly formatted path for current router mode
 */
export const withRoute = (p: string): string => {
  // Ensure path starts with /
  const path = p.startsWith('/') ? p : `/${p}`;
  return ROUTER_MODE === 'hash' ? `/#${path}` : path;
};

/**
 * Create a URL matcher regex for assertions
 * @param path - Path to match
 * @returns RegExp that matches the path in current router mode
 */
export const urlMatcher = (path: string): RegExp => {
  const cleanPath = path.replace(/^\//, '');
  const pattern = ROUTER_MODE === 'hash' 
    ? `/#/${cleanPath}(\\?.*)?$`
    : `/${cleanPath}(\\?.*)?$`;
  return new RegExp(pattern);
};

/**
 * Get the base path for the current router mode
 */
export const getBasePath = (): string => {
  return ROUTER_MODE === 'hash' ? '/#/' : '/';
};

/**
 * Check if current URL matches a path
 */
export const isCurrentPath = (currentUrl: string, path: string): boolean => {
  return urlMatcher(path).test(currentUrl);
};
