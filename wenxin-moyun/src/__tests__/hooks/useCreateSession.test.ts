import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCreateSession } from '../../hooks/useCreateSession'

// Mock API_PREFIX
vi.mock('../../config/api', () => ({
  API_PREFIX: 'http://localhost:8001/api/v1',
}))

describe('useCreateSession', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.restoreAllMocks()
  })

  // --- Initial State ---

  it('should have idle initial state', () => {
    const { result } = renderHook(() => useCreateSession())

    expect(result.current.mode).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.sessionId).toBeNull()
    expect(result.current.result).toBeNull()
    expect(result.current.events).toEqual([])
    expect(result.current.bestCandidateId).toBeNull()
    expect(result.current.bestImageUrl).toBeNull()
    expect(result.current.totalRounds).toBe(0)
  })

  it('should expose create and reset functions', () => {
    const { result } = renderHook(() => useCreateSession())

    expect(typeof result.current.create).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  // --- Create Mode (no image) ---

  it('should transition to loading state when create is called', async () => {
    // Never resolve the fetch so we can observe the loading state
    fetchSpy.mockImplementation(
      () => new Promise<Response>(() => {}),
    )

    const { result } = renderHook(() => useCreateSession())

    act(() => {
      result.current.create('ink wash landscape')
    })

    // After calling create, isLoading should be true
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
      expect(result.current.mode).toBe('create')
    })
  })

  it('should handle successful create mode response', async () => {
    const mockResponse = {
      session_id: 'sess-123',
      mode: 'create',
      best_candidate_id: 'cand-1',
      best_image_url: 'https://example.com/image.png',
      total_rounds: 3,
    }

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const { result } = renderHook(() => useCreateSession())

    await act(async () => {
      await result.current.create('ink wash landscape')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.mode).toBe('create')
    expect(result.current.sessionId).toBe('sess-123')
    expect(result.current.bestCandidateId).toBe('cand-1')
    expect(result.current.bestImageUrl).toBe('https://example.com/image.png')
    expect(result.current.totalRounds).toBe(3)
    expect(result.current.error).toBeNull()
  })

  it('should handle successful evaluate mode response', async () => {
    const mockResponse = {
      session_id: 'sess-456',
      mode: 'evaluate',
      scores: { L1: 8.5, L2: 7.0, L3: 9.0 },
      weighted_total: 8.2,
      summary: 'Strong cultural composition',
      risk_level: 'low',
      recommendations: ['Improve contrast', 'Add depth'],
      tradition: 'chinese_xieyi',
    }

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const { result } = renderHook(() => useCreateSession())

    // Simulate passing an image file to trigger evaluate mode
    const file = new File(['fake-image-data'], 'test.png', {
      type: 'image/png',
    })

    await act(async () => {
      await result.current.create('evaluate this', file, 'chinese_xieyi')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.mode).toBe('evaluate')
    expect(result.current.sessionId).toBe('sess-456')
    expect(result.current.result).not.toBeNull()
    expect(result.current.result!.score).toBe(8.2)
    expect(result.current.result!.summary).toBe('Strong cultural composition')
    expect(result.current.result!.riskLevel).toBe('low')
    expect(result.current.result!.recommendations).toEqual([
      'Improve contrast',
      'Add depth',
    ])
    expect(result.current.result!.traditionUsed).toBe('chinese_xieyi')
    expect(result.current.result!.dimensions).toHaveLength(3)
  })

  // --- Error Handling ---

  it('should handle HTTP error response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Invalid tradition' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const { result } = renderHook(() => useCreateSession())

    await act(async () => {
      await result.current.create('test')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Invalid tradition')
  })

  it('should handle network error', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useCreateSession())

    await act(async () => {
      await result.current.create('test')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Failed to fetch')
  })

  it('should handle HTTP error with non-JSON body', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    )

    const { result } = renderHook(() => useCreateSession())

    await act(async () => {
      await result.current.create('test')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeTruthy()
  })

  // --- Reset ---

  it('should reset state to initial values', async () => {
    // First trigger a successful create
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session_id: 'sess-789',
          mode: 'create',
          best_candidate_id: 'cand-2',
          best_image_url: 'https://example.com/img.png',
          total_rounds: 2,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => useCreateSession())

    await act(async () => {
      await result.current.create('test')
    })

    expect(result.current.sessionId).toBe('sess-789')

    // Now reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.mode).toBe('idle')
    expect(result.current.sessionId).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
    expect(result.current.bestCandidateId).toBeNull()
    expect(result.current.bestImageUrl).toBeNull()
    expect(result.current.totalRounds).toBe(0)
  })

  // --- Request Details ---

  it('should send correct request body for create mode', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ session_id: 's1', mode: 'create' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => useCreateSession())

    await act(async () => {
      await result.current.create('bamboo in mist', null, 'chinese_xieyi')
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('http://localhost:8001/api/v1/create')
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-key',
      },
    })

    const body = JSON.parse(options!.body as string)
    expect(body.intent).toBe('bamboo in mist')
    expect(body.tradition).toBe('chinese_xieyi')
    expect(body.stream).toBe(false)
    expect(body.image_base64).toBeUndefined()
  })

  it('should include base64 image when file is provided', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          session_id: 's2',
          mode: 'evaluate',
          scores: {},
          weighted_total: 5,
          summary: 'ok',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => useCreateSession())
    const file = new File(['hello'], 'test.png', { type: 'image/png' })

    await act(async () => {
      await result.current.create('evaluate', file)
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)
    expect(body.image_base64).toBeDefined()
    expect(typeof body.image_base64).toBe('string')
  })

  // --- Abort previous request ---

  it('should not set error when previous request is aborted', async () => {
    let resolveFirst: (value: Response) => void
    const firstPromise = new Promise<Response>((resolve) => {
      resolveFirst = resolve
    })

    fetchSpy.mockImplementationOnce(() => firstPromise)

    const { result } = renderHook(() => useCreateSession())

    // Start first request
    act(() => {
      result.current.create('first request')
    })

    // Start second request (should abort the first)
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ session_id: 's-second', mode: 'create' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await act(async () => {
      await result.current.create('second request')
    })

    // Resolve first request (should be ignored due to abort)
    resolveFirst!(
      new Response(
        JSON.stringify({ session_id: 's-first', mode: 'create' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    // The second request should have won
    expect(result.current.sessionId).toBe('s-second')
    expect(result.current.error).toBeNull()
  })
})
