import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Users, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { animated, useSpring } from 'react-spring';
import type { LeaderboardEntry } from '../../types/types';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  index: number;
  viewMode: 'card' | 'compact' | 'detailed';
  onHover?: (entry: LeaderboardEntry | null) => void;
}

export default function LeaderboardCard({ entry, index, viewMode, onHover }: LeaderboardCardProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const animatedProps = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    delay: index * 50,
  });

  const progressAnimation = useSpring({
    from: { width: '0%' },
    to: { width: `${entry.winRate}%` },
    delay: index * 50 + 200,
  });

  if (viewMode === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all"
        onMouseEnter={() => onHover?.(entry)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(entry.rank)}`}>
            {entry.rank}
          </div>
          <img src={entry.model.avatar} alt={entry.model.name} className="w-10 h-10 rounded-lg" />
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{entry.model.name}</h4>
            <p className="text-xs text-gray-500">{entry.model.organization}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-primary-600">{entry.score.toFixed(1)}</span>
          {getTrendIcon(entry.change)}
        </div>
      </motion.div>
    );
  }

  return (
    <animated.div style={animatedProps}>
      <motion.div
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden
          hover:shadow-2xl transition-all duration-300 cursor-pointer
          ${viewMode === 'detailed' ? 'p-6' : 'p-4'}
        `}
        onMouseEnter={() => onHover?.(entry)}
        onMouseLeave={() => onHover?.(null)}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Rank Badge */}
            <div className={`
              ${entry.rank <= 3 ? 'w-12 h-12' : 'w-10 h-10'}
              rounded-xl flex items-center justify-center font-bold shadow-md
              ${getRankStyle(entry.rank)}
            `}>
              {entry.rank <= 3 ? (
                <Trophy className="w-6 h-6" />
              ) : (
                <span className="text-lg">{entry.rank}</span>
              )}
            </div>
            
            {/* Model Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <img 
                  src={entry.model.avatar} 
                  alt={entry.model.name}
                  className="w-12 h-12 rounded-lg object-cover shadow-sm"
                />
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                    {entry.model.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.model.organization}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center gap-1">
              {getTrendIcon(entry.change)}
              {entry.change !== 0 && (
                <span className={`text-xs font-medium ${
                  entry.change > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {Math.abs(entry.change)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {entry.score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <Star className="w-3 h-3" />
              综合评分
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {entry.winRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" />
              胜率
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {entry.battles}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              对战数
            </div>
          </div>
        </div>

        {/* Win Rate Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>胜率分布</span>
            <span>{entry.winRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <animated.div
              className="h-full bg-green-500 rounded-full"
              style={progressAnimation}
            />
          </div>
        </div>

        {/* Tags */}
        {viewMode === 'detailed' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {entry.model.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metrics Preview (for detailed view) */}
        {viewMode === 'detailed' && (
          <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {Object.entries({
              '韵律': entry.model.metrics.rhythm,
              '构图': entry.model.metrics.composition,
              '叙事': entry.model.metrics.narrative,
            }).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">{key}</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Link
          to={`/model/${entry.model.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          <span className="text-sm font-medium">查看详情</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </animated.div>
  );
}