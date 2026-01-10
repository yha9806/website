/**
 * Logger Utility
 *
 * Provides debug logging that is automatically disabled in production builds.
 * Use these functions instead of console.log/warn/error for development logging.
 *
 * @usage
 * import { log, warn, error, debug } from '../utils/logger';
 * log('This only appears in development');
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Log message (only in development)
 */
export const log = IS_DEV
  ? (...args: unknown[]) => console.log(...args)
  : () => {};

/**
 * Warning message (only in development)
 */
export const warn = IS_DEV
  ? (...args: unknown[]) => console.warn(...args)
  : () => {};

/**
 * Error message (always shown - errors should be visible)
 */
export const error = (...args: unknown[]) => console.error(...args);

/**
 * Debug message with prefix (only in development)
 */
export const debug = IS_DEV
  ? (prefix: string, ...args: unknown[]) => console.log(`[${prefix}]`, ...args)
  : () => {};

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  return {
    log: IS_DEV
      ? (...args: unknown[]) => console.log(`[${namespace}]`, ...args)
      : () => {},
    warn: IS_DEV
      ? (...args: unknown[]) => console.warn(`[${namespace}]`, ...args)
      : () => {},
    error: (...args: unknown[]) => console.error(`[${namespace}]`, ...args),
    debug: IS_DEV
      ? (...args: unknown[]) => console.debug(`[${namespace}]`, ...args)
      : () => {},
  };
}

export default { log, warn, error, debug, createLogger };
