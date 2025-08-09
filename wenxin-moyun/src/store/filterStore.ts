import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LeaderboardEntry } from '../types/types';

export interface Weight {
  name: string;
  key: string;
  value: number;
  color: string;
}

export interface FilterState {
  search: string;
  organizations: string[];
  categories: string[];
  scoreRange: [number, number];
  winRateRange: [number, number];
  dateRange: [Date | null, Date | null];
  tags: string[];
  weights: Weight[];
}

interface FilterStore extends FilterState {
  // Actions
  setSearch: (search: string) => void;
  toggleOrganization: (org: string) => void;
  toggleCategory: (category: string) => void;
  setScoreRange: (range: [number, number]) => void;
  setWinRateRange: (range: [number, number]) => void;
  setDateRange: (range: [Date | null, Date | null]) => void;
  toggleTag: (tag: string) => void;
  setWeights: (weights: Weight[]) => void;
  clearFilters: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  
  // Filter function
  filterEntries: (entries: LeaderboardEntry[]) => LeaderboardEntry[];
}

const initialWeights: Weight[] = [
  { name: '韵律', key: 'rhythm', value: 16.67, color: '#FF6B6B' },
  { name: '构图', key: 'composition', value: 16.67, color: '#4ECDC4' },
  { name: '叙事', key: 'narrative', value: 16.67, color: '#45B7D1' },
  { name: '情感', key: 'emotion', value: 16.67, color: '#96CEB4' },
  { name: '创新', key: 'creativity', value: 16.67, color: '#FECA57' },
  { name: '文化', key: 'cultural', value: 16.67, color: '#9B59B6' }
];

const initialState: FilterState = {
  search: '',
  organizations: [],
  categories: [],
  scoreRange: [0, 100],
  winRateRange: [0, 100],
  dateRange: [null, null],
  tags: [],
  weights: initialWeights,
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
      
      setWinRateRange: (range) => set({ winRateRange: range }),
      
      setDateRange: (range) => set({ dateRange: range }),
      
      toggleTag: (tag) => set((state) => ({
        tags: state.tags.includes(tag)
          ? state.tags.filter(t => t !== tag)
          : [...state.tags, tag]
      })),
      
      setWeights: (weights) => set({ weights }),
      
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
          
          // Win rate range filter
          const winRate = entry.winRate || 0;
          if (winRate < state.winRateRange[0] || winRate > state.winRateRange[1]) {
            return false;
          }
          
          // Date range filter
          if (state.dateRange[0] || state.dateRange[1]) {
            const releaseDate = new Date(entry.model.releaseDate);
            
            if (state.dateRange[0] && releaseDate < state.dateRange[0]) {
              return false;
            }
            
            if (state.dateRange[1] && releaseDate > state.dateRange[1]) {
              return false;
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