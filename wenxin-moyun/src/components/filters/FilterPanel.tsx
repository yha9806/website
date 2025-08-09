import { useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { 
  Filter, 
  X, 
  ChevronDown, 
  Building2, 
  Tag, 
  Calendar,
  Sliders,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  organizations: string[];
  tags: string[];
}

export interface FilterState {
  search: string;
  organizations: string[];
  categories: string[];
  scoreRange: [number, number];
  dateRange: string;
  tags: string[];
}

const initialFilterState: FilterState = {
  search: '',
  organizations: [],
  categories: [],
  scoreRange: [0, 100],
  dateRange: 'all',
  tags: []
};

export default function FilterPanel({ onFilterChange, organizations, tags }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
    
    // Count active filters
    let count = 0;
    if (newFilters.search) count++;
    if (newFilters.organizations.length > 0) count++;
    if (newFilters.categories.length > 0) count++;
    if (newFilters.scoreRange[0] > 0 || newFilters.scoreRange[1] < 100) count++;
    if (newFilters.dateRange !== 'all') count++;
    if (newFilters.tags.length > 0) count++;
    setActiveFiltersCount(count);
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    onFilterChange(initialFilterState);
    setActiveFiltersCount(0);
  };

  const categoryOptions = [
    { id: 'text', label: '文本生成', icon: '📝' },
    { id: 'visual', label: '视觉创作', icon: '🎨' },
    { id: 'multimodal', label: '多模态', icon: '🔀' }
  ];

  const dateOptions = [
    { value: 'all', label: '全部时间' },
    { value: '7d', label: '最近7天' },
    { value: '30d', label: '最近30天' },
    { value: '90d', label: '最近3个月' },
    { value: '365d', label: '最近1年' }
  ];

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:shadow-md transition-all"
      >
        <Filter className="w-5 h-5" />
        <span>筛选</span>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="absolute top-full mt-2 left-0 right-0 md:left-auto md:right-auto md:w-96 bg-neutral-50 dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              高级筛选
            </h3>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  清除全部
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              搜索模型
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="输入模型名称..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-neutral-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Organizations */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building2 className="w-4 h-4" />
              开发组织
            </label>
            <div className="grid grid-cols-2 gap-2">
              {organizations.slice(0, 6).map((org) => (
                <label
                  key={org}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.organizations.includes(org)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilters({ organizations: [...filters.organizations, org] });
                      } else {
                        updateFilters({ 
                          organizations: filters.organizations.filter(o => o !== org) 
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{org}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              模型类型
            </label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (filters.categories.includes(cat.id)) {
                      updateFilters({ 
                        categories: filters.categories.filter(c => c !== cat.id) 
                      });
                    } else {
                      updateFilters({ categories: [...filters.categories, cat.id] });
                    }
                  }}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${filters.categories.includes(cat.id)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score Range */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Sliders className="w-4 h-4" />
              评分范围: {filters.scoreRange[0]} - {filters.scoreRange[1]}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange[0]}
                onChange={(e) => updateFilters({ 
                  scoreRange: [parseInt(e.target.value), filters.scoreRange[1]] 
                })}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange[1]}
                onChange={(e) => updateFilters({ 
                  scoreRange: [filters.scoreRange[0], parseInt(e.target.value)] 
                })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4" />
              发布时间
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilters({ dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-neutral-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
            >
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4" />
              标签
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (filters.tags.includes(tag)) {
                      updateFilters({ tags: filters.tags.filter(t => t !== tag) });
                    } else {
                      updateFilters({ tags: [...filters.tags, tag] });
                    }
                  }}
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium transition-all
                    ${filters.tags.includes(tag)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                      搜索: {filters.search}
                      <button onClick={() => updateFilters({ search: '' })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.organizations.map((org) => (
                    <span key={org} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {org}
                      <button onClick={() => updateFilters({ 
                        organizations: filters.organizations.filter(o => o !== org) 
                      })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </Transition>
    </div>
  );
}