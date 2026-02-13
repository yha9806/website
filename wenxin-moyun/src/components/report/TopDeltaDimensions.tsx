/**
 * TopDeltaDimensions Component
 *
 * Shows the dimensions with the largest score differences between models.
 * Key diagnostic component for identifying strengths and weaknesses.
 */

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { IOSCard, IOSCardHeader, IOSCardContent } from '../ios/core/IOSCard';

interface DimensionDelta {
  name: string;
  category: string;
  model1Score: number;
  model2Score: number;
  delta: number;
  significance: 'high' | 'medium' | 'low';
  recommendation?: string;
}

interface TopDeltaDimensionsProps {
  model1Name: string;
  model2Name: string;
  dimensions: DimensionDelta[];
  showRecommendations?: boolean;
  maxItems?: number;
  className?: string;
}

export function TopDeltaDimensions({
  model1Name,
  model2Name,
  dimensions,
  showRecommendations = true,
  maxItems = 5,
  className = ''
}: TopDeltaDimensionsProps) {
  const sortedDimensions = [...dimensions]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, maxItems);

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-slate-600 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <IOSCard variant="elevated">
        <IOSCardHeader
          emoji={<TrendingUp className="w-6 h-6 text-green-500" />}
          title="Top-Δ Dimensions"
          subtitle={`Performance gaps: ${model1Name} vs ${model2Name}`}
        />
        <IOSCardContent>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{model1Name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{model2Name}</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                High Impact
              </span>
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-yellow-500" />
                Medium
              </span>
            </div>
          </div>

          {/* Dimension List */}
          <div className="space-y-4">
            {sortedDimensions.map((dim, index) => (
              <motion.div
                key={dim.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-l-4 ${getSignificanceColor(dim.significance)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getSignificanceIcon(dim.significance)}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{dim.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{dim.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${dim.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dim.delta > 0 ? '+' : ''}{(dim.delta * 100).toFixed(1)}%
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">difference</span>
                  </div>
                </div>

                {/* Score Comparison */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{model1Name}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${dim.model1Score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                      {(dim.model1Score * 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{model2Name}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-400 rounded-full transition-all duration-500"
                        style={{ width: `${dim.model2Score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                      {(dim.model2Score * 100).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Recommendation */}
                {showRecommendations && dim.recommendation && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-500 flex-shrink-0">Insight:</span>
                      {dim.recommendation}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analysis of {dimensions.length} dimensions reveals {sortedDimensions.filter(d => d.delta > 0).length} areas
              where {model1Name} outperforms {model2Name}. Focus areas for improvement are highlighted above.
            </p>
          </div>
        </IOSCardContent>
      </IOSCard>
    </motion.div>
  );
}

export default TopDeltaDimensions;
