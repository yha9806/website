import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectDevicePerformance,
  shouldUseGlassEffect,
  shouldUseAnimations,
  getBlurClass,
  resetPerformanceCache,
} from '../../utils/devicePerformance'

describe('devicePerformance', () => {
  // Store original values
  const originalNavigator = globalThis.navigator
  const originalWindow = globalThis.window

  beforeEach(() => {
    // Reset the module-level cache before each test
    resetPerformanceCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetPerformanceCache()
  })

  describe('detectDevicePerformance', () => {
    it('should return "medium" when window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined)
      vi.stubGlobal('navigator', undefined)

      expect(detectDevicePerformance()).toBe('medium')
    })

    it('should return "low" when prefers-reduced-motion is set', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: true }),
      })

      expect(detectDevicePerformance()).toBe('low')
    })

    it('should return "low" for devices with < 4 cores', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(detectDevicePerformance()).toBe('low')
    })

    it('should return "low" for devices with < 4GB memory', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 8,
        deviceMemory: 2,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(detectDevicePerformance()).toBe('low')
    })

    it('should return "medium" for devices with < 8 cores', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 4,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(detectDevicePerformance()).toBe('medium')
    })

    it('should return "medium" for devices with < 8GB memory', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 4,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(detectDevicePerformance()).toBe('medium')
    })

    it('should return "high" for devices with >= 8 cores and >= 8GB memory', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(detectDevicePerformance()).toBe('high')
    })

    it('should return "high" when deviceMemory is unavailable but cores >= 8', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 8,
        // deviceMemory is undefined (e.g. Firefox/Safari)
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(detectDevicePerformance()).toBe('high')
    })

    it('should cache the result on subsequent calls', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      const matchMediaMock = vi.fn().mockReturnValue({ matches: false })
      vi.stubGlobal('window', { matchMedia: matchMediaMock })

      const first = detectDevicePerformance()
      const second = detectDevicePerformance()

      expect(first).toBe(second)
      // matchMedia should only be called once due to caching
      expect(matchMediaMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('shouldUseGlassEffect', () => {
    it('should return true for high performance devices', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(shouldUseGlassEffect()).toBe(true)
    })

    it('should return true for medium performance devices', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 4,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(shouldUseGlassEffect()).toBe(true)
    })

    it('should return false for low performance devices', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(shouldUseGlassEffect()).toBe(false)
    })
  })

  describe('shouldUseAnimations', () => {
    it('should return true only for high performance devices', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(shouldUseAnimations()).toBe(true)
    })

    it('should return false for medium performance devices', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 4,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(shouldUseAnimations()).toBe(false)
    })

    it('should return false for low performance devices', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(shouldUseAnimations()).toBe(false)
    })
  })

  describe('getBlurClass', () => {
    it('should return solid background for low performance', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      const result = getBlurClass()
      expect(result).toBe('bg-white/90 dark:bg-gray-900/90')
      expect(result).not.toContain('backdrop-blur')
    })

    it('should return reduced blur for medium performance', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 4,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      const result = getBlurClass()
      expect(result).toContain('backdrop-blur-sm')
      expect(result).toContain('bg-white/80')
    })

    it('should return full blur-md for high performance with default intensity', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      const result = getBlurClass()
      expect(result).toContain('backdrop-blur-md')
      expect(result).toContain('bg-white/72')
    })

    it('should respect intensity parameter on high performance', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(getBlurClass('sm')).toContain('backdrop-blur-sm')

      resetPerformanceCache()
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      expect(getBlurClass('lg')).toContain('backdrop-blur-lg')
    })

    it('should ignore intensity parameter on low performance', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })

      const result = getBlurClass('lg')
      expect(result).not.toContain('backdrop-blur')
      expect(result).toBe('bg-white/90 dark:bg-gray-900/90')
    })
  })

  describe('resetPerformanceCache', () => {
    it('should allow re-detection after reset', () => {
      // First detection: low
      vi.stubGlobal('navigator', { hardwareConcurrency: 2 })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })
      expect(detectDevicePerformance()).toBe('low')

      // Reset and change hardware
      resetPerformanceCache()
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 16,
        deviceMemory: 16,
      })
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      })
      expect(detectDevicePerformance()).toBe('high')
    })
  })
})
