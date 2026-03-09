import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock services
const mockGetModel = vi.fn()
const mockGetArtworksByModel = vi.fn()

vi.mock('../../services/models.service', () => ({
  modelsService: {
    getModel: (...args: unknown[]) => mockGetModel(...args),
  },
}))

vi.mock('../../services/artworks.service', () => ({
  artworksService: {
    getArtworksByModel: (...args: unknown[]) => mockGetArtworksByModel(...args),
  },
}))

import { useModelDetail } from '../../hooks/useModelDetail'

const MOCK_MODEL = {
  id: 'gpt-4',
  name: 'GPT-4',
  organization: 'OpenAI',
  version: '4.0',
  releaseDate: '2023-03-14',
  description: 'Large multimodal model',
  category: 'multimodal' as const,
  overallScore: 87.5,
  metrics: {
    rhythm: 8.2,
    composition: 8.5,
    narrative: 9.0,
    emotion: 7.8,
    creativity: 8.8,
    cultural: 7.5,
  },
  works: [],
  avatar: 'https://example.com/avatar.png',
  tags: ['multimodal', 'gpt'],
}

const MOCK_ARTWORKS = [
  {
    id: 'art-1',
    type: 'painting',
    title: 'Sunset',
    content: '',
    imageUrl: 'https://example.com/sunset.png',
    score: 8.5,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'art-2',
    type: 'poem',
    title: 'Haiku',
    content: 'Autumn leaves falling',
    score: 7.2,
    createdAt: '2025-01-16T14:00:00Z',
  },
]

describe('useModelDetail', () => {
  beforeEach(() => {
    mockGetModel.mockReset()
    mockGetArtworksByModel.mockReset()

    // Silence console.log/warn/error from the hook
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- No modelId ---

  it('should stop loading and return null when modelId is undefined', async () => {
    const { result } = renderHook(() => useModelDetail(undefined))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.model).toBeNull()
    expect(result.current.artworks).toEqual([])
    expect(result.current.error).toBeNull()
    expect(mockGetModel).not.toHaveBeenCalled()
  })

  // --- Successful fetch ---

  it('should fetch model and artworks successfully', async () => {
    mockGetModel.mockResolvedValueOnce(MOCK_MODEL)
    mockGetArtworksByModel.mockResolvedValueOnce({
      artworks: MOCK_ARTWORKS,
    })

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    // Initially loading
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.model).toEqual(MOCK_MODEL)
    expect(result.current.artworks).toEqual(MOCK_ARTWORKS)
    expect(result.current.error).toBeNull()
    expect(mockGetModel).toHaveBeenCalledWith('gpt-4')
    expect(mockGetArtworksByModel).toHaveBeenCalledWith('gpt-4')
  })

  // --- Artworks fetch failure is graceful ---

  it('should still return model when artworks fetch fails', async () => {
    mockGetModel.mockResolvedValueOnce(MOCK_MODEL)
    mockGetArtworksByModel.mockRejectedValueOnce(new Error('Artworks not found'))

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.model).toEqual(MOCK_MODEL)
    expect(result.current.artworks).toEqual([])
    expect(result.current.error).toBeNull()
  })

  // --- Model fetch failure ---

  it('should set error when model fetch fails with API error', async () => {
    mockGetModel.mockRejectedValueOnce({
      response: { data: { detail: 'Model not found' } },
      message: 'Request failed with status code 404',
    })

    const { result } = renderHook(() => useModelDetail('nonexistent'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.model).toBeNull()
    expect(result.current.error).toBe('Model not found')
  })

  it('should set error from message when no detail is available', async () => {
    mockGetModel.mockRejectedValueOnce({
      message: 'Network error',
    })

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should set fallback error message when error has no detail or message', async () => {
    mockGetModel.mockRejectedValueOnce({})

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load model details')
  })

  // --- Loading state ---

  it('should be loading while fetch is in progress', async () => {
    mockGetModel.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    expect(result.current.model).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // --- Handles empty artworks ---

  it('should handle artworks response without artworks array', async () => {
    mockGetModel.mockResolvedValueOnce(MOCK_MODEL)
    mockGetArtworksByModel.mockResolvedValueOnce({})

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.artworks).toEqual([])
  })

  // --- Re-fetch on modelId change ---

  it('should re-fetch when modelId changes', async () => {
    const model2 = { ...MOCK_MODEL, id: 'claude-3', name: 'Claude 3' }

    mockGetModel
      .mockResolvedValueOnce(MOCK_MODEL)
      .mockResolvedValueOnce(model2)
    mockGetArtworksByModel
      .mockResolvedValueOnce({ artworks: MOCK_ARTWORKS })
      .mockResolvedValueOnce({ artworks: [] })

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useModelDetail(id),
      { initialProps: { id: 'gpt-4' } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.model?.name).toBe('GPT-4')

    // Change to different model
    rerender({ id: 'claude-3' })

    await waitFor(() => {
      expect(result.current.model?.name).toBe('Claude 3')
    })

    expect(result.current.artworks).toEqual([])
    expect(mockGetModel).toHaveBeenCalledTimes(2)
  })

  // --- Error priority: response.data.detail > message > fallback ---

  it('should prioritize response.data.detail over message', async () => {
    mockGetModel.mockRejectedValueOnce({
      response: { data: { detail: 'Custom API error' } },
      message: 'Generic error',
    })

    const { result } = renderHook(() => useModelDetail('gpt-4'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Custom API error')
  })
})
