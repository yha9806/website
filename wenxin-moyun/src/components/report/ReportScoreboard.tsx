/**
 * ReportScoreboard Component
 *
 * Executive summary scoreboard for VULCA evaluation reports.
 * Shows key metrics at a glance: overall score, dimension breakdown, ranking.
 */

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Award, Target, Layers } from 'lucide-react';
import { IOSCard, IOSCardHeader, IOSCardContent } from '../ios/core/IOSCard';

interface ScoreData {
  modelName: string;
  organization: string;
  overallScore: number;
  rank: number;
  totalModels: number;
  dimensions: {
    name: string;
    score: number;
    change?: number;
  }[];
  evaluationDate: string;
  version: string;
}

interface ReportScoreboardProps {
  data: ScoreData;
  showComparison?: boolean;
  className?: string;
}

export function ReportScoreboard({
  data,
  showComparison = true,
  className = ''
}: ReportScoreboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-slate-700 dark:text-slate-500';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 0.6) return 'bg-slate-100 dark:bg-slate-900/30';
    if (score >= 0.4) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: 'bg-yellow-400', label: '1st' };
    if (rank === 2) return { color: 'bg-gray-300', label: '2nd' };
    if (rank === 3) return { color: 'bg-orange-400', label: '3rd' };
    return { color: 'bg-slate-600', label: `#${rank}` };
  };

  const rankBadge = getRankBadge(data.rank);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <IOSCard variant="elevated">
        <IOSCardHeader
          emoji={<Award className="w-6 h-6 text-slate-600" />}
          title="Evaluation Scoreboard"
          subtitle={`${data.modelName} • ${data.organization}`}
        />
        <IOSCardContent>
          {/* Main Score Display */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(data.overallScore)}`}>
                {(data.overallScore * 100).toFixed(1)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Overall Score</p>
            </div>

            {/* Rank */}
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${rankBadge.color} flex items-center justify-center`}>
                <span className="text-xl font-bold text-white">{rankBadge.label}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  #{data.rank}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  of {data.totalModels} models
                </p>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-500">
                  <Layers className="w-4 h-4" />
                  <span className="text-xl font-bold">47</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dimensions</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                  <Target className="w-4 h-4" />
                  <span className="text-xl font-bold">8</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Perspectives</p>
              </div>
            </div>
          </div>

          {/* 6D Core Dimensions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              6D Core Dimensions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.dimensions.slice(0, 6).map((dim) => (
                <div
                  key={dim.name}
                  className={`p-3 rounded-xl ${getScoreBgColor(dim.score)} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {dim.name}
                    </span>
                    {showComparison && getTrendIcon(dim.change)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${getScoreColor(dim.score)}`}>
                      {(dim.score * 100).toFixed(0)}
                    </span>
                    {dim.change && (
                      <span className={`text-xs ${dim.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {dim.change > 0 ? '+' : ''}{(dim.change * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Version: <span className="font-medium">{data.version}</span></span>
            <span>Evaluated: <span className="font-medium">{data.evaluationDate}</span></span>
          </div>
        </IOSCardContent>
      </IOSCard>
    </motion.div>
  );
}

export default ReportScoreboard;
