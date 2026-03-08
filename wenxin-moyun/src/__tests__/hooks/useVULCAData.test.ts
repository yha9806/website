import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVULCAData } from '../../hooks/vulca/useVULCAData'

// Mock the vulcaService
const mockVulcaService = {
  healthCheck: vi.fn(),
  getInfo: vi.fn(),
  getDimensions: vi.fn(),
  getCulturalPerspectives: vi.fn(),
  evaluateModel: vi.fn(),
  compareModels: vi.fn(),
  getDemoComparison: vi.fn(),
  clearCache: vi.fn(),
}

vi.mock('../../utils/vulca/api', () => ({
  vulcaService: {
    healthCheck: (...args: unknown[]) => mockVulcaService.healthCheck(...args),
    getInfo: (...args: unknown[]) => mockVulcaService.getInfo(...args),
    getDimensions: (...args: unknown[]) => mockVulcaService.getDimensions(...args),
    getCulturalPerspectives: (...args: unknown[]) =>
      mockVulcaService.getCulturalPerspectives(...args),
    evaluateModel: (...args: unknown[]) => mockVulcaService.evaluateModel(...args),
    compareModels: (...args: unknown[]) => mockVulcaService.compareModels(...args),
    getDemoComparison: (...args: unknown[]) =>
      mockVulcaService.getDemoComparison(...args),
    clearCache: () => mockVulcaService.clearCache(),
  },
}))

