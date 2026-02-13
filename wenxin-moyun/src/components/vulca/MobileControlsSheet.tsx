/**
 * MobileControlsSheet - Mobile-optimized controls for VULCA Demo
 * Uses IOSSheet for bottom sheet UI pattern on mobile devices
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Settings2,
  ChevronDown,
  Check,
  Globe,
  Layers,
  RefreshCw,
  Download,
  X
} from 'lucide-react';
import { IOSSheet } from '../ios/core/IOSSheet';
import { IOSButton } from '../ios/core/IOSButton';
import type { ViewMode, ViewLevel } from '../../types/vulca';

interface MobileControlsSheetProps {
  visible: boolean;
  onClose: () => void;

  // Models
  availableModels: Array<{ id: string; name: string; organization: string }>;
  selectedModels: string[];
  onModelSelect: (modelId: string) => void;

  // View Mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // View Level
  viewLevel: ViewLevel;
  onViewLevelChange: (level: ViewLevel) => void;

  // Cultural Perspective
  perspectives: string[];
  culturalPerspective: string;
  onPerspectiveChange: (perspective: string) => void;

  // Actions
  onExport: () => void;
  onRefresh: () => void;
  loading: boolean;
}

// View mode options
const viewModeOptions = [
  { mode: '6d' as const, level: 'overview' as const, label: '6D Overview', description: 'High-level 6 dimension analysis' },
  { mode: '47d' as const, level: 'grouped' as const, label: '47D Grouped', description: 'Grouped by cultural categories' },
  { mode: '47d' as const, level: 'detailed' as const, label: '47D Full', description: 'All 47 dimensions detailed view' },
];

// Section component for organizing controls
const ControlSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// Option button for selections
const OptionButton: React.FC<{
  selected: boolean;
  label: string;
  description?: string;
  onClick: () => void;
  emoji?: string;
}> = ({ selected, label, description, onClick, emoji }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
      ${selected
        ? 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-500'
        : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
      }`}
  >
    {emoji && (
      <span className="text-xl">{emoji}</span>
    )}
    <div className="flex-1 text-left">
      <p className={`font-medium ${selected ? 'text-slate-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
        {label}
      </p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      )}
    </div>
    {selected && (
      <Check className="w-5 h-5 text-slate-600 dark:text-slate-400" />
    )}
  </button>
);

export const MobileControlsSheet: React.FC<MobileControlsSheetProps> = ({
  visible,
  onClose,
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
  loading,
}) => {
  const handleViewModeSelect = (mode: ViewMode, level: ViewLevel) => {
    onViewModeChange(mode);
    onViewLevelChange(level);
  };

  // Perspective emoji mapping
  const perspectiveEmoji: Record<string, string> = {
    'Universal': '🌐',
    'Western': '🏛️',
    'Eastern': '🏯',
    'African': '🌍',
    'Latin American': '🎭',
    'Islamic': '🕌',
    'South Asian': '🕉️',
    'Southeast Asian': '🌺',
  };

  return (
    <IOSSheet
      visible={visible}
      onClose={onClose}
      height="large"
      showHandle={true}
      allowDismiss={true}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Visualization Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure your analysis view
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* View Mode Section */}
          <ControlSection title="View Mode" icon={<Layers className="w-4 h-4" />}>
            <div className="space-y-2">
              {viewModeOptions.map((option) => (
                <OptionButton
                  key={`${option.mode}-${option.level}`}
                  selected={viewMode === option.mode && (viewMode === '6d' || viewLevel === option.level)}
                  label={option.label}
                  description={option.description}
                  onClick={() => handleViewModeSelect(option.mode, option.level)}
                />
              ))}
            </div>
          </ControlSection>

          {/* Cultural Perspective Section */}
          <ControlSection title="Cultural Perspective" icon={<Globe className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-2">
              {perspectives.map((perspective) => (
                <OptionButton
                  key={perspective}
                  selected={culturalPerspective === perspective}
                  label={perspective}
                  emoji={perspectiveEmoji[perspective] || '🌐'}
                  onClick={() => onPerspectiveChange(perspective)}
                />
              ))}
            </div>
          </ControlSection>

          {/* Models Section */}
          <ControlSection title={`Models (${selectedModels.length} selected)`} icon={<Settings2 className="w-4 h-4" />}>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableModels.map((model) => (
                <OptionButton
                  key={model.id}
                  selected={selectedModels.includes(model.id)}
                  label={model.name}
                  description={model.organization}
                  onClick={() => onModelSelect(model.id)}
                />
              ))}
            </div>
          </ControlSection>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <IOSButton
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </IOSButton>
            <IOSButton
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={onExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </IOSButton>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-3 py-3 text-center text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </IOSSheet>
  );
};

// Compact trigger button for mobile
export const MobileControlsTrigger: React.FC<{
  onClick: () => void;
  selectedModelsCount: number;
  viewMode: ViewMode;
  viewLevel: ViewLevel;
  culturalPerspective: string;
}> = ({ onClick, selectedModelsCount, viewMode, viewLevel, culturalPerspective }) => {
  const viewLabel = viewMode === '6d' ? '6D' : viewLevel === 'grouped' ? '47D Grp' : '47D Full';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full"
    >
      <Settings2 className="w-4 h-4 text-gray-500" />
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
          {selectedModelsCount} models
        </span>
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
          {viewLabel}
        </span>
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded truncate">
          {culturalPerspective}
        </span>
      </div>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </motion.button>
  );
};

export default MobileControlsSheet;
