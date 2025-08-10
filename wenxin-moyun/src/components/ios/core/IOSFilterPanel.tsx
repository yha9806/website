import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard, IOSCardHeader, IOSCardContent, IOSCardFooter } from './IOSCard';
import { IOSButton } from './IOSButton';
import { IOSToggle } from './IOSToggle';
import { IOSSlider } from './IOSSlider';
import { IOSRangeSlider } from './IOSRangeSlider';
import { EmojiIcon } from './EmojiIcon';
import { iosAnimations } from '../utils/animations';
import { iosColors } from '../utils/iosTheme';

// Core filter interfaces
export interface IOSFilterConfig {
  organizations: string[];
  tags: string[];
  categories: Array<{
    id: string;
    label: string;
    emoji: string;
  }>;
  dateOptions: Array<{
    value: string;
    label: string;
  }>;
  weights?: Array<{
    name: string;
    key: string;
    value: number;
    color: string;
    description?: string;
  }>;
}

export interface IOSFilterValues {
  search: string;
  organizations: string[];
  tags: string[];
  categories: string[];
  scoreRange: [number, number];
  winRateRange: [number, number];
  dateRange: string;
  weights?: Array<{
    name: string;
    key: string;
    value: number;
    color: string;
  }>;
}

export interface IOSFilterPanelProps {
  config: IOSFilterConfig;
  values: IOSFilterValues;
  onChange: (values: IOSFilterValues) => void;
  onReset?: () => void;
  showWeights?: boolean;
  showAdvanced?: boolean;
  className?: string;
}

type FilterTab = 'basic' | 'advanced' | 'weights';

