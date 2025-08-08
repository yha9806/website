import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ViewMode = 'card' | 'compact' | 'detailed';
export type SortBy = 'rank' | 'score' | 'winRate' | 'battles' | 'recent';

interface UIState {
  // View preferences
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: 'asc' | 'desc';
  
  // UI states
  isSidebarOpen: boolean;
  isFilterPanelOpen: boolean;
  hoveredModel: string | null;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleSortOrder: () => void;
  toggleSidebar: () => void;
  toggleFilterPanel: () => void;
  setHoveredModel: (modelId: string | null) => void;
  resetUIState: () => void;
}

const initialState = {
  viewMode: 'card' as ViewMode,
  sortBy: 'rank' as SortBy,
  sortOrder: 'asc' as const,
  isSidebarOpen: false,
  isFilterPanelOpen: false,
  hoveredModel: null,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setViewMode: (mode) => set({ viewMode: mode }),
        
        setSortBy: (sortBy) => set({ sortBy }),
        
        toggleSortOrder: () => 
          set((state) => ({ 
            sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' 
          })),
        
        toggleSidebar: () => 
          set((state) => ({ 
            isSidebarOpen: !state.isSidebarOpen 
          })),
        
        toggleFilterPanel: () => 
          set((state) => ({ 
            isFilterPanelOpen: !state.isFilterPanelOpen 
          })),
        
        setHoveredModel: (modelId) => set({ hoveredModel: modelId }),
        
        resetUIState: () => set(initialState),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          viewMode: state.viewMode,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);