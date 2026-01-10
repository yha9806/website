/**
 * Device Performance Detection Utility
 *
 * Detects device capabilities to optimize visual effects
 * - Low-end devices: Disable backdrop-filter, animations
 * - Medium devices: Reduced effects
 * - High-end devices: Full glass morphism
 */

export type PerformanceLevel = 'high' | 'medium' | 'low';

// Cache the detection result
let cachedPerformance: PerformanceLevel | null = null;

/**
 * Detect device performance level based on hardware capabilities
 */
export function detectDevicePerformance(): PerformanceLevel {
  // Return cached result if available
  if (cachedPerformance !== null) {
    return cachedPerformance;
  }

  // SSR safety check
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    cachedPerformance = 'medium';
    return cachedPerformance;
  }

  // Get device memory (Chrome/Edge only, in GB)
  const memory = (navigator as NavigatorWithDeviceMemory).deviceMemory;

  // Get logical CPU cores
  const cores = navigator.hardwareConcurrency;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If user prefers reduced motion, treat as low performance
  if (prefersReducedMotion) {
    cachedPerformance = 'low';
    return cachedPerformance;
  }

  // Low-end device detection
  if ((memory && memory < 4) || (cores && cores < 4)) {
    cachedPerformance = 'low';
    return cachedPerformance;
  }

  // Medium device detection
  if ((memory && memory < 8) || (cores && cores < 8)) {
    cachedPerformance = 'medium';
    return cachedPerformance;
  }

  // High-end device
  cachedPerformance = 'high';
  return cachedPerformance;
}

/**
 * Check if glass morphism effects should be enabled
 */
export function shouldUseGlassEffect(): boolean {
  const performance = detectDevicePerformance();
  return performance !== 'low';
}

/**
 * Check if complex animations should be enabled
 */
export function shouldUseAnimations(): boolean {
  const performance = detectDevicePerformance();
  return performance === 'high';
}

/**
 * Get appropriate blur class based on device performance
 */
export function getBlurClass(intensity: 'sm' | 'md' | 'lg' = 'md'): string {
  const performance = detectDevicePerformance();

  if (performance === 'low') {
    // No blur, use solid background with transparency
    return 'bg-white/90 dark:bg-gray-900/90';
  }

  if (performance === 'medium') {
    // Reduced blur
    return `backdrop-blur-sm bg-white/80 dark:bg-gray-900/80`;
  }

  // Full blur effect
  const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  };

  return `${blurMap[intensity]} bg-white/72 dark:bg-gray-900/72`;
}

/**
 * Reset cached performance (useful for testing)
 */
export function resetPerformanceCache(): void {
  cachedPerformance = null;
}

// Type extension for navigator.deviceMemory
interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}