// Mock getDimensionLabel
vi.mock('../../utils/vulca-dimensions', () => ({
  getDimensionLabel: vi.fn((id: string) => `Label for ${id}`),
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock sessionStorage
const sessionStorageData: Record<string, string> = {}
const mockSessionStorage = {
  getItem: vi.fn((key: string) => sessionStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageData[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageData[key]
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStorageData).forEach((k) => delete sessionStorageData[k])
  }),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

const mockDimensions = [
  { id: 'dim_0', name: 'Originality', description: 'Measures originality' },
  { id: 'dim_1', name: 'Imagination', description: 'Measures imagination' },
]

const mockPerspectives = [
  { id: 'western', name: 'Western', description: 'Western perspective' },
  { id: 'eastern', name: 'Eastern', description: 'Eastern perspective' },
]

const mockSystemInfo = {
  version: '1.0',
  dimensions_count: 47,
}

describe('useVULCAData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(sessionStorageData).forEach((k) => delete sessionStorageData[k])

    // Default: API is connected and returns data
    mockVulcaService.healthCheck.mockResolvedValue(true)
    mockVulcaService.getInfo.mockResolvedValue(mockSystemInfo)
    mockVulcaService.getDimensions.mockResolvedValue(mockDimensions)
    mockVulcaService.getCulturalPerspectives.mockResolvedValue(mockPerspectives)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --- Initialization ---

  it('should start in initializing state', () => {
    const { result } = renderHook(() => useVULCAData())

    expect(result.current.initializing).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('should load dimensions and perspectives on mount', async () => {
    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.isConnected).toBe(true)
    expect(result.current.dimensions).toHaveLength(2)
    expect(result.current.perspectives).toHaveLength(2)
    expect(result.current.systemInfo).toEqual(mockSystemInfo)
    expect(result.current.error).toBeNull()
    expect(result.current.lastSync).toBeInstanceOf(Date)
  })

  it('should transform dimension names using getDimensionLabel', async () => {
    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    // getDimensionLabel is mocked to return "Label for {id}"
    expect(result.current.dimensions[0].name).toBe('Label for dim_0')
    expect(result.current.dimensions[1].name).toBe('Label for dim_1')
  })

  // --- Connection Failure ---

  it('should set error when health check fails', async () => {
    mockVulcaService.healthCheck.mockResolvedValue(false)

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBe(
      'Unable to connect to VULCA API. Using cached data.',
    )
  })

  it('should use session storage cache when API is down', async () => {
    // Pre-populate session storage with cached data
    const cachedData = {
      dimensions: {
        data: mockDimensions,
        timestamp: Date.now(),
      },
      perspectives: {
        data: mockPerspectives,
        timestamp: Date.now(),
      },
    }
    sessionStorageData['vulca_data_cache'] = JSON.stringify(cachedData)

    mockVulcaService.healthCheck.mockResolvedValue(false)

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.isConnected).toBe(false)
    // Should have attempted to load from cache
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('vulca_data_cache')
  })

  it('should handle initialization error gracefully', async () => {
    mockVulcaService.healthCheck.mockRejectedValue(
      new Error('Network timeout'),
    )

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    expect(result.current.error).toBe('Network timeout')
  })

  // --- evaluateModel ---

  it('should evaluate a model and add to evaluations', async () => {
    const mockEvaluation = {
      modelId: 'model-1',
      modelName: 'GPT-4',
      scores6D: {
        creativity: 8.5,
        technique: 7.0,
        emotion: 9.0,
        context: 8.0,
        innovation: 7.5,
        impact: 8.0,
      },
      scores47D: {},
      culturalPerspectives: {},
      evaluationDate: '2026-03-08',
    }
    mockVulcaService.evaluateModel.mockResolvedValue(mockEvaluation)

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.evaluateModel('model-1', {
        creativity: 8.5,
        technique: 7.0,
        emotion: 9.0,
        context: 8.0,
        innovation: 7.5,
        impact: 8.0,
      })
    })

    expect(result.current.evaluating).toBe(false)
    expect(result.current.evaluations).toHaveLength(1)
    expect(result.current.evaluations[0].modelId).toBe('model-1')
    expect(result.current.error).toBeNull()
  })

  it('should set evaluating state during evaluation', async () => {
    let resolveEval: (value: unknown) => void
    mockVulcaService.evaluateModel.mockImplementation(
      () => new Promise((resolve) => { resolveEval = resolve }),
    )

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    act(() => {
      result.current.evaluateModel('m1', {
        creativity: 5,
        technique: 5,
        emotion: 5,
        context: 5,
        innovation: 5,
        impact: 5,
      })
    })

    await waitFor(() => {
      expect(result.current.evaluating).toBe(true)
    })

    await act(async () => {
      resolveEval!({ modelId: 'm1' })
    })

    await waitFor(() => {
      expect(result.current.evaluating).toBe(false)
    })
  })

  it('should handle evaluation error', async () => {
    mockVulcaService.evaluateModel.mockRejectedValue(
      new Error('Evaluation failed'),
    )

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.evaluateModel('m1', {
        creativity: 5,
        technique: 5,
        emotion: 5,
        context: 5,
        innovation: 5,
        impact: 5,
      })
    })

    expect(result.current.error).toBe('Evaluation failed')
    expect(result.current.evaluating).toBe(false)
  })

  // --- compareModels ---

  it('should require at least 2 models for comparison', async () => {
    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.compareModels(['model-1'])
    })

    expect(result.current.error).toBe(
      'At least 2 models required for comparison',
    )
    expect(mockVulcaService.compareModels).not.toHaveBeenCalled()
  })

  it('should compare models successfully', async () => {
    const mockComparison = {
      models: [
        { modelId: 'm1', modelName: 'Model 1' },
        { modelId: 'm2', modelName: 'Model 2' },
      ],
      differenceMatrix: [],
      summary: {},
      comparisonDate: '2026-03-08',
    }
    mockVulcaService.compareModels.mockResolvedValue(mockComparison)

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.compareModels(['m1', 'm2'])
    })

    expect(result.current.comparison).toEqual(mockComparison)
    expect(result.current.evaluations).toHaveLength(2)
    expect(result.current.comparing).toBe(false)
  })

  // --- loadDimensions ---

  it('should reload dimensions on demand', async () => {
    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    const newDims = [
      { id: 'dim_2', name: 'NewDim', description: 'A new dimension' },
    ]
    mockVulcaService.getDimensions.mockResolvedValue(newDims)

    await act(async () => {
      await result.current.loadDimensions()
    })

    expect(result.current.dimensions).toHaveLength(1)
    expect(result.current.loading).toBe(false)
  })

  // --- clearError ---

  it('should clear error state', async () => {
    mockVulcaService.evaluateModel.mockRejectedValue(
      new Error('Some error'),
    )

    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    await act(async () => {
      await result.current.evaluateModel('m1', {
        creativity: 5,
        technique: 5,
        emotion: 5,
        context: 5,
        innovation: 5,
        impact: 5,
      })
    })

    expect(result.current.error).toBe('Some error')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.errorDetails).toBeNull()
  })

  // --- refreshAll ---

  it('should refresh all data and clear cache', async () => {
    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    // Update mocks for refresh
    const newDims = [
      { id: 'dim_99', name: 'Refreshed', description: 'Refreshed dim' },
    ]
    mockVulcaService.getDimensions.mockResolvedValue(newDims)

    await act(async () => {
      await result.current.refreshAll()
    })

    expect(mockVulcaService.clearCache).toHaveBeenCalled()
    expect(result.current.initializing).toBe(false)
    expect(result.current.dimensions).toHaveLength(1)
    expect(result.current.dimensions[0].id).toBe('dim_99')
  })

  // --- Return shape ---

  it('should return all expected fields', async () => {
    const { result } = renderHook(() => useVULCAData())

    await waitFor(() => {
      expect(result.current.initializing).toBe(false)
    })

    // Data
    expect(Array.isArray(result.current.evaluations)).toBe(true)
    expect(Array.isArray(result.current.dimensions)).toBe(true)
    expect(Array.isArray(result.current.perspectives)).toBe(true)

    // Loading states
    expect(typeof result.current.loading).toBe('boolean')
    expect(typeof result.current.initializing).toBe('boolean')
    expect(typeof result.current.evaluating).toBe('boolean')
    expect(typeof result.current.comparing).toBe('boolean')

    // Connection
    expect(typeof result.current.isConnected).toBe('boolean')

    // Actions
    expect(typeof result.current.evaluateModel).toBe('function')
    expect(typeof result.current.compareModels).toBe('function')
    expect(typeof result.current.loadDimensions).toBe('function')
    expect(typeof result.current.loadPerspectives).toBe('function')
    expect(typeof result.current.loadDemoData).toBe('function')
    expect(typeof result.current.refreshAll).toBe('function')
    expect(typeof result.current.clearError).toBe('function')
    expect(typeof result.current.retryConnection).toBe('function')
  })
})
