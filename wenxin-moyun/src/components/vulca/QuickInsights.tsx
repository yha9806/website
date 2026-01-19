/**
 * QuickInsights - Automatic insight cards based on comparison data
 * Shows key findings like highest/lowest scores, biggest differences, etc.
 */

import React from 'react';
import { TrendingUp, Shuffle, Award, AlertTriangle } from 'lucide-react';
import type { VULCAEvaluation } from '../../types/vulca';

interface QuickInsightsProps {
  evaluations: VULCAEvaluation[];
  viewMode: '6d' | '47d';
}

interface Insight {
  id: string;
  type: 'positive' | 'neutral' | 'warning';
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

export const QuickInsights: React.FC<QuickInsightsProps> = ({
  evaluations,
  viewMode,
}) => {
  // Generate insights from the data
  const insights: Insight[] = React.useMemo(() => {
    const result: Insight[] = [];

    if (!evaluations || evaluations.length === 0) {
      return result;
    }

    // Find model with highest average score
    const modelScores = evaluations.map(e => {
      const scores = viewMode === '6d'
        ? Object.values(e.scores6D || {})
        : Object.values(e.scores47D || {});
      const validScores = scores.filter(s => s != null && !isNaN(s as number)) as number[];
      const avg = validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : 0;
      return { modelName: e.modelName, average: avg };
    }).sort((a, b) => b.average - a.average);

    if (modelScores.length > 0 && modelScores[0].average > 0) {
      result.push({
        id: 'highest-avg',
        type: 'positive',
        icon: <Award className="w-4 h-4" />,
        title: 'Highest Overall',
        value: modelScores[0].modelName,
        description: `Average score: ${modelScores[0].average.toFixed(1)}`,
      });
    }

    // Find the dimension with most variance (biggest difference between models)
    // Calculate dimension differences from evaluations directly
    if (evaluations.length >= 2) {
      const dimensionRanges: { dim: string; diff: number }[] = [];
      const scores = viewMode === '6d' ? evaluations[0]?.scores6D : evaluations[0]?.scores47D;

      if (scores) {
        Object.keys(scores).forEach(dim => {
          const dimScores = evaluations
            .map(e => {
              const s = viewMode === '6d' ? e.scores6D : e.scores47D;
              return s?.[dim as keyof typeof s] as number | undefined;
            })
            .filter((s): s is number => s != null && !isNaN(s));

          if (dimScores.length >= 2) {
            const max = Math.max(...dimScores);
            const min = Math.min(...dimScores);
            dimensionRanges.push({ dim, diff: max - min });
          }
        });
      }

      const sortedDiffs = dimensionRanges.sort((a, b) => b.diff - a.diff);
      if (sortedDiffs.length > 0 && sortedDiffs[0].diff > 5) {
        result.push({
          id: 'most-different',
          type: 'neutral',
          icon: <Shuffle className="w-4 h-4" />,
          title: 'Biggest Gap',
          value: formatDimensionName(sortedDiffs[0].dim),
          description: `${sortedDiffs[0].diff.toFixed(1)} point difference`,
        });
      }
    }

    // Find strength area (highest single dimension)
    const allDimScores: { dim: string; score: number; model: string }[] = [];
    evaluations.forEach(e => {
      const scores = viewMode === '6d' ? e.scores6D : e.scores47D;
      if (scores) {
        Object.entries(scores).forEach(([dim, score]) => {
          if (score != null && !isNaN(score as number)) {
            allDimScores.push({ dim, score: score as number, model: e.modelName });
          }
        });
      }
    });

    const topScore = allDimScores.sort((a, b) => b.score - a.score)[0];
    if (topScore && topScore.score >= 85) {
      result.push({
        id: 'top-dimension',
        type: 'positive',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Top Performance',
        value: `${topScore.model}`,
        description: `${formatDimensionName(topScore.dim)}: ${topScore.score.toFixed(0)}`,
      });
    }

    // Find weakness area (lowest dimension across all)
    const bottomScore = allDimScores.sort((a, b) => a.score - b.score)[0];
    if (bottomScore && bottomScore.score < 60) {
      result.push({
        id: 'weakness',
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Area to Watch',
        value: formatDimensionName(bottomScore.dim),
        description: `${bottomScore.model}: ${bottomScore.score.toFixed(0)}`,
      });
    }

    return result.slice(0, 4); // Max 4 insights
  }, [evaluations, viewMode]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Quick Insights
      </h3>
      {/* Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            className={`p-3 md:p-4 rounded-xl border transition-all duration-200 hover:shadow-md
              ${insight.type === 'positive'
                ? 'bg-green-50/80 dark:bg-green-900/30 border-green-200/60 dark:border-green-700/50 hover:border-green-300 dark:hover:border-green-600'
                : insight.type === 'warning'
                  ? 'bg-orange-50/80 dark:bg-orange-900/30 border-orange-200/60 dark:border-orange-700/50 hover:border-orange-300 dark:hover:border-orange-600'
                  : 'bg-gray-50/80 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`flex-shrink-0
                ${insight.type === 'positive'
                  ? 'text-green-600 dark:text-green-400'
                  : insight.type === 'warning'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                {insight.icon}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {insight.title}
              </span>
            </div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate">
              {insight.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {insight.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper to format dimension names
function formatDimensionName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default QuickInsights;
