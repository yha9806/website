import React from 'react';
import type { VULCACulturalPerspectiveInfo } from '../../types/vulca';

interface CulturalPerspectiveSelectorProps {
  perspectives: VULCACulturalPerspectiveInfo[] | string[];
  selected: string;
  onSelect: (perspective: string) => void;
  compact?: boolean;
}

// Default perspectives if none loaded
const defaultPerspectives: VULCACulturalPerspectiveInfo[] = [
  { id: 'universal', name: 'Universal', description: 'Cross-cultural common ground', weightRange: '0.5-1.0' },
  { id: 'western', name: 'Western', description: 'European & American aesthetics', weightRange: '0.5-1.0' },
  { id: 'eastern', name: 'Eastern', description: 'Chinese, Japanese, Korean traditions', weightRange: '0.5-1.0' },
  { id: 'african', name: 'African', description: 'Pan-African artistic heritage', weightRange: '0.5-1.0' },
  { id: 'latin_american', name: 'Latin American', description: 'Indigenous & colonial fusion', weightRange: '0.5-1.0' },
  { id: 'middle_eastern', name: 'Islamic', description: 'Middle Eastern art philosophy', weightRange: '0.5-1.0' },
  { id: 'south_asian', name: 'South Asian', description: 'Indian subcontinent traditions', weightRange: '0.5-1.0' },
  { id: 'southeast_asian', name: 'Southeast Asian', description: 'ASEAN cultural expressions', weightRange: '0.5-1.0' },
];

export const CulturalPerspectiveSelector: React.FC<CulturalPerspectiveSelectorProps> = ({
  perspectives,
  selected,
  onSelect,
  compact = false,
}) => {
  // Normalize perspectives to VULCACulturalPerspectiveInfo format
  const perspectiveList: VULCACulturalPerspectiveInfo[] = Array.isArray(perspectives) && perspectives.length > 0
    ? (typeof perspectives[0] === 'string'
      ? (perspectives as string[]).map(id => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
          description: '',
          weightRange: '0.5-1.0'
        }))
      : perspectives as VULCACulturalPerspectiveInfo[])
    : defaultPerspectives;

  if (compact) {
    return (
      <select
        id="cultural-perspective-compact"
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-slate-600 cursor-pointer min-w-[140px]"
      >
        {perspectiveList.map((perspective) => (
          <option key={perspective.id} value={perspective.id}>
            {perspective.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      id="cultural-perspective"
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
    >
      <option value="">Select a cultural perspective</option>
      {perspectiveList.map((perspective) => (
        <option key={perspective.id} value={perspective.id}>
          {perspective.name}{perspective.description ? ` - ${perspective.description}` : ''}
        </option>
      ))}
    </select>
  );
};