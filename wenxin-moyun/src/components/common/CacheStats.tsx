import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard, IOSCardContent, IOSButton } from '../ios';
import { useCacheStats } from '../../utils/cache';
import { cacheUtils } from '../../services/api';

interface CacheStatsProps {
  show?: boolean;
}

export const CacheStats: React.FC<CacheStatsProps> = ({ show = false }) => {
  const [isVisible, setIsVisible] = useState(show);
  const stats = useCacheStats();

  // Show/hide with keyboard shortcut (Ctrl+Shift+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleWarmUp = async () => {
    await cacheUtils.warmUp();
  };

  const handleClearAll = () => {
    cacheUtils.clearAll();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <IOSCard variant="glass" className="backdrop-blur-xl border border-white/30 dark:border-white/10">
          <IOSCardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                📊 Cache Stats
              </h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {/* API Cache */}
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  🔄 API Cache
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-mono ml-1">{stats.api.total}</span>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-400">Fresh:</span>
                    <span className="font-mono ml-1">{stats.api.fresh}</span>
                  </div>
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">Stale:</span>
                    <span className="font-mono ml-1">{stats.api.stale}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                    <span className="font-mono ml-1">{stats.api.hitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Static Cache */}
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  📚 Static Cache
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-mono ml-1">{stats.static.total}</span>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-400">Fresh:</span>
                    <span className="font-mono ml-1">{stats.static.fresh}</span>
                  </div>
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">Stale:</span>
                    <span className="font-mono ml-1">{stats.static.stale}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                    <span className="font-mono ml-1">{stats.static.hitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Realtime Cache */}
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                  ⚡ Realtime Cache
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-mono ml-1">{stats.realtime.total}</span>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-400">Fresh:</span>
                    <span className="font-mono ml-1">{stats.realtime.fresh}</span>
                  </div>
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">Stale:</span>
                    <span className="font-mono ml-1">{stats.realtime.stale}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                    <span className="font-mono ml-1">{stats.realtime.hitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* User Cache */}
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                  👤 User Cache
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-mono ml-1">{stats.user.total}</span>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-400">Fresh:</span>
                    <span className="font-mono ml-1">{stats.user.fresh}</span>
                  </div>
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">Stale:</span>
                    <span className="font-mono ml-1">{stats.user.stale}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                    <span className="font-mono ml-1">{stats.user.hitRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <IOSButton
                variant="secondary"
                size="sm"
                onClick={handleWarmUp}
                className="flex-1 text-xs"
              >
                🔥 Warm Up
              </IOSButton>
              <IOSButton
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                className="flex-1 text-xs"
              >
                🗑️ Clear All
              </IOSButton>
            </div>

            <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
              Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+C</kbd> to toggle
            </div>
          </IOSCardContent>
        </IOSCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default CacheStats;