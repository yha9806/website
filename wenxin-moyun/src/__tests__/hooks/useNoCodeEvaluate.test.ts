import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoCodeEvaluate } from '../../hooks/useNoCodeEvaluate'

// Mock API_PREFIX
vi.mock('../../config/api', () => ({
  API_PREFIX: 'http://localhost:8001/api/v1',
}))

describe('useNoCodeEvaluate', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.restoreAllMocks()
  })

  // --- Initial State ---

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useNoCodeEvaluate())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.skillsUsed).toEqual([])
    expect(typeof result.current.evaluate).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  // --- Evaluate: loading state ---

  it('should set isLoading during request', async () => {
    // Never resolve so we can observe loading state
    fetchSpy.mockImplementation(
      () => new Promise<Response>(() => {})
    )

    const { result } = renderHook(() => useNoCodeEvaluate())

    act(() => {
      result.current.evaluate('Check for Japanese market')
    })

    // isLoading is set synchronously inside the callback
    expect(result.current.isLoading).toBe(true)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // --- Successful evaluate ---

  it('should set result on successful evaluate', async () => {
    const apiResponse = {
      result_card: {
        score: 8.5,
        summary: 'Strong composition',
        risk_level: 'low',
        dimensions: { L1: 9.0, L2: 7.5 },
        recommendations: ['Improve contrast'],
        tradition_used: 'japanese_ukiyoe',
      },
      skills_used: ['cultural_context', 'visual_analysis'],
    }

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => useNoCodeEvaluate())

    await act(async () => {
      await result.current.evaluate('Check cultural alignment')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.result).not.toBeNull()
    expect(result.current.result!.score).toBe(8.5)
    expect(result.current.result!.summary).toBe('Strong composition')
    expect(result.current.result!.riskLevel).toBe('low')
    expect(result.current.result!.traditionUsed).toBe('japanese_ukiyoe')
    expect(result.current.result!.recommendations).toEqual(['Improve contrast'])
    expect(result.current.result!.dimensions.length).toBe(2)
    expect(result.current.skillsUsed).toEqual(['cultural_context', 'visual_analysis'])
  })

  // --- Failed evaluate ---

  it('should set error on failed evaluate', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Model unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const { result } = renderHook(() => useNoCodeEvaluate())

    await act(async () => {
      await result.current.evaluate('test intent')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBe('Model unavailable')
  })

  it('should set error on network failure', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useNoCodeEvaluate())

    await act(async () => {
      await result.current.evaluate('test intent')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Network error')
  })

  // --- Reset ---

  it('should reset clears result and error', async () => {
    // First trigger a successful evaluate
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result_card: {
            score: 7.0,
            summary: 'ok',
            risk_level: 'medium',
            dimensions: {},
            recommendations: [],
          },
          skills_used: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const { result } = renderHook(() => useNoCodeEvaluate())

    await act(async () => {
      await result.current.evaluate('test')
    })

    expect(result.current.result).not.toBeNull()

    // Now reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.skillsUsed).toEqual([])
  })

  // --- Request details ---

  it('should send correct request with default image URL when no image provided', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result_card: { score: 5, summary: '', risk_level: 'low', dimensions: {}, recommendations: [] },
          skills_used: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const { result } = renderHook(() => useNoCodeEvaluate())

    await act(async () => {
      await result.current.evaluate('check this')
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('http://localhost:8001/api/v1/evaluate/nocode')
    expect(options).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo-key',
      },
    })

    const body = JSON.parse(options!.body as string)
    expect(body.intent).toBe('check this')
    // When no image provided, a default image_url is used
    expect(body.image_url).toBeDefined()
  })
})
