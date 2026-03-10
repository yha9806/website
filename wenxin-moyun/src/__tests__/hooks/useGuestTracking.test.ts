import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock storageUtils before importing the hook
const mockGetItem = vi.fn<(key: string) => string | null>()
const mockSetItem = vi.fn()

vi.mock('../../utils/storageUtils', () => ({
  getItem: (...args: unknown[]) => mockGetItem(args[0] as string),
  setItem: (...args: unknown[]) => mockSetItem(args[0], args[1]),
}))

// Mock guestSession
const mockGetGuestSession = vi.fn()

vi.mock('../../utils/guestSession', () => ({
  getGuestSession: () => mockGetGuestSession(),
}))

// Import hook after mocks are set up
import { useGuestTracking } from '../../hooks/useGuestTracking'

describe('useGuestTracking', () => {
  let onTrigger: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    onTrigger = vi.fn()

    // Default: guest mode (no access_token)
    mockGetItem.mockReturnValue(null)

    // Default guest session
    mockGetGuestSession.mockReturnValue({
      id: 'test-session-id',
      dailyUsage: 0,
      lastReset: new Date().toDateString(),
      evaluations: [],
      createdAt: new Date().toISOString(),
    })

    // Mock crypto.randomUUID
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '12345678-1234-4234-8234-123456789abc'
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // --- Initialization ---

  it('should return trackEvaluation and trackQualityInteraction functions', () => {
    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    expect(typeof result.current.trackEvaluation).toBe('function')
    expect(typeof result.current.trackQualityInteraction).toBe('function')
  })

  it('should not set up session timer for authenticated users', () => {
    // Simulate authenticated user
    mockGetItem.mockImplementation((key: string) =>
      key === 'access_token' ? 'valid-token' : null
    )

    renderHook(() => useGuestTracking({ onTrigger }))

    // Advance past the 10-minute threshold
    vi.advanceTimersByTime(11 * 60 * 1000)

    expect(onTrigger).not.toHaveBeenCalled()
  })

  // --- Extended use trigger ---

  it('should trigger extended_use after 10 minutes for guests', () => {
    renderHook(() => useGuestTracking({ onTrigger }))

    // 9 minutes – should not trigger yet
    vi.advanceTimersByTime(9 * 60 * 1000)
    expect(onTrigger).not.toHaveBeenCalledWith('extended_use')

    // 10+ minutes – should trigger
    vi.advanceTimersByTime(2 * 60 * 1000)
    expect(onTrigger).toHaveBeenCalledWith('extended_use')
  })

  it('should only trigger extended_use once', () => {
    renderHook(() => useGuestTracking({ onTrigger }))

    // Pass 10 min threshold
    vi.advanceTimersByTime(11 * 60 * 1000)
    expect(onTrigger).toHaveBeenCalledTimes(1)

    // Wait more
    vi.advanceTimersByTime(5 * 60 * 1000)
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  // --- trackEvaluation ---

  it('should not track evaluations for authenticated users', () => {
    mockGetItem.mockImplementation((key: string) =>
      key === 'access_token' ? 'valid-token' : null
    )

    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    act(() => {
      result.current.trackEvaluation()
    })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('should trigger limit_reached when daily usage >= 3', () => {
    mockGetGuestSession.mockReturnValue({
      id: 'test-session-id',
      dailyUsage: 3,
      lastReset: new Date().toDateString(),
      evaluations: ['e1', 'e2', 'e3'],
      createdAt: new Date().toISOString(),
    })

    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    act(() => {
      result.current.trackEvaluation()
    })

    expect(onTrigger).toHaveBeenCalledWith('limit_reached')
  })

  it('should trigger save_progress after 2 evaluations', () => {
    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    // First evaluation – no save_progress yet
    act(() => {
      result.current.trackEvaluation()
    })
    expect(onTrigger).not.toHaveBeenCalledWith('save_progress')

    // Second evaluation – triggers save_progress after 2s delay
    act(() => {
      result.current.trackEvaluation()
    })

    // save_progress is delayed by 2000ms via setTimeout
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onTrigger).toHaveBeenCalledWith('save_progress')
  })

  it('should only trigger save_progress once', () => {
    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    // Trigger 3 evaluations (under daily limit)
    act(() => {
      result.current.trackEvaluation()
      result.current.trackEvaluation()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    const saveProgressCalls = onTrigger.mock.calls.filter(
      (args: string[]) => args[0] === 'save_progress'
    )
    expect(saveProgressCalls).toHaveLength(1)

    // Third evaluation should not trigger save_progress again
    act(() => {
      result.current.trackEvaluation()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    const saveProgressCalls2 = onTrigger.mock.calls.filter(
      (args: string[]) => args[0] === 'save_progress'
    )
    expect(saveProgressCalls2).toHaveLength(1)
  })

  it('should update session evaluations in storage', () => {
    const evaluations: string[] = []
    mockGetGuestSession.mockReturnValue({
      id: 'test-session-id',
      dailyUsage: 0,
      lastReset: new Date().toDateString(),
      evaluations,
      createdAt: new Date().toISOString(),
    })

    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    act(() => {
      result.current.trackEvaluation()
    })

    // Should have pushed a UUID into evaluations array
    expect(evaluations.length).toBe(1)
    // Should have called setItem to persist the session
    expect(mockSetItem).toHaveBeenCalledWith(
      'guestSession',
      expect.any(String)
    )
  })

  // --- trackQualityInteraction ---

  it('should not track quality interaction for authenticated users', () => {
    mockGetItem.mockImplementation((key: string) =>
      key === 'access_token' ? 'valid-token' : null
    )

    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    act(() => {
      result.current.trackQualityInteraction()
    })

    // Even after timeout, should not trigger
    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(onTrigger).not.toHaveBeenCalledWith('quality_feedback')
  })

  it('should trigger quality_feedback after 5 second delay', () => {
    const { result } = renderHook(() =>
      useGuestTracking({ onTrigger })
    )

    act(() => {
      result.current.trackQualityInteraction()
    })

    // Not yet triggered
    expect(onTrigger).not.toHaveBeenCalledWith('quality_feedback')

    // After 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(onTrigger).toHaveBeenCalledWith('quality_feedback')
  })

  // --- Cleanup ---

  it('should clean up interval on unmount', () => {
    const { unmount } = renderHook(() =>
      useGuestTracking({ onTrigger: onTrigger as (trigger: string) => void })
    )

    unmount()

    // After unmount, advancing timers should not cause triggers
    vi.advanceTimersByTime(15 * 60 * 1000)
    expect(onTrigger).not.toHaveBeenCalled()
  })
})
