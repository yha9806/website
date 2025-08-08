import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LeaderboardEntry } from '../types/types';

export interface FilterState {
  search: string;
  organizations: string[];
  categories: string[];
  scoreRange: [number, number];
  dateRange: string;
  tags: string[];
}

interface FilterStore extends FilterState {
  // Actions
  setSearch: (search: string) => void;
  toggleOrganization: (org: string) => void;
  toggleCategory: (category: string) => void;
  setScoreRange: (range: [number, number]) => void;
  setDateRange: (range: string) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  
  // Filter function
  filterEntries: (entries: LeaderboardEntry[]) => LeaderboardEntry[];
}

const initialState: FilterState = {
  search: '',
  organizations: [],
  categories: [],
  scoreRange: [0, 100],
  dateRange: 'all',
  tags: [],
};

export const useFilterStore = create<FilterStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setSearch: (search) => set({ search }),
      
      toggleOrganization: (org) => set((state) => ({
        organizations: state.organizations.includes(org)
          ? state.organizations.filter(o => o !== org)
          : [...state.organizations, org]
      })),
      
      toggleCategory: (category) => set((state) => ({
        categories: state.categories.includes(category)
          ? state.categories.filter(c => c !== category)
          : [...state.categories, category]
      })),
      
      setScoreRange: (range) => set({ scoreRange: range }),
      
      setDateRange: (range) => set({ dateRange: range }),
      
      toggleTag: (tag) => set((state) => ({
        tags: state.tags.includes(tag)
          ? state.tags.filter(t => t !== tag)
          : [...state.tags, tag]
      })),
      
      clearFilters: () => set(initialState),
      
      setFilters: (filters) => set((state) => ({ ...state, ...filters })),
      
      filterEntries: (entries) => {
        const state = get();
        
        return entries.filter(entry => {
          // Search filter
          if (state.search) {
            const searchLower = state.search.toLowerCase();
            const nameMatch = entry.model.name.toLowerCase().includes(searchLower);
            const orgMatch = entry.model.organization.toLowerCase().includes(searchLower);
            if (!nameMatch && !orgMatch) return false;
          }
          
          // Organization filter
          if (state.organizations.length > 0) {
            if (!state.organizations.includes(entry.model.organization)) {
              return false;
            }
          }
          
          // Category filter
          if (state.categories.length > 0) {
            if (!state.categories.includes(entry.model.category)) {
              return false;
            }
          }
          
          // Score range filter
          if (entry.score < state.scoreRange[0] || entry.score > state.scoreRange[1]) {
            return false;
          }
          
          // Date range filter
          if (state.dateRange !== 'all') {
            const releaseDate = new Date(entry.model.releaseDate);
            const now = new Date();
            const daysDiff = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
            
            switch (state.dateRange) {
              case '7d':
                if (daysDiff > 7) return false;
                break;
              case '30d':
                if (daysDiff > 30) return false;
                break;
              case '90d':
                if (daysDiff > 90) return false;
                break;
              case '365d':
                if (daysDiff > 365) return false;
                break;
            }
          }
          
          // Tags filter
          if (state.tags.length > 0) {
            const hasMatchingTag = state.tags.some(tag => 
              entry.model.tags.includes(tag)
            );
            if (!hasMatchingTag) return false;
          }
          
          return true;
        });
      },
    }),
    {
      name: 'filter-store',
    }
  )
);