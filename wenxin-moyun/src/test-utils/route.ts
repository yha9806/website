/**
 * Route utilities for HashRouter/BrowserRouter compatibility
 * Shared between frontend and E2E tests
 */

type EnvMap = Record<string, string | undefined>;

interface ProcessLike {
  env?: EnvMap;
}

type WindowWithImportMeta = Window & {
  import?: {
    meta?: {
      env?: EnvMap;
    };
  };
};

export const ROUTER_MODE = 
  typeof globalThis !== 'undefined' && (globalThis as { process?: ProcessLike }).process?.env?.VITE_ROUTER_MODE
    ? (globalThis as { process?: ProcessLike }).process?.env?.VITE_ROUTER_MODE
    : (typeof window !== 'undefined' && (window as WindowWithImportMeta).import?.meta?.env?.VITE_ROUTER_MODE)
      ? (window as WindowWithImportMeta).import?.meta?.env?.VITE_ROUTER_MODE
      : 'browser'; // Default to BrowserRouter

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
