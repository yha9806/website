import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePrototypePipeline } from '../../hooks/usePrototypePipeline'

// Mock API_PREFIX
vi.mock('../../config/api', () => ({
  API_PREFIX: 'http://localhost:8001/api/v1',
}))

describe('usePrototypePipeline', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>
  let originalEventSource: typeof EventSource

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
    // Save original EventSource
    originalEventSource = globalThis.EventSource
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.restoreAllMocks()
    // Restore EventSource
    globalThis.EventSource = originalEventSource
  })

  // --- Initial State ---

  it('should have status idle initially', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.status).toBe('idle')
  })

  it('should have initial candidates array empty', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.candidates).toEqual([])
  })

  it('should have initial events array empty', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.events).toEqual([])
  })

  it('should have initial taskId as null', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.taskId).toBeNull()
  })

  it('should have initial error as null', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.error).toBeNull()
  })

  it('should have initial scoredCandidates empty', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.scoredCandidates).toEqual([])
  })

  it('should have initial rounds empty', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.rounds).toEqual([])
  })

  it('should have initial decision as null', () => {
    const { result } = renderHook(() => usePrototypePipeline())
    expect(result.current.state.decision).toBeNull()
  })

  // --- startRun transitions ---

  it('should transition to status running when startRun is called', async () => {
    // Mock EventSource as a class that stores event handlers but does not fire them
    class MockEventSource {
      onmessage: ((ev: any) => void) | null = null
      onerror: ((ev: any) => void) | null = null
      close = vi.fn()
      constructor(_url: string) {}
    }
    globalThis.EventSource = MockEventSource as any

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ task_id: 'task-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => usePrototypePipeline())

    await act(async () => {
      await result.current.startRun({ subject: 'test', tradition: 'default' })
    })

    expect(result.current.state.status).toBe('running')
    expect(result.current.state.taskId).toBe('task-123')
  })

  // --- Error from API ---

  it('should handle error from API', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'API_KEY not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => usePrototypePipeline())

    await act(async () => {
      await result.current.startRun({ subject: 'test', tradition: 'default' })
    })

    expect(result.current.state.status).toBe('failed')
    expect(result.current.state.error).toContain('API_KEY')
  })

  it('should handle 429 rate limit error', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Rate limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => usePrototypePipeline())

    await act(async () => {
      await result.current.startRun({ subject: 'test', tradition: 'default' })
    })

    expect(result.current.state.status).toBe('failed')
    expect(result.current.state.error).toContain('Daily run limit')
  })

  it('should handle network error (fetch throws)', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => usePrototypePipeline())

    await act(async () => {
      await result.current.startRun({ subject: 'test', tradition: 'default' })
    })

    expect(result.current.state.status).toBe('failed')
    expect(result.current.state.error).toContain('Cannot reach server')
  })

  // --- Reset ---

  it('should reset to idle state', async () => {
    // Set up a successful start first with a class-based mock
    let mockESInstance: any = null
    class MockEventSource {
      onmessage: ((ev: any) => void) | null = null
      onerror: ((ev: any) => void) | null = null
      close = vi.fn()
      constructor(_url: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockESInstance = this
      }
    }
    globalThis.EventSource = MockEventSource as any

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ task_id: 'task-456' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => usePrototypePipeline())

    await act(async () => {
      await result.current.startRun({ subject: 'test', tradition: 'default' })
    })

    expect(result.current.state.taskId).toBe('task-456')

    // Now reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.taskId).toBeNull()
    expect(result.current.state.candidates).toEqual([])
    expect(result.current.state.events).toEqual([])
    expect(result.current.state.error).toBeNull()
    expect(mockESInstance!.close).toHaveBeenCalled()
  })

  // --- Expose functions ---

  it('should expose startRun, submitAction, and reset functions', () => {
    const { result } = renderHook(() => usePrototypePipeline())

    expect(typeof result.current.startRun).toBe('function')
    expect(typeof result.current.submitAction).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })
})
