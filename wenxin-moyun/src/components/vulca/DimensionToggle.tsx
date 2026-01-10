import React from 'react';
import { IOSButton } from '../ios/core/IOSButton';
import type { ViewMode } from '../../types/vulca';

interface DimensionToggleProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const DimensionToggle: React.FC<DimensionToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex w-full border rounded-lg overflow-hidden">
      <IOSButton
        variant={mode === '6d' ? 'primary' : 'secondary'}
        onClick={() => onModeChange('6d')}
        className="flex-1 rounded-none"
        data-testid="dimension-toggle" 
        data-mode="6d"
      >
        <span className="font-medium">6D</span>
        <span className="ml-1 text-xs text-gray-500">Original</span>
      </IOSButton>
      <IOSButton
        variant={mode === '47d' ? 'primary' : 'secondary'}
        onClick={() => onModeChange('47d')}
        className="flex-1 rounded-none"
        data-testid="dimension-toggle" 
        data-mode="47d"
      >
        <span className="font-medium">47D</span>
        <span className="ml-1 text-xs text-gray-500">Extended</span>
      </IOSButton>
    </div>
  );
};