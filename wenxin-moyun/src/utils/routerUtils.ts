/**
 * Router utilities for HashRouter compatibility
 * Ensures all navigation works correctly with Cloud Storage static hosting
 */

/**
 * Convert a path to HashRouter compatible format
 * @param path - The path to convert (e.g., "/model/123")
 * @returns The HashRouter compatible path (e.g., "#/model/123")
 */
export function toHashPath(path: string): string {
  // If it's already a hash path, return as-is
  if (path.startsWith('#')) {
    return path;
  }
  
  // If it's a relative path starting with /, prepend #
  if (path.startsWith('/')) {
    return `#${path}`;
  }
  
  // Otherwise, prepend #/
  return `#/${path}`;
}

/**
 * Check if we're in production environment (Cloud Storage)
 */
export function isProductionEnvironment(): boolean {
  return window.location.hostname.includes('storage.googleapis.com');
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (isProductionEnvironment()) {
    return 'https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html';
  }
  return window.location.origin;
}

/**
 * Navigate to a route programmatically
 * @param path - The path to navigate to
 */
export function navigateToRoute(path: string): void {
  const hashPath = toHashPath(path);
  
  if (isProductionEnvironment()) {
    // In production, ensure we stay on the index.html page
    window.location.href = `${getBaseUrl()}${hashPath}`;
  } else {
    // In development, just update the hash
    window.location.hash = hashPath.replace('#', '');
  }
}