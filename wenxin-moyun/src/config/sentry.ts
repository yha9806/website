/**
 * Sentry Error Monitoring Configuration
 *
 * Initializes Sentry for error tracking and performance monitoring.
 * Requires VITE_SENTRY_DSN environment variable to be set.
 *
 * Setup instructions:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Get your DSN from Project Settings > Client Keys (DSN)
 * 3. Add VITE_SENTRY_DSN to your .env file
 * 4. For production, add to GCP Secret Manager or environment config
 *
 * @module config/sentry
 */

import * as Sentry from '@sentry/react';

export interface SentryConfig {
  dsn: string | undefined;
  environment: string;
  release: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enabled: boolean;
}

/**
 * Get Sentry configuration from environment
 */
export function getSentryConfig(): SentryConfig {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  const isProduction = environment === 'production';

  return {
    dsn,
    environment,
    release: `wenxin-moyun@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    // Sample 10% of transactions in production, 100% in development
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    // Session replay sampling
    replaysSessionSampleRate: isProduction ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    // Only enable if DSN is configured
    enabled: !!dsn && dsn !== 'your-sentry-dsn-here',
  };
}

/**
 * Check if Sentry is properly configured
 */
export function isSentryConfigured(): boolean {
  const config = getSentryConfig();
  return config.enabled;
}

/**
 * Initialize Sentry with error tracking and performance monitoring
 */
export function initSentry(): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    console.info('[Sentry] Not initialized - DSN not configured');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: config.tracesSampleRate,
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
      // Filter out noisy errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignore errors from browser extensions
        if (error instanceof Error && error.stack?.includes('chrome-extension://')) {
          return null;
        }

        // Ignore ResizeObserver errors (common, not actionable)
        if (error instanceof Error && error.message.includes('ResizeObserver')) {
          return null;
        }

        return event;
      },
      // Add context to all events
      initialScope: {
        tags: {
          app: 'vulca',
          version: config.release,
        },
      },
    });

    console.info(`[Sentry] Initialized for ${config.environment} environment`);
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    console.error('[Error]', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message (for non-error events)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    console.log(`[${level}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id?: string; email?: string; username?: string } | null): void {
  const config = getSentryConfig();

  if (!config.enabled) return;

  if (user) {
    Sentry.setUser(user);
    console.info('[Sentry] User context set:', user.username || user.id);
  } else {
    Sentry.setUser(null);
    console.info('[Sentry] User context cleared');
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  const config = getSentryConfig();

  if (!config.enabled) return;

  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
}

/**
 * Wrap a React component with Sentry error boundary
 * Usage: export default withSentryErrorBoundary(MyComponent);
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Sentry ErrorBoundary component
 * Usage: <SentryErrorBoundary fallback={<ErrorFallback />}><App /></SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Start a manual transaction for performance tracking
 */
export function startTransaction(name: string, op: string): ReturnType<typeof Sentry.startSpan> | undefined {
  const config = getSentryConfig();

  if (!config.enabled) return undefined;

  return Sentry.startSpan({ name, op }, () => undefined);
}

export default {
  init: initSentry,
  captureError,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  isConfigured: isSentryConfigured,
  withErrorBoundary: withSentryErrorBoundary,
  ErrorBoundary: SentryErrorBoundary,
};
