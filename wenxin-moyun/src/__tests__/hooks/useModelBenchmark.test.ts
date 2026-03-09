import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock the apiClient module
const mockGet = vi.fn()

vi.mock('../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import { useModelBenchmark } from '../../hooks/useModelBenchmark'

const MOCK_BENCHMARK_DATA = {
  timestamp: '2025-01-15T10:30:00Z',
  test_count: 10,
  success_count: 8,
  detailed_scores: [
    {
      dimension: 'creativity',
      test_id: 'test-001',
      prompt: 'Generate a haiku',
      response: 'Autumn leaves falling',
      score: 8.5,
      analysis: {
        strengths: ['Vivid imagery'],
        weaknesses: ['Lacks depth'],
        suggestions: ['Add cultural context'],
        highlights: ['falling'],
      },
      response_time: 1.2,
      tokens_used: 45,
    },
  ],
}

describe('useModelBenchmark', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Initial state ---

  it('should have correct initial state when no modelId is provided', () => {
    const { result } = renderHook(() => useModelBenchmark())

    expect(result.current.benchmarkData).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should not fetch when modelId is undefined', () => {
    renderHook(() => useModelBenchmark(undefined))

    expect(mockGet).not.toHaveBeenCalled()
  })

  // --- Loading state ---

  it('should set loading to true during fetch', async () => {
    // Never resolve to observe loading state
    mockGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useModelBenchmark('model-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })
  })

  // --- Successful fetch with benchmark_results object ---

  it('should load benchmark data successfully', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        id: 'model-1',
        name: 'GPT-4',
        benchmark_results: MOCK_BENCHMARK_DATA,
      },
    })

    const { result } = renderHook(() => useModelBenchmark('model-1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.benchmarkData).toEqual(MOCK_BENCHMARK_DATA)
    expect(result.current.error).toBeNull()
    expect(mockGet).toHaveBeenCalledWith('/models/model-1')
  })

  // --- Successful fetch with benchmark_results as JSON string ---

  it('should parse benchmark_results when it is a JSON string', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        id: 'model-2',
        name: 'Claude',
        benchmark_results: JSON.stringify(MOCK_BENCHMARK_DATA),
      },
    })

    const { result } = renderHook(() => useModelBenchmark('model-2'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.benchmarkData).toEqual(MOCK_BENCHMARK_DATA)
    expect(result.current.error).toBeNull()
  })

  // --- No benchmark data ---

  it('should set benchmarkData to null when response has no benchmark_results', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        id: 'model-3',
        name: 'Llama',
        benchmark_results: null,
      },
    })

    const { result } = renderHook(() => useModelBenchmark('model-3'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.benchmarkData).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should set benchmarkData to null when response data is empty', async () => {
    mockGet.mockResolvedValueOnce({ data: null })

    const { result } = renderHook(() => useModelBenchmark('model-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.benchmarkData).toBeNull()
  })

  // --- Error handling ---

  it('should set error on network failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useModelBenchmark('model-5'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load benchmark data')
    expect(result.current.benchmarkData).toBeNull()
  })

  it('should set error on API error', async () => {
    mockGet.mockRejectedValueOnce({
      response: { status: 404, data: { detail: 'Model not found' } },
    })

    const { result } = renderHook(() => useModelBenchmark('model-nonexistent'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load benchmark data')
    expect(result.current.benchmarkData).toBeNull()
  })

  // --- Re-fetch on modelId change ---

  it('should re-fetch when modelId changes', async () => {
    mockGet
      .mockResolvedValueOnce({
        data: { id: 'model-a', benchmark_results: MOCK_BENCHMARK_DATA },
      })
      .mockResolvedValueOnce({
        data: { id: 'model-b', benchmark_results: null },
      })

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useModelBenchmark(id),
      { initialProps: { id: 'model-a' } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.benchmarkData).toEqual(MOCK_BENCHMARK_DATA)

    // Change modelId
    rerender({ id: 'model-b' })

    await waitFor(() => {
      expect(result.current.benchmarkData).toBeNull()
    })

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(mockGet).toHaveBeenCalledWith('/models/model-a')
    expect(mockGet).toHaveBeenCalledWith('/models/model-b')
  })
})
