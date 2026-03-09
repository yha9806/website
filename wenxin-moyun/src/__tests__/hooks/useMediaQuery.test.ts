import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery, useBreakpoint } from '../../hooks/useMediaQuery'

// Helper to create a mock MediaQueryList
function createMockMediaQueryList(matches: boolean) {
  const listeners: Array<(event: MediaQueryListEvent) => void> = []
  return {
    matches,
    media: '',
    onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null,
    addEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') listeners.push(listener)
    }),
    removeEventListener: vi.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const idx = listeners.indexOf(listener)
        if (idx >= 0) listeners.splice(idx, 1)
      }
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    // Expose listeners for test simulation
    _listeners: listeners,
    _fireChange(newMatches: boolean) {
      this.matches = newMatches
      listeners.forEach((fn) =>
        fn({ matches: newMatches } as MediaQueryListEvent)
      )
    },
  }
}

// jsdom does not implement window.matchMedia, so we define it before tests
const originalMatchMedia = window.matchMedia

describe('useMediaQuery', () => {
  let mockMql: ReturnType<typeof createMockMediaQueryList>
  let mockMatchMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockMql = createMockMediaQueryList(false)
    mockMatchMedia = vi.fn(() => mockMql as unknown as MediaQueryList)
    window.matchMedia = mockMatchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  // --- Initial matching state ---

  it('should return true when media query matches', () => {
    mockMql.matches = true

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(true)
    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 768px)')
  })

  it('should return false when media query does not match', () => {
    mockMql.matches = false

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(false)
  })

  // --- Dynamic change ---

  it('should update when media query match changes', () => {
    mockMql.matches = false

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))

    expect(result.current).toBe(false)

    // Simulate a resize that matches the query
    act(() => {
      mockMql._fireChange(true)
    })

    expect(result.current).toBe(true)

    // Simulate a resize that no longer matches
    act(() => {
      mockMql._fireChange(false)
    })

    expect(result.current).toBe(false)
  })

  // --- Event listener registration ---

  it('should register and unregister change listener', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 640px)'))

    expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  // --- Re-render with different query ---

  it('should re-subscribe when query string changes', () => {
    const { rerender } = renderHook(
      ({ query }: { query: string }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 640px)' } }
    )

    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 640px)')

    // Change the query -- useEffect cleanup + re-run
    rerender({ query: '(min-width: 1024px)' })

    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)')
  })

  // --- Fallback for older browsers (addListener/removeListener) ---

  it('should use addListener/removeListener fallback when addEventListener is not available', () => {
    // Remove modern API
    const legacyMql = {
      matches: true,
      media: '',
      onchange: null,
      addEventListener: undefined as unknown,
      removeEventListener: undefined as unknown,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }

    mockMatchMedia.mockReturnValue(legacyMql as unknown as MediaQueryList)

    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))

    expect(result.current).toBe(true)
    expect(legacyMql.addListener).toHaveBeenCalledWith(expect.any(Function))

    unmount()

    expect(legacyMql.removeListener).toHaveBeenCalledWith(expect.any(Function))
  })
})

describe('useBreakpoint', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('should report mobile when width < 768px', () => {
    // All breakpoints return false (narrow viewport)
    window.matchMedia = vi.fn(
      () => createMockMediaQueryList(false) as unknown as MediaQueryList
    )

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('should report desktop when width >= 1024px', () => {
    // Match md (768) and lg (1024)
    window.matchMedia = vi.fn((query: string) => {
      const width = parseInt(query.match(/\d+/)?.[0] || '0')
      return createMockMediaQueryList(width <= 1024) as unknown as MediaQueryList
    })

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
  })

  it('should report tablet when 768 <= width < 1024', () => {
    window.matchMedia = vi.fn((query: string) => {
      const width = parseInt(query.match(/\d+/)?.[0] || '0')
      // Match up to 768 but not 1024
      return createMockMediaQueryList(width <= 768) as unknown as MediaQueryList
    })

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current.isMd).toBe(true)
    expect(result.current.isLg).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })
})
