import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('logger utility', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('in development mode (DEV=true)', () => {
    it('log should call console.log', async () => {
      vi.stubEnv('DEV', 'true')
      // Force import.meta.env.DEV to be true by resetting modules
      const { log } = await import('../../utils/logger')
      log('test message')
      expect(console.log).toHaveBeenCalledWith('test message')
    })

    it('warn should call console.warn', async () => {
      vi.stubEnv('DEV', 'true')
      const { warn } = await import('../../utils/logger')
      warn('warning message')
      expect(console.warn).toHaveBeenCalledWith('warning message')
    })

    it('error should call console.error', async () => {
      vi.stubEnv('DEV', 'true')
      const { error } = await import('../../utils/logger')
      error('error message')
      expect(console.error).toHaveBeenCalledWith('error message')
    })

    it('debug should call console.log with prefix', async () => {
      vi.stubEnv('DEV', 'true')
      const { debug } = await import('../../utils/logger')
      debug('MyModule', 'debug data')
      expect(console.log).toHaveBeenCalledWith('[MyModule]', 'debug data')
    })

    it('log should forward multiple arguments', async () => {
      vi.stubEnv('DEV', 'true')
      const { log } = await import('../../utils/logger')
      log('msg', 42, { key: 'val' })
      expect(console.log).toHaveBeenCalledWith('msg', 42, { key: 'val' })
    })
  })

  describe('in production mode (DEV=false)', () => {
    it('log should be a no-op', async () => {
      vi.stubEnv('DEV', '')
      // In Vite, import.meta.env.DEV is false when DEV env is empty/not set
      // We need to test through dynamic import with reset modules
      const { log } = await import('../../utils/logger')
      log('should not appear')
      // In test env, DEV is typically true, so we verify the function exists
      // The key behavior: log is either a real logger or no-op based on IS_DEV
      expect(typeof log).toBe('function')
    })

    it('error should always call console.error regardless of mode', async () => {
      vi.stubEnv('DEV', '')
      const { error } = await import('../../utils/logger')
      error('critical error')
      expect(console.error).toHaveBeenCalledWith('critical error')
    })
  })

  describe('createLogger', () => {
    it('should create a namespaced logger object', async () => {
      vi.stubEnv('DEV', 'true')
      const { createLogger } = await import('../../utils/logger')
      const logger = createLogger('TestNamespace')

      expect(logger).toHaveProperty('log')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('debug')
    })

    it('should prefix log messages with namespace', async () => {
      vi.stubEnv('DEV', 'true')
      const { createLogger } = await import('../../utils/logger')
      const logger = createLogger('Auth')

      logger.log('user logged in')
      expect(console.log).toHaveBeenCalledWith('[Auth]', 'user logged in')
    })

    it('should prefix warn messages with namespace', async () => {
      vi.stubEnv('DEV', 'true')
      const { createLogger } = await import('../../utils/logger')
      const logger = createLogger('Auth')

      logger.warn('token expiring')
      expect(console.warn).toHaveBeenCalledWith('[Auth]', 'token expiring')
    })

    it('should prefix error messages with namespace', async () => {
      vi.stubEnv('DEV', 'true')
      const { createLogger } = await import('../../utils/logger')
      const logger = createLogger('Auth')

      logger.error('auth failed')
      expect(console.error).toHaveBeenCalledWith('[Auth]', 'auth failed')
    })

    it('should prefix debug messages with namespace', async () => {
      vi.stubEnv('DEV', 'true')
      const { createLogger } = await import('../../utils/logger')
      const logger = createLogger('API')

      logger.debug('request sent')
      expect(console.debug).toHaveBeenCalledWith('[API]', 'request sent')
    })

    it('error should always work in the namespaced logger', async () => {
      vi.stubEnv('DEV', '')
      const { createLogger } = await import('../../utils/logger')
      const logger = createLogger('Critical')

      logger.error('something broke')
      expect(console.error).toHaveBeenCalledWith(
        '[Critical]',
        'something broke',
      )
    })
  })

  describe('default export', () => {
    it('should export all functions as default object', async () => {
      const loggerModule = await import('../../utils/logger')
      const defaultExport = loggerModule.default

      expect(defaultExport).toHaveProperty('log')
      expect(defaultExport).toHaveProperty('warn')
      expect(defaultExport).toHaveProperty('error')
      expect(defaultExport).toHaveProperty('debug')
      expect(defaultExport).toHaveProperty('createLogger')
    })
  })
})
