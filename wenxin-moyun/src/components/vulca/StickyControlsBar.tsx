/**
 * StickyControlsBar - Horizontal sticky controls for VULCA Demo
 * Replaces the sidebar layout with a modern horizontal control bar
 * Supports responsive design with mobile sheet trigger
 */

import React, { useState, useEffect } from 'react';
import { IOSButton } from '../ios/core/IOSButton';
import { ModelSelector } from './ModelSelector';
import { CulturalPerspectiveSelector } from './CulturalPerspectiveSelector';
import { MobileControlsSheet, MobileControlsTrigger } from './MobileControlsSheet';
import { Download, RefreshCw, CheckCircle, WifiOff } from 'lucide-react';
import type { ViewMode, ViewLevel } from '../../types/vulca';

// Custom hook for detecting mobile viewport
const useIsMobile = (breakpoint = 768) => {
  // Initialize with actual window width if available (client-side)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount in case initial state was wrong
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

interface StickyControlsBarProps {
  // Models
  availableModels: Array<{ id: string; name: string; organization: string }>;
  selectedModels: string[];
  onModelSelect: (modelId: string) => void;

  // View Mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // View Level (for 47D)
  viewLevel: ViewLevel;
  onViewLevelChange: (level: ViewLevel) => void;

  // Cultural Perspective
  perspectives: string[];
  culturalPerspective: string;
  onPerspectiveChange: (perspective: string) => void;

  // Actions
  onExport: () => void;
  onRefresh: () => void;

  // Status
  isConnected: boolean;
  loading: boolean;
}

// Segmented control for view mode
const ViewModeSegments: React.FC<{
  viewMode: ViewMode;
  viewLevel: ViewLevel;
  onChange: (mode: ViewMode, level: ViewLevel) => void;
}> = ({ viewMode, viewLevel, onChange }) => {
  const segments = [
    { mode: '6d' as const, level: 'overview' as const, label: '6D Overview' },
    { mode: '47d' as const, level: 'grouped' as const, label: '47D Grouped' },
    { mode: '47d' as const, level: 'detailed' as const, label: '47D Full' },
  ];

  const currentSegment = viewMode === '6d' ? 0 : viewLevel === 'grouped' ? 1 : 2;

  return (
    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
      {segments.map((seg, index) => (
        <button
          key={`${seg.mode}-${seg.level}`}
          onClick={() => onChange(seg.mode, seg.level)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all
            ${currentSegment === index
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );
};

export const StickyControlsBar: React.FC<StickyControlsBarProps> = ({
  availableModels,
  selectedModels,
  onModelSelect,
  viewMode,
  onViewModeChange,
  viewLevel,
  onViewLevelChange,
  perspectives,
  culturalPerspective,
  onPerspectiveChange,
  onExport,
  onRefresh,
  isConnected,
  loading,
}) => {
  const isMobile = useIsMobile();
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  const handleViewModeChange = (mode: ViewMode, level: ViewLevel) => {
    onViewModeChange(mode);
    onViewLevelChange(level);
  };

  // Mobile Layout with iOS glass morphism
  if (isMobile) {
    return (
      <>
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm py-3 -mx-4 px-4 mb-6">
          <MobileControlsTrigger
            onClick={() => setShowMobileSheet(true)}
            selectedModelsCount={selectedModels.length}
            viewMode={viewMode}
            viewLevel={viewLevel}
            culturalPerspective={culturalPerspective}
          />
        </div>

        <MobileControlsSheet
          visible={showMobileSheet}
          onClose={() => setShowMobileSheet(false)}
          availableModels={availableModels}
          selectedModels={selectedModels}
          onModelSelect={onModelSelect}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          viewLevel={viewLevel}
          onViewLevelChange={onViewLevelChange}
          perspectives={perspectives}
          culturalPerspective={culturalPerspective}
          onPerspectiveChange={onPerspectiveChange}
          onExport={onExport}
          onRefresh={onRefresh}
          loading={loading}
        />
      </>
    );
  }

  // Desktop Layout with enhanced iOS glass morphism
  return (
    <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm dark:shadow-gray-900/20 -mx-4 px-4 mb-6">
      {/* Primary controls row */}
      <div className="flex flex-wrap items-center gap-4 py-3">
        {/* Model Selector - Compact Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">
            Models:
          </span>
          <ModelSelector
            models={availableModels}
            selectedModels={selectedModels}
            onModelSelect={onModelSelect}
            compact
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700" />

        {/* View Mode Segmented Control */}
        <ViewModeSegments
          viewMode={viewMode}
          viewLevel={viewLevel}
          onChange={handleViewModeChange}
        />

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700" />

        {/* Cultural Perspective Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">
            Perspective:
          </span>
          <CulturalPerspectiveSelector
            perspectives={perspectives}
            selected={culturalPerspective}
            onSelect={onPerspectiveChange}
            compact
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: Status + Actions */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            {isConnected ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Offline</span>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <IOSButton
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </IOSButton>

          {/* Export Button */}
          <IOSButton
            variant="primary"
            size="sm"
            onClick={onExport}
            aria-label="Export data"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Export</span>
          </IOSButton>
        </div>
      </div>
    </div>
  );
};

export default StickyControlsBar;