export const IOSFilterPanel: React.FC<IOSFilterPanelProps> = ({
  config,
  values,
  onChange,
  onReset,
  showWeights = false,
  showAdvanced = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('basic');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle filter changes
  const handleChange = <K extends keyof IOSFilterValues>(
    key: K,
    value: IOSFilterValues[K]
  ) => {
    onChange({
      ...values,
      [key]: value
    });
  };

  // Reset all filters
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      const resetValues: IOSFilterValues = {
        search: '',
        organizations: [],
        tags: [],
        categories: [],
        scoreRange: [0, 100],
        winRateRange: [0, 100],
        dateRange: 'all',
        ...(showWeights && config.weights && {
          weights: config.weights.map(w => ({
            ...w,
            value: 100 / config.weights!.length
          }))
        })
      };
      onChange(resetValues);
    }
    setIsOpen(false);
  };

  // Calculate active filter count
  const activeFilterCount = [
    values.search.length > 0,
    values.organizations.length > 0,
    values.tags.length > 0,
    values.categories.length > 0,
    values.scoreRange[0] > 0 || values.scoreRange[1] < 100,
    values.winRateRange[0] > 0 || values.winRateRange[1] < 100,
    values.dateRange !== 'all',
    ...(showWeights && values.weights ? 
      [values.weights.some(w => Math.abs(w.value - 100 / values.weights!.length) > 1)] : 
      []
    )
  ].filter(Boolean).length;

  // Generate tab configurations
  const tabs = [
    { 
      id: 'basic' as const, 
      label: 'Basic', 
      emoji: 'search',
      show: true
    },
    { 
      id: 'advanced' as const, 
      label: 'Advanced', 
      emoji: 'sliders',
      show: showAdvanced
    },
    { 
      id: 'weights' as const, 
      label: 'Weights', 
      emoji: 'balance',
      show: showWeights && !!config.weights
    }
  ].filter(tab => tab.show);

  // Toggle array values
  const toggleArrayValue = <T,>(array: T[], value: T): T[] => {
    return array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Filter Trigger Button */}
      <IOSButton
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen || activeFilterCount > 0 ? 'primary' : 'secondary'}
        glassMorphism={activeFilterCount === 0}
        className="relative"
      >
        <EmojiIcon category="actions" name="filter" size="sm" />
        <span>Filter</span>
        
        {/* Active filter count badge */}
        {activeFilterCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {activeFilterCount}
          </motion.span>
        )}
        
        <EmojiIcon 
          category="actions" 
          name="chevron-down" 
          size="sm"
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </IOSButton>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={iosAnimations.spring}
            className="absolute top-full left-0 mt-3 w-96 z-50"
          >
            <IOSCard variant="elevated" className="shadow-2xl">
              <IOSCardHeader
                title="Advanced Filters"
                emoji={<EmojiIcon category="actions" name="filter" size="md" />}
                action={
                  <IOSButton
                    onClick={() => setIsOpen(false)}
                    variant="text"
                    size="sm"
                  >
                    <EmojiIcon category="actions" name="close" size="sm" />
                  </IOSButton>
                }
              />

              {/* Tab Navigation */}
              {tabs.length > 1 && (
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                        ${activeTab === tab.id
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                        }
                      `}
                    >
                      <EmojiIcon category="actions" name={tab.emoji} size="sm" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <IOSCardContent className="p-6 max-h-96 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Basic Filters Tab */}
                  {activeTab === 'basic' && (
                    <motion.div
                      key="basic"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={iosAnimations.spring}
                      className="space-y-6"
                    >
                      {/* Search Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Search Models
                        </label>
                        <div className="relative">
                          <EmojiIcon 
                            category="actions" 
                            name="search" 
                            size="sm"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            value={values.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                            placeholder="Enter model name..."
                            className="w-full pl-10 pr-3 py-2.5 ios-glass border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Organizations */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          <EmojiIcon category="content" name="organization" size="sm" />
                          Organizations
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {config.organizations.slice(0, 8).map((org) => (
                            <label key={org} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <input
                                type="checkbox"
                                checked={values.organizations.includes(org)}
                                onChange={() => handleChange('organizations', toggleArrayValue(values.organizations, org))}
                                className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {org}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Categories */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          <EmojiIcon category="content" name="category" size="sm" />
                          Model Types
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {config.categories.map((category) => (
                            <IOSButton
                              key={category.id}
                              onClick={() => handleChange('categories', toggleArrayValue(values.categories, category.id))}
                              variant={values.categories.includes(category.id) ? 'primary' : 'secondary'}
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <span className="mr-1">{category.emoji}</span>
                              {category.label}
                            </IOSButton>
                          ))}
                        </div>
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <EmojiIcon category="actions" name="calendar" size="sm" />
                          Release Time
                        </label>
                        <select
                          value={values.dateRange}
                          onChange={(e) => handleChange('dateRange', e.target.value)}
                          className="w-full px-3 py-2.5 ios-glass border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        >
                          {config.dateOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          <EmojiIcon category="content" name="tag" size="sm" />
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {config.tags.slice(0, 12).map((tag) => (
                            <IOSButton
                              key={tag}
                              onClick={() => handleChange('tags', toggleArrayValue(values.tags, tag))}
                              variant={values.tags.includes(tag) ? 'primary' : 'secondary'}
                              size="sm"
                              className="text-xs flex-shrink-0"
                            >
                              {tag}
                            </IOSButton>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Advanced Filters Tab */}
                  {activeTab === 'advanced' && showAdvanced && (
                    <motion.div
                      key="advanced"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={iosAnimations.spring}
                      className="space-y-6"
                    >
                      {/* Score Range */}
                      <IOSRangeSlider
                        value={values.scoreRange}
                        onChange={(value) => handleChange('scoreRange', value)}
                        min={0}
                        max={100}
                        step={5}
                        color="primary"
                        size="md"
                        label="Score Range"
                        showValues={true}
                        formatValue={(v) => v.toString()}
                      />

                      {/* Win Rate Range */}
                      <IOSRangeSlider
                        value={values.winRateRange}
                        onChange={(value) => handleChange('winRateRange', value)}
                        min={0}
                        max={100}
                        step={5}
                        color="green"
                        size="md"
                        label="Win Rate Range"
                        showValues={true}
                        unit="%"
                        formatValue={(v) => v.toString()}
                      />
                    </motion.div>
                  )}

                  {/* Weight Adjustment Tab */}
                  {activeTab === 'weights' && showWeights && config.weights && values.weights && (
                    <motion.div
                      key="weights"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={iosAnimations.spring}
                      className="space-y-4"
                    >
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Adjust the importance of different evaluation criteria
                      </div>
                      
                      {values.weights.map((weight, index) => (
                        <IOSSlider
                          key={weight.key}
                          value={weight.value}
                          onChange={(value) => {
                            const newWeights = [...values.weights!];
                            newWeights[index] = { ...weight, value };
                            handleChange('weights', newWeights);
                          }}
                          min={0}
                          max={100}
                          step={5}
                          color="primary"
                          size="md"
                          label={weight.name}
                          showValue={true}
                          formatValue={(v) => `${v.toFixed(0)}%`}
                        />
                      ))}

                      {/* Weight normalization */}
                      <div className="mt-4 p-3 ios-glass rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total: {values.weights.reduce((sum, w) => sum + w.value, 0).toFixed(0)}%
                          </span>
                          <IOSButton
                            onClick={() => {
                              const equalWeight = 100 / values.weights!.length;
                              const normalizedWeights = values.weights!.map(w => ({
                                ...w,
                                value: equalWeight
                              }));
                              handleChange('weights', normalizedWeights);
                            }}
                            variant="text"
                            size="sm"
                          >
                            <EmojiIcon category="actions" name="refresh" size="sm" />
                            Normalize
                          </IOSButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </IOSCardContent>

              <IOSCardFooter>
                <div className="flex items-center justify-between w-full">
                  <IOSButton
                    onClick={handleReset}
                    variant="text"
                    disabled={activeFilterCount === 0}
                  >
                    <EmojiIcon category="actions" name="refresh" size="sm" />
                    Reset All
                  </IOSButton>
                  
                  <div className="flex gap-2">
                    <IOSButton
                      onClick={() => setIsOpen(false)}
                      variant="secondary"
                    >
                      Close
                    </IOSButton>
                    <IOSButton
                      onClick={() => setIsOpen(false)}
                      variant="primary"
                    >
                      <EmojiIcon category="status" name="check" size="sm" />
                      Apply
                    </IOSButton>
                  </div>
                </div>
              </IOSCardFooter>
            </IOSCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Display (when panel is closed) */}
      {!isOpen && activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-2 flex flex-wrap gap-2 max-w-md z-40"
        >
          {values.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              <EmojiIcon category="actions" name="search" size="xs" />
              {values.search}
              <button onClick={() => handleChange('search', '')}>
                <EmojiIcon category="actions" name="close" size="xs" />
              </button>
            </span>
          )}
          
          {values.organizations.slice(0, 3).map((org) => (
            <span key={org} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
              <EmojiIcon category="content" name="organization" size="xs" />
              {org}
              <button onClick={() => handleChange('organizations', values.organizations.filter(o => o !== org))}>
                <EmojiIcon category="actions" name="close" size="xs" />
              </button>
            </span>
          ))}
          
          {activeFilterCount > 4 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              +{activeFilterCount - 4} more
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};