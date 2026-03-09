import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore, type ViewMode, type SortBy } from '../../store/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useUIStore.getState().resetUIState()
  })

  // --- Initial State ---

  describe('initial state', () => {
    it('should default viewMode to table', () => {
      expect(useUIStore.getState().viewMode).toBe('table')
    })

    it('should default sortBy to rank', () => {
      expect(useUIStore.getState().sortBy).toBe('rank')
    })

    it('should default sortOrder to asc', () => {
      expect(useUIStore.getState().sortOrder).toBe('asc')
    })

    it('should default isSidebarOpen to false', () => {
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
    })

    it('should default isFilterPanelOpen to false', () => {
      expect(useUIStore.getState().isFilterPanelOpen).toBe(false)
    })

    it('should default hoveredModel to null', () => {
      expect(useUIStore.getState().hoveredModel).toBeNull()
    })
  })

  // --- setViewMode ---

  describe('setViewMode', () => {
    const modes: ViewMode[] = ['table', 'card', 'compact', 'detailed']

    it.each(modes)('should set viewMode to "%s"', (mode) => {
      useUIStore.getState().setViewMode(mode)
      expect(useUIStore.getState().viewMode).toBe(mode)
    })

    it('should allow switching between modes', () => {
      useUIStore.getState().setViewMode('card')
      expect(useUIStore.getState().viewMode).toBe('card')
      useUIStore.getState().setViewMode('detailed')
      expect(useUIStore.getState().viewMode).toBe('detailed')
    })
  })

  // --- setSortBy ---

  describe('setSortBy', () => {
    const sortOptions: SortBy[] = ['rank', 'score', 'winRate', 'battles', 'recent']

    it.each(sortOptions)('should set sortBy to "%s"', (sortBy) => {
      useUIStore.getState().setSortBy(sortBy)
      expect(useUIStore.getState().sortBy).toBe(sortBy)
    })
  })

  // --- toggleSortOrder ---

  describe('toggleSortOrder', () => {
    it('should toggle from asc to desc', () => {
      expect(useUIStore.getState().sortOrder).toBe('asc')
      useUIStore.getState().toggleSortOrder()
      expect(useUIStore.getState().sortOrder).toBe('desc')
    })

    it('should toggle from desc back to asc', () => {
      useUIStore.getState().toggleSortOrder() // asc -> desc
      useUIStore.getState().toggleSortOrder() // desc -> asc
      expect(useUIStore.getState().sortOrder).toBe('asc')
    })

    it('should cycle correctly over multiple toggles', () => {
      const expected = ['desc', 'asc', 'desc', 'asc']
      for (const exp of expected) {
        useUIStore.getState().toggleSortOrder()
        expect(useUIStore.getState().sortOrder).toBe(exp)
      }
    })
  })

  // --- toggleSidebar ---

  describe('toggleSidebar', () => {
    it('should open sidebar when closed', () => {
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().isSidebarOpen).toBe(true)
    })

    it('should close sidebar when open', () => {
      useUIStore.getState().toggleSidebar() // open
      useUIStore.getState().toggleSidebar() // close
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
    })
  })

  // --- toggleFilterPanel ---

  describe('toggleFilterPanel', () => {
    it('should open filter panel when closed', () => {
      useUIStore.getState().toggleFilterPanel()
      expect(useUIStore.getState().isFilterPanelOpen).toBe(true)
    })

    it('should close filter panel when open', () => {
      useUIStore.getState().toggleFilterPanel() // open
      useUIStore.getState().toggleFilterPanel() // close
      expect(useUIStore.getState().isFilterPanelOpen).toBe(false)
    })
  })

  // --- setHoveredModel ---

  describe('setHoveredModel', () => {
    it('should set hovered model id', () => {
      useUIStore.getState().setHoveredModel('model-42')
      expect(useUIStore.getState().hoveredModel).toBe('model-42')
    })

    it('should clear hovered model with null', () => {
      useUIStore.getState().setHoveredModel('model-42')
      useUIStore.getState().setHoveredModel(null)
      expect(useUIStore.getState().hoveredModel).toBeNull()
    })
  })

  // --- resetUIState ---

  describe('resetUIState', () => {
    it('should reset all fields to initial values', () => {
      // Mutate everything
      useUIStore.getState().setViewMode('detailed')
      useUIStore.getState().setSortBy('score')
      useUIStore.getState().toggleSortOrder()
      useUIStore.getState().toggleSidebar()
      useUIStore.getState().toggleFilterPanel()
      useUIStore.getState().setHoveredModel('model-1')

      // Reset
      useUIStore.getState().resetUIState()

      const state = useUIStore.getState()
      expect(state.viewMode).toBe('table')
      expect(state.sortBy).toBe('rank')
      expect(state.sortOrder).toBe('asc')
      expect(state.isSidebarOpen).toBe(false)
      expect(state.isFilterPanelOpen).toBe(false)
      expect(state.hoveredModel).toBeNull()
    })
  })

  // --- State isolation ---

  describe('state isolation between tests', () => {
    it('should not retain state from a previous test (part 1 - mutate)', () => {
      useUIStore.getState().setViewMode('compact')
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().viewMode).toBe('compact')
      expect(useUIStore.getState().isSidebarOpen).toBe(true)
    })

    it('should not retain state from a previous test (part 2 - verify reset)', () => {
      // If beforeEach is working, state should be back to defaults
      expect(useUIStore.getState().viewMode).toBe('table')
      expect(useUIStore.getState().isSidebarOpen).toBe(false)
    })
  })

  // --- Independent state changes ---

  describe('independent state changes', () => {
    it('should not affect sortBy when changing viewMode', () => {
      useUIStore.getState().setSortBy('score')
      useUIStore.getState().setViewMode('card')
      expect(useUIStore.getState().sortBy).toBe('score')
    })

    it('should not affect sidebar when toggling filter panel', () => {
      useUIStore.getState().toggleSidebar()
      useUIStore.getState().toggleFilterPanel()
      expect(useUIStore.getState().isSidebarOpen).toBe(true)
      expect(useUIStore.getState().isFilterPanelOpen).toBe(true)
    })

    it('should not affect hoveredModel when resetting other state', () => {
      // hoveredModel is also reset by resetUIState,
      // but individual actions should not clear it
      useUIStore.getState().setHoveredModel('m-1')
      useUIStore.getState().setViewMode('compact')
      useUIStore.getState().toggleSortOrder()
      expect(useUIStore.getState().hoveredModel).toBe('m-1')
    })
  })
})
