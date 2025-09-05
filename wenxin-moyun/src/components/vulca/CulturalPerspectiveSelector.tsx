import React from 'react';
import type { VULCACulturalPerspectiveInfo } from '../../types/vulca';

interface CulturalPerspectiveSelectorProps {
  perspectives: VULCACulturalPerspectiveInfo[];
  selected: string;
  onSelect: (perspective: string) => void;
}

export const CulturalPerspectiveSelector: React.FC<CulturalPerspectiveSelectorProps> = ({
  perspectives,
  selected,
  onSelect,
}) => {
  // Default perspectives if none loaded
  const defaultPerspectives: VULCACulturalPerspectiveInfo[] = [
    { id: 'western', name: 'Western', description: 'Emphasizes individualism and innovation', weightRange: '0.5-1.0' },
    { id: 'eastern', name: 'Eastern', description: 'Values harmony and tradition', weightRange: '0.5-1.0' },
    { id: 'african', name: 'African', description: 'Focuses on community and rhythm', weightRange: '0.5-1.0' },
    { id: 'latin_american', name: 'Latin American', description: 'Celebrates passion and family', weightRange: '0.5-1.0' },
    { id: 'middle_eastern', name: 'Middle Eastern', description: 'Prioritizes hospitality and spirituality', weightRange: '0.5-1.0' },
    { id: 'south_asian', name: 'South Asian', description: 'Combines spirituality and festivals', weightRange: '0.5-1.0' },
    { id: 'oceanic', name: 'Oceanic', description: 'Connects with nature and ocean', weightRange: '0.5-1.0' },
    { id: 'indigenous', name: 'Indigenous', description: 'Honors land and ancestral wisdom', weightRange: '0.5-1.0' },
  ];
  
  const perspectiveList = perspectives.length > 0 ? perspectives : defaultPerspectives;
  
  return (
    <select 
      id="cultural-perspective"
      value={selected} 
      onChange={(e) => onSelect(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select a cultural perspective</option>
      {perspectiveList.map((perspective) => (
        <option key={perspective.id} value={perspective.id}>
          {perspective.name} - {perspective.description}
        </option>
      ))}
    </select>
  );
};