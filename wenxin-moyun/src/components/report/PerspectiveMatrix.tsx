/**
 * PerspectiveMatrix Component
 *
 * Displays scores across 8 cultural perspectives in a matrix format.
 * Key component for understanding cross-cultural performance.
 */

import { motion } from 'framer-motion';
import { Globe, Eye } from 'lucide-react';
import { IOSCard, IOSCardHeader, IOSCardContent } from '../ios/core/IOSCard';

interface PerspectiveScore {
  perspective: string;
  region: 'Eastern' | 'Western' | 'Universal';
  score: number;
  rank: number;
  description: string;
  strengths: string[];
  weaknesses: string[];
}

interface PerspectiveMatrixProps {
  modelName: string;
  perspectives: PerspectiveScore[];
  showDetails?: boolean;
  selectedPerspective?: string;
  onPerspectiveSelect?: (perspective: string) => void;
  className?: string;
}

export function PerspectiveMatrix({
  modelName,
  perspectives,
  showDetails = true,
  selectedPerspective,
  onPerspectiveSelect,
  className = ''
}: PerspectiveMatrixProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-slate-600';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-slate-700 dark:text-slate-500';
    if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'Eastern':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'Western':
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400';
      default:
        return 'bg-amber-100 dark:bg-purple-900/30 text-purple-700 dark:text-amber-400';
    }
  };

  const easternPerspectives = perspectives.filter(p => p.region === 'Eastern');
  const westernPerspectives = perspectives.filter(p => p.region === 'Western');
  const universalPerspectives = perspectives.filter(p => p.region === 'Universal');

  const avgEastern = easternPerspectives.reduce((sum, p) => sum + p.score, 0) / easternPerspectives.length;
  const avgWestern = westernPerspectives.reduce((sum, p) => sum + p.score, 0) / westernPerspectives.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <IOSCard variant="elevated">
        <IOSCardHeader
          emoji={<Globe className="w-6 h-6 text-green-500" />}
          title="8 Cultural Perspectives"
          subtitle={`Cross-cultural performance analysis for ${modelName}`}
        />
        <IOSCardContent>
          {/* Regional Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300 mb-1">Eastern</p>
              <p className={`text-3xl font-bold ${getScoreTextColor(avgEastern)}`}>
                {(avgEastern * 100).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{easternPerspectives.length} perspectives</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/20">
              <p className="text-sm text-slate-700 dark:text-slate-400 mb-1">Western</p>
              <p className={`text-3xl font-bold ${getScoreTextColor(avgWestern)}`}>
                {(avgWestern * 100).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{westernPerspectives.length} perspectives</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-purple-900/20">
              <p className="text-sm text-purple-700 dark:text-amber-400 mb-1">Gap</p>
              <p className={`text-3xl font-bold ${Math.abs(avgEastern - avgWestern) > 0.1 ? 'text-orange-600' : 'text-green-600'}`}>
                {Math.abs((avgEastern - avgWestern) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">{avgEastern > avgWestern ? 'East' : 'West'} bias</p>
            </div>
          </div>

          {/* Perspective Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {perspectives.map((perspective, index) => (
              <motion.button
                key={perspective.perspective}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onPerspectiveSelect?.(perspective.perspective)}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${selectedPerspective === perspective.perspective
                    ? 'border-slate-600 bg-slate-50 dark:bg-slate-900/20'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRegionColor(perspective.region)}`}>
                    {perspective.region}
                  </span>
                  <span className="text-xs text-gray-500">#{perspective.rank}</span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                  {perspective.perspective}
                </h4>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-bold ${getScoreTextColor(perspective.score)}`}>
                    {(perspective.score * 100).toFixed(0)}
                  </span>
                  <div className={`flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
                    <div
                      className={`h-full rounded-full ${getScoreColor(perspective.score)}`}
                      style={{ width: `${perspective.score * 100}%` }}
                    />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected Perspective Details */}
          {showDetails && selectedPerspective && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/20 border border-blue-200 dark:border-slate-800"
            >
              {(() => {
                const selected = perspectives.find(p => p.perspective === selectedPerspective);
                if (!selected) return null;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-5 h-5 text-slate-600" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {selected.perspective} Perspective
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {selected.description}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">Strengths</h5>
                        <ul className="space-y-1">
                          {selected.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-green-500">+</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">Areas for Improvement</h5>
                        <ul className="space-y-1">
                          {selected.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                              <span className="text-red-500">-</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </IOSCardContent>
      </IOSCard>
    </motion.div>
  );
}

export default PerspectiveMatrix;
