import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { categories, mockModels } from '../data/mockData';
import { useLeaderboard } from '../hooks/useLeaderboard';
import LeaderboardCard from '../components/leaderboard/LeaderboardCard';
import FilterPanel from '../components/filters/FilterPanel';
import ViewModeToggle from '../components/leaderboard/ViewModeToggle';
import { useUIStore } from '../store/uiStore';
import { useFilterStore } from '../store/filterStore';
import type { LeaderboardEntry } from '../types/types';

export default function LeaderboardPage() {
  const { category = 'overall' } = useParams();
  const [selectedCategory, setSelectedCategory] = useState(category);
  const { entries, loading, error } = useLeaderboard(selectedCategory === 'overall' ? undefined : selectedCategory);
  const [hoveredEntry, setHoveredEntry] = useState<LeaderboardEntry | null>(null);
  const [listRef] = useAutoAnimate();
  
  const { viewMode } = useUIStore();
  const { filterEntries, setFilters } = useFilterStore();

  // Get unique organizations and tags for filter options
  const organizations = useMemo(() => {
    const orgs = new Set<string>();
    mockModels.forEach(model => orgs.add(model.organization));
    return Array.from(orgs);
  }, []);
  
  const tags = useMemo(() => {
    const allTags = new Set<string>();
    mockModels.forEach(model => {
      model.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  }, []);
  
  // Apply filters
  const filteredData = useMemo(() => {
    return filterEntries(entries);
  }, [entries, filterEntries]);
  
  useEffect(() => {
    if (error) {
      toast.error('加载数据失败，请稍后重试');
    }
  }, [error]);

  const handleFilterChange = (filters: any) => {
    setFilters(filters);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4"
        >
          AI 艺术创作能力排行榜
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 dark:text-gray-400"
        >
          基于多维度评测的 AI 模型艺术创作能力综合排名
        </motion.p>
      </div>
      
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FilterPanel 
            onFilterChange={handleFilterChange}
            organizations={organizations}
            tags={tags}
          />
          <ViewModeToggle />
        </div>
        <div className="text-sm text-gray-500">
          显示 {filteredData.length} / {entries.length} 个模型
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
                ${selectedCategory === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="text-xl">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">加载中...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Leaderboard Display */}
      {!loading && !error && (
        <div ref={listRef}>
          {viewMode === 'card' || viewMode === 'detailed' ? (
            <div className={`
              grid gap-6
              ${viewMode === 'card' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}
            `}>
              {filteredData.map((entry, index) => (
                <LeaderboardCard
                  key={entry.model.id}
                  entry={entry}
                  index={index}
                  viewMode={viewMode}
                  onHover={setHoveredEntry}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((entry, index) => (
                <LeaderboardCard
                  key={entry.model.id}
                  entry={entry}
                  index={index}
                  viewMode="compact"
                  onHover={setHoveredEntry}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">没有找到符合条件的模型</p>
          <button
            onClick={() => setFilters({})}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            清除所有筛选条件
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {filteredData.length}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">参评模型</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">
            {filteredData[0]?.score.toFixed(1) || 0}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">最高分</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {(filteredData.reduce((acc, e) => acc + e.score, 0) / filteredData.length).toFixed(1)}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">平均分</p>
        </div>
      </div>
    </div>
  );
}