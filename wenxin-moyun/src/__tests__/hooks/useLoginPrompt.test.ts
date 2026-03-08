import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock guestSession utilities — keep hasReachedDailyLimit false to avoid
// infinite re-render from the hook's useEffect + 0-cooldown limit_reached.
const mockHasReachedDailyLimit = vi.fn(() => false)
const mockGetRemainingUsage = vi.fn(() => 3)
const mockIsGuestMode = vi.fn(() => true)

vi.mock('../../utils/guestSession', () => ({
  hasReachedDailyLimit: (...args: unknown[]) => mockHasReachedDailyLimit(...args),
  getRemainingUsage: (...args: unknown[]) => mockGetRemainingUsage(...args),
  isGuestMode: (...args: unknown[]) => mockIsGuestMode(...args),
}))

// Mock storageUtils
const mockStorage: Record<string, string> = {}
const mockSetItem = vi.fn((key: string, value: string) => {
  mockStorage[key] = value
})

vi.mock('../../utils/storageUtils', () => ({
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: (...args: unknown[]) => mockSetItem(...(args as [string, string])),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key]
  }),
}))

// Import after mocks are set up
import { useLoginPrompt } from '../../hooks/useLoginPrompt'

describe('useLoginPrompt', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    vi.clearAllMocks()
    mockHasReachedDailyLimit.mockReturnValue(false)
    mockGetRemainingUsage.mockReturnValue(3)
    mockIsGuestMode.mockReturnValue(true)
  })

  // --- Initial State ---

  it('should have correct initial state for guest user', () => {
    const { result } = renderHook(() => useLoginPrompt())

    expect(result.current.isPromptOpen).toBe(false)
    expect(result.current.isGuestMode).toBe(true)
    expect(result.current.remainingUsage).toBe(3)
    expect(typeof result.current.showPrompt).toBe('function')
    expect(typeof result.current.hidePrompt).toBe('function')
    expect(typeof result.current.canShowPrompt).toBe('function')
  })

  it('should expose smart trigger functions', () => {
    const { result } = renderHook(() => useLoginPrompt())

    expect(typeof result.current.checkLimitReached).toBe('function')
    expect(typeof result.current.checkSaveProgress).toBe('function')
    expect(typeof result.current.checkShareResult).toBe('function')
    expect(typeof result.current.checkAdvancedFeatures).toBe('function')
    expect(typeof result.current.checkSmartPrompt).toBe('function')
  })

  // --- Show / Hide Prompt ---

  it('should open prompt when showPrompt is called', () => {
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      result.current.showPrompt('save_progress')
    })

    expect(result.current.isPromptOpen).toBe(true)
    expect(result.current.promptTrigger).toBe('save_progress')
  })

  it('should close prompt when hidePrompt is called', () => {
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      result.current.showPrompt('save_progress')
    })
    expect(result.current.isPromptOpen).toBe(true)

    act(() => {
      result.current.hidePrompt()
    })
    expect(result.current.isPromptOpen).toBe(false)
  })

  // --- canShowPrompt ---

  it('should allow showing prompt for guest user', () => {
    const { result } = renderHook(() => useLoginPrompt())

    expect(result.current.canShowPrompt('share_result')).toBe(true)
  })

  it('should not show prompt for authenticated user', () => {
    mockIsGuestMode.mockReturnValue(false)
    const { result } = renderHook(() => useLoginPrompt())

    expect(result.current.canShowPrompt('save_progress')).toBe(false)
  })

  // --- Smart Triggers ---

  it('checkSaveProgress should not trigger for < 2 evaluations', () => {
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      const triggered = result.current.checkSaveProgress(1)
      expect(triggered).toBe(false)
    })
    expect(result.current.isPromptOpen).toBe(false)
  })

  it('checkSaveProgress should trigger after 2+ evaluations', () => {
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      const triggered = result.current.checkSaveProgress(2)
      expect(triggered).toBe(true)
    })

    expect(result.current.isPromptOpen).toBe(true)
    expect(result.current.promptTrigger).toBe('save_progress')
  })

  it('checkLimitReached should not trigger when limit is not reached', () => {
    mockHasReachedDailyLimit.mockReturnValue(false)
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      const triggered = result.current.checkLimitReached()
      expect(triggered).toBe(false)
    })

    expect(result.current.isPromptOpen).toBe(false)
  })

  // --- Cooldown ---

  it('should respect cooldown for non-limit triggers', () => {
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      result.current.showPrompt('save_progress')
    })
    expect(result.current.isPromptOpen).toBe(true)

    act(() => {
      result.current.hidePrompt()
    })

    // Second call should be blocked by cooldown (5 minutes for save_progress)
    act(() => {
      const shown = result.current.showPrompt('save_progress')
      expect(shown).toBe(false)
    })
  })

  // --- State Persistence ---

  it('should persist state to storage', () => {
    const { result } = renderHook(() => useLoginPrompt())

    act(() => {
      result.current.showPrompt('share_result')
    })

    expect(mockSetItem).toHaveBeenCalled()
    const lastCall = mockSetItem.mock.calls.at(-1)
    expect(lastCall?.[0]).toBe('wenxin_login_prompt_state')
    expect(lastCall?.[1]).toContain('"isOpen":true')
  })
})
