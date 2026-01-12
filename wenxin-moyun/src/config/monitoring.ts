/**
 * Application Monitoring Configuration
 *
 * Provides client-side metrics collection and performance monitoring.
 * Can be extended to integrate with GCP Cloud Monitoring, Google Analytics,
 * or other monitoring services.
 *
 * @module config/monitoring
 */

// Performance metrics types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
  labels?: Record<string, string>;
}

export interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: number;
}

// Metrics buffer for batching
const metricsBuffer: PerformanceMetric[] = [];
const actionsBuffer: UserAction[] = [];

// Configuration
const config = {
  enabled: import.meta.env.PROD,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  endpoint: import.meta.env.VITE_MONITORING_ENDPOINT || null,
};

/**
 * Record a performance metric
 */
export function recordMetric(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms',
  labels?: Record<string, string>
): void {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
    labels,
  };

  metricsBuffer.push(metric);

  // Log in development
  if (import.meta.env.DEV) {
    console.debug(`[Metric] ${name}: ${value}${unit}`, labels);
  }

  // Flush if buffer is full
  if (metricsBuffer.length >= config.batchSize) {
    flushMetrics();
  }
}

/**
 * Record a user action for analytics
 */
export function recordAction(
  action: string,
  category: string,
  label?: string,
  value?: number
): void {
  const userAction: UserAction = {
    action,
    category,
    label,
    value,
    timestamp: Date.now(),
  };

  actionsBuffer.push(userAction);

  // Log in development
  if (import.meta.env.DEV) {
    console.debug(`[Action] ${category}/${action}`, { label, value });
  }

  // Flush if buffer is full
  if (actionsBuffer.length >= config.batchSize) {
    flushActions();
  }
}

/**
 * Measure page load performance
 */
export function measurePageLoad(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  // Wait for load event
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        recordMetric('page_load_time', navigation.loadEventEnd - navigation.startTime, 'ms', {
          page: window.location.pathname,
        });

        recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.startTime, 'ms', {
          page: window.location.pathname,
        });

        recordMetric('first_byte_time', navigation.responseStart - navigation.requestStart, 'ms', {
          page: window.location.pathname,
        });
      }

      // Web Vitals approximation
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');
      if (fcp) {
        recordMetric('first_contentful_paint', fcp.startTime, 'ms', {
          page: window.location.pathname,
        });
      }
    }, 100);
  });
}

/**
 * Measure API call performance
 */
export function measureApiCall(
  endpoint: string,
  startTime: number,
  status: 'success' | 'error',
  statusCode?: number
): void {
  const duration = performance.now() - startTime;

  recordMetric('api_call_duration', duration, 'ms', {
    endpoint,
    status,
    statusCode: statusCode?.toString() || 'unknown',
  });

  recordAction('api_call', 'network', endpoint, statusCode);
}

/**
 * Track user engagement metrics
 */
export function trackEngagement(eventType: string, details?: Record<string, string>): void {
  recordAction(eventType, 'engagement', JSON.stringify(details));
}

/**
 * Flush metrics to monitoring endpoint
 */
async function flushMetrics(): Promise<void> {
  if (!config.enabled || !config.endpoint || metricsBuffer.length === 0) {
    metricsBuffer.length = 0;
    return;
  }

  const metrics = [...metricsBuffer];
  metricsBuffer.length = 0;

  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metrics', data: metrics }),
    });
  } catch (error) {
    console.error('[Monitoring] Failed to flush metrics:', error);
    // Re-add failed metrics to buffer (limited to prevent memory issues)
    if (metricsBuffer.length < config.batchSize * 3) {
      metricsBuffer.push(...metrics);
    }
  }
}

/**
 * Flush user actions to monitoring endpoint
 */
async function flushActions(): Promise<void> {
  if (!config.enabled || !config.endpoint || actionsBuffer.length === 0) {
    actionsBuffer.length = 0;
    return;
  }

  const actions = [...actionsBuffer];
  actionsBuffer.length = 0;

  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'actions', data: actions }),
    });
  } catch (error) {
    console.error('[Monitoring] Failed to flush actions:', error);
    if (actionsBuffer.length < config.batchSize * 3) {
      actionsBuffer.push(...actions);
    }
  }
}

/**
 * Initialize monitoring
 */
export function initMonitoring(): void {
  // Measure page load performance
  measurePageLoad();

  // Set up periodic flush
  if (config.enabled && config.endpoint) {
    setInterval(() => {
      flushMetrics();
      flushActions();
    }, config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      flushMetrics();
      flushActions();
    });
  }

  console.info('[Monitoring] Initialized', {
    enabled: config.enabled,
    hasEndpoint: !!config.endpoint,
  });
}

// Export monitoring utilities
export default {
  init: initMonitoring,
  metric: recordMetric,
  action: recordAction,
  apiCall: measureApiCall,
  engagement: trackEngagement,
};
