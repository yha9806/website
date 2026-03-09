import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore, type Weight } from '../../store/filterStore'
import type { LeaderboardEntry, Model } from '../../types/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal Model factory – only fields used by filterEntries */
function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'model-1',
    name: 'TestModel',
    organization: 'TestOrg',
    version: '1.0',
    releaseDate: '2025-06-01',
    description: '',
    category: 'text',
    overallScore: 80,
    metrics: { rhythm: 0, composition: 0, narrative: 0, emotion: 0, creativity: 0, cultural: 0 },
    works: [],
    tags: ['open-source'],
    ...overrides,
  } as Model
}

function makeEntry(overrides: Partial<LeaderboardEntry> & { model?: Partial<Model> } = {}): LeaderboardEntry {
  const { model: modelOverrides, ...rest } = overrides
  return {
    rank: 1,
    model: makeModel(modelOverrides),
    score: 85,
    change: 0,
    battles: 100,
    winRate: 55,
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('filterStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useFilterStore.getState().clearFilters()
  })

  // --- Initial State ---

  describe('initial state', () => {
    it('should have empty search', () => {
      expect(useFilterStore.getState().search).toBe('')
    })

    it('should have empty organizations', () => {
      expect(useFilterStore.getState().organizations).toEqual([])
    })

    it('should have empty categories', () => {
      expect(useFilterStore.getState().categories).toEqual([])
    })

    it('should have full score range [0, 100]', () => {
      expect(useFilterStore.getState().scoreRange).toEqual([0, 100])
    })

    it('should have full win rate range [0, 100]', () => {
      expect(useFilterStore.getState().winRateRange).toEqual([0, 100])
    })

    it('should have null date range', () => {
      expect(useFilterStore.getState().dateRange).toEqual([null, null])
    })

    it('should have empty tags', () => {
      expect(useFilterStore.getState().tags).toEqual([])
    })

    it('should have 6 initial weights totalling ~100%', () => {
      const weights = useFilterStore.getState().weights
      expect(weights).toHaveLength(6)
      const total = weights.reduce((sum, w) => sum + w.value, 0)
      expect(total).toBeCloseTo(100, 0)
    })
  })

  // --- setSearch ---

  describe('setSearch', () => {
    it('should update the search string', () => {
      useFilterStore.getState().setSearch('gpt')
      expect(useFilterStore.getState().search).toBe('gpt')
    })

    it('should allow clearing the search', () => {
      useFilterStore.getState().setSearch('gpt')
      useFilterStore.getState().setSearch('')
      expect(useFilterStore.getState().search).toBe('')
    })
  })

  // --- toggleOrganization ---

  describe('toggleOrganization', () => {
    it('should add organization when not present', () => {
      useFilterStore.getState().toggleOrganization('OpenAI')
      expect(useFilterStore.getState().organizations).toEqual(['OpenAI'])
    })

    it('should remove organization when already present', () => {
      useFilterStore.getState().toggleOrganization('OpenAI')
      useFilterStore.getState().toggleOrganization('OpenAI')
      expect(useFilterStore.getState().organizations).toEqual([])
    })

    it('should support multiple organizations', () => {
      useFilterStore.getState().toggleOrganization('OpenAI')
      useFilterStore.getState().toggleOrganization('Anthropic')
      expect(useFilterStore.getState().organizations).toEqual(['OpenAI', 'Anthropic'])
    })

    it('should remove only the toggled organization', () => {
      useFilterStore.getState().toggleOrganization('OpenAI')
      useFilterStore.getState().toggleOrganization('Anthropic')
      useFilterStore.getState().toggleOrganization('OpenAI')
      expect(useFilterStore.getState().organizations).toEqual(['Anthropic'])
    })
  })

  // --- toggleCategory ---

  describe('toggleCategory', () => {
    it('should add category when not present', () => {
      useFilterStore.getState().toggleCategory('text')
      expect(useFilterStore.getState().categories).toEqual(['text'])
    })

    it('should remove category when already present', () => {
      useFilterStore.getState().toggleCategory('text')
      useFilterStore.getState().toggleCategory('text')
      expect(useFilterStore.getState().categories).toEqual([])
    })
  })

  // --- setScoreRange ---

  describe('setScoreRange', () => {
    it('should update score range', () => {
      useFilterStore.getState().setScoreRange([20, 80])
      expect(useFilterStore.getState().scoreRange).toEqual([20, 80])
    })
  })

  // --- setWinRateRange ---

  describe('setWinRateRange', () => {
    it('should update win rate range', () => {
      useFilterStore.getState().setWinRateRange([30, 70])
      expect(useFilterStore.getState().winRateRange).toEqual([30, 70])
    })
  })

  // --- setDateRange ---

  describe('setDateRange', () => {
    it('should set start and end dates', () => {
      const start = new Date('2025-01-01')
      const end = new Date('2025-12-31')
      useFilterStore.getState().setDateRange([start, end])
      expect(useFilterStore.getState().dateRange).toEqual([start, end])
    })

    it('should allow partial date ranges', () => {
      const start = new Date('2025-01-01')
      useFilterStore.getState().setDateRange([start, null])
      expect(useFilterStore.getState().dateRange).toEqual([start, null])
    })
  })

  // --- toggleTag ---

  describe('toggleTag', () => {
    it('should add tag when not present', () => {
      useFilterStore.getState().toggleTag('open-source')
      expect(useFilterStore.getState().tags).toEqual(['open-source'])
    })

    it('should remove tag when already present', () => {
      useFilterStore.getState().toggleTag('open-source')
      useFilterStore.getState().toggleTag('open-source')
      expect(useFilterStore.getState().tags).toEqual([])
    })
  })

  // --- setWeights ---

  describe('setWeights', () => {
    it('should replace the weights array', () => {
      const newWeights: Weight[] = [
        { name: 'A', key: 'a', value: 50, color: '#000' },
        { name: 'B', key: 'b', value: 50, color: '#fff' },
      ]
      useFilterStore.getState().setWeights(newWeights)
      expect(useFilterStore.getState().weights).toEqual(newWeights)
    })
  })

  // --- setFilters (partial update) ---

  describe('setFilters', () => {
    it('should merge partial filter updates', () => {
      useFilterStore.getState().setFilters({ search: 'claude', scoreRange: [10, 90] })
      const state = useFilterStore.getState()
      expect(state.search).toBe('claude')
      expect(state.scoreRange).toEqual([10, 90])
      // Other fields remain unchanged
      expect(state.organizations).toEqual([])
    })
  })

  // --- clearFilters ---

  describe('clearFilters', () => {
    it('should reset all filters to initial state', () => {
      // Mutate several fields
      useFilterStore.getState().setSearch('query')
      useFilterStore.getState().toggleOrganization('Org')
      useFilterStore.getState().toggleCategory('visual')
      useFilterStore.getState().setScoreRange([20, 80])
      useFilterStore.getState().toggleTag('tag1')

      useFilterStore.getState().clearFilters()

      const state = useFilterStore.getState()
      expect(state.search).toBe('')
      expect(state.organizations).toEqual([])
      expect(state.categories).toEqual([])
      expect(state.scoreRange).toEqual([0, 100])
      expect(state.winRateRange).toEqual([0, 100])
      expect(state.dateRange).toEqual([null, null])
      expect(state.tags).toEqual([])
      expect(state.weights).toHaveLength(6)
    })
  })

  // --- filterEntries ---

  describe('filterEntries', () => {
    const entries: LeaderboardEntry[] = [
      makeEntry({ model: { name: 'GPT-4', organization: 'OpenAI', category: 'text', releaseDate: '2025-03-14', tags: ['proprietary'] }, score: 90, winRate: 70 }),
      makeEntry({ rank: 2, model: { id: 'model-2', name: 'Claude 3', organization: 'Anthropic', category: 'multimodal', releaseDate: '2025-06-01', tags: ['proprietary', 'multimodal'] }, score: 85, winRate: 60 }),
      makeEntry({ rank: 3, model: { id: 'model-3', name: 'Llama 3', organization: 'Meta', category: 'text', releaseDate: '2025-09-15', tags: ['open-source'] }, score: 75, winRate: 50 }),
      makeEntry({ rank: 4, model: { id: 'model-4', name: 'DALL-E 4', organization: 'OpenAI', category: 'visual', releaseDate: '2025-12-01', tags: ['proprietary', 'visual'] }, score: null, winRate: 40 }),
    ]

    it('should return all entries when no filters are active', () => {
      const result = useFilterStore.getState().filterEntries(entries)
      expect(result).toHaveLength(4)
    })

    // --- Search filter ---

    describe('search filter', () => {
      it('should filter by model name (case-insensitive)', () => {
        useFilterStore.getState().setSearch('gpt')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(1)
        expect(result[0].model.name).toBe('GPT-4')
      })

      it('should filter by organization name', () => {
        useFilterStore.getState().setSearch('anthropic')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(1)
        expect(result[0].model.name).toBe('Claude 3')
      })

      it('should match partial strings', () => {
        useFilterStore.getState().setSearch('ll')
        const result = useFilterStore.getState().filterEntries(entries)
        // Matches "DALL-E 4" and "Llama 3"
        expect(result).toHaveLength(2)
      })

      it('should return empty for no matches', () => {
        useFilterStore.getState().setSearch('nonexistent')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(0)
      })
    })

    // --- Organization filter ---

    describe('organization filter', () => {
      it('should filter by single organization', () => {
        useFilterStore.getState().toggleOrganization('OpenAI')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(2)
        expect(result.every(e => e.model.organization === 'OpenAI')).toBe(true)
      })

      it('should filter by multiple organizations', () => {
        useFilterStore.getState().toggleOrganization('OpenAI')
        useFilterStore.getState().toggleOrganization('Meta')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(3)
      })
    })

    // --- Category filter ---

    describe('category filter', () => {
      it('should filter by single category', () => {
        useFilterStore.getState().toggleCategory('text')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(2)
        expect(result.every(e => e.model.category === 'text')).toBe(true)
      })

      it('should filter by multiple categories', () => {
        useFilterStore.getState().toggleCategory('text')
        useFilterStore.getState().toggleCategory('visual')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(3)
      })
    })

    // --- Score range filter ---

    describe('score range filter', () => {
      it('should filter entries within score range', () => {
        useFilterStore.getState().setScoreRange([80, 95])
        const result = useFilterStore.getState().filterEntries(entries)
        // GPT-4 (90), Claude 3 (85), DALL-E 4 (null - passes), Llama 3 (75 - excluded)
        expect(result).toHaveLength(3)
      })

      it('should pass through null scores', () => {
        useFilterStore.getState().setScoreRange([80, 95])
        const result = useFilterStore.getState().filterEntries(entries)
        const nullEntry = result.find(e => e.score === null)
        expect(nullEntry).toBeDefined()
        expect(nullEntry!.model.name).toBe('DALL-E 4')
      })

      it('should exclude entries outside range', () => {
        useFilterStore.getState().setScoreRange([88, 92])
        const result = useFilterStore.getState().filterEntries(entries)
        // Only GPT-4 (90) and DALL-E 4 (null)
        expect(result).toHaveLength(2)
      })
    })

    // --- Win rate range filter ---

    describe('win rate range filter', () => {
      it('should filter by win rate range', () => {
        useFilterStore.getState().setWinRateRange([55, 75])
        const result = useFilterStore.getState().filterEntries(entries)
        // GPT-4 (70), Claude 3 (60)
        expect(result).toHaveLength(2)
      })

      it('should include boundary values', () => {
        useFilterStore.getState().setWinRateRange([50, 70])
        const result = useFilterStore.getState().filterEntries(entries)
        // GPT-4 (70), Claude 3 (60), Llama 3 (50)
        expect(result).toHaveLength(3)
      })
    })

    // --- Date range filter ---

    describe('date range filter', () => {
      it('should filter by start date only', () => {
        useFilterStore.getState().setDateRange([new Date('2025-07-01'), null])
        const result = useFilterStore.getState().filterEntries(entries)
        // Llama 3 (2025-09-15), DALL-E 4 (2025-12-01)
        expect(result).toHaveLength(2)
      })

      it('should filter by end date only', () => {
        useFilterStore.getState().setDateRange([null, new Date('2025-06-30')])
        const result = useFilterStore.getState().filterEntries(entries)
        // GPT-4 (2025-03-14), Claude 3 (2025-06-01)
        expect(result).toHaveLength(2)
      })

      it('should filter by full date range', () => {
        useFilterStore.getState().setDateRange([new Date('2025-05-01'), new Date('2025-10-01')])
        const result = useFilterStore.getState().filterEntries(entries)
        // Claude 3 (2025-06-01), Llama 3 (2025-09-15)
        expect(result).toHaveLength(2)
      })
    })

    // --- Tags filter ---

    describe('tags filter', () => {
      it('should filter by tag', () => {
        useFilterStore.getState().toggleTag('open-source')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(1)
        expect(result[0].model.name).toBe('Llama 3')
      })

      it('should match entries with any of the selected tags', () => {
        useFilterStore.getState().toggleTag('multimodal')
        useFilterStore.getState().toggleTag('open-source')
        const result = useFilterStore.getState().filterEntries(entries)
        // Claude 3 (multimodal), Llama 3 (open-source)
        expect(result).toHaveLength(2)
      })
    })

    // --- Combined filters ---

    describe('combined filters', () => {
      it('should apply search + organization together', () => {
        useFilterStore.getState().setSearch('gpt')
        useFilterStore.getState().toggleOrganization('OpenAI')
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(1)
        expect(result[0].model.name).toBe('GPT-4')
      })

      it('should apply search + category together', () => {
        useFilterStore.getState().setSearch('ll')
        useFilterStore.getState().toggleCategory('text')
        const result = useFilterStore.getState().filterEntries(entries)
        // "ll" matches DALL-E 4 and Llama 3, but only Llama 3 is "text"
        expect(result).toHaveLength(1)
        expect(result[0].model.name).toBe('Llama 3')
      })

      it('should return empty when filters are contradictory', () => {
        useFilterStore.getState().toggleOrganization('Meta')
        useFilterStore.getState().toggleCategory('visual')
        const result = useFilterStore.getState().filterEntries(entries)
        // Meta has no visual models
        expect(result).toHaveLength(0)
      })

      it('should apply all filters together', () => {
        useFilterStore.getState().toggleOrganization('OpenAI')
        useFilterStore.getState().toggleCategory('text')
        useFilterStore.getState().setScoreRange([80, 100])
        const result = useFilterStore.getState().filterEntries(entries)
        expect(result).toHaveLength(1)
        expect(result[0].model.name).toBe('GPT-4')
      })
    })
  })

  // --- State isolation ---

  describe('state isolation', () => {
    it('should not leak state between tests (verifies beforeEach reset)', () => {
      // This test relies on beforeEach clearing state
      const state = useFilterStore.getState()
      expect(state.search).toBe('')
      expect(state.organizations).toEqual([])
      expect(state.categories).toEqual([])
      expect(state.tags).toEqual([])
    })
  })
})
