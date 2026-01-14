import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, TrendingUp, Target, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../services/api';
import type { EvaluationTask } from '../../types/types';

interface ScoringAdvice {
  task_type: string;
  typical_score_ranges: Record<string, [number, number]>;
  focus_areas: string[];
  evaluation_tips: string[];
  common_patterns: {
    strengths: string[];
    areas_for_improvement: string[];
  };
}

interface DimensionGuidance {
  dimension: string;
  typical_range: {
    min: number;
    max: number;
    average: number;
  };
  scoring_guidelines: string[];
  quality_indicators: string[];
}

interface ScoringAssistantProps {
  evaluationTask: EvaluationTask;
  selectedDimension?: string;
  onScoreChange?: (dimension: string, score: number) => void;
  isVisible: boolean;
}

const ScoringAssistant: React.FC<ScoringAssistantProps> = ({
  evaluationTask,
  selectedDimension,
  onScoreChange,
  isVisible
}) => {
  const [advice, setAdvice] = useState<ScoringAdvice | null>(null);
  const [dimensionGuidance, setDimensionGuidance] = useState<DimensionGuidance | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    tips: false,
    ranges: true,
    guidance: false,
    patterns: false
  });

  // Load general advice for task type
  useEffect(() => {
    if (!evaluationTask.taskType) return;

    const loadAdvice = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/scoring-advice/task-type/${evaluationTask.taskType}`);
        setAdvice(response.data);
      } catch (error) {
        console.error('Failed to load scoring advice:', error);
        // Fallback to mock data
        setAdvice({
          task_type: evaluationTask.taskType,
          typical_score_ranges: {
            rhythm: [75, 90],
            composition: [70, 85], 
            narrative: [80, 95],
            emotion: [75, 90],
            creativity: [70, 90],
            cultural: [80, 95]
          },
          focus_areas: ['整体质量', '创意表现', '技术水平'],
          evaluation_tips: ['请综合考虑作品的整体表现'],
          common_patterns: {
            strengths: ['表现良好的方面'],
            areas_for_improvement: ['可以改进的地方']
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadAdvice();
  }, [evaluationTask.taskType]);

  // Load dimension-specific guidance
  useEffect(() => {
    if (!selectedDimension || !evaluationTask.taskType) {
      setDimensionGuidance(null);
      return;
    }

    const loadDimensionGuidance = async () => {
      try {
        const response = await apiClient.get(
          `/scoring-advice/dimension/${evaluationTask.taskType}/${selectedDimension}`
        );
        setDimensionGuidance(response.data);
      } catch (error) {
        console.error('Failed to load dimension guidance:', error);
        setDimensionGuidance(null);
      }
    };

    loadDimensionGuidance();
  }, [evaluationTask.taskType, selectedDimension]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDimensionRange = (dimension: string) => {
    if (!advice?.typical_score_ranges) return null;
    const range = advice.typical_score_ranges[dimension];
    return range ? { min: range[0], max: range[1] } : null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-slate-700';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-neutral-50 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-md"
    >
      <div className="flex items-center space-x-2 mb-4">
        <HelpCircle className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">评分助手</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Dimension Guidance */}
          {dimensionGuidance && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-3 border-l-4 border-slate-500"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900 capitalize">
                  {selectedDimension} 维度指导
                </h4>
                <span className="text-sm text-slate-700">
                  推荐: {dimensionGuidance.typical_range.min}-{dimensionGuidance.typical_range.max}分
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">最低</div>
                  <div className={`font-bold ${getScoreColor(dimensionGuidance.typical_range.min)}`}>
                    {dimensionGuidance.typical_range.min}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">平均</div>
                  <div className={`font-bold ${getScoreColor(dimensionGuidance.typical_range.average)}`}>
                    {Math.round(dimensionGuidance.typical_range.average)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">最高</div>
                  <div className={`font-bold ${getScoreColor(dimensionGuidance.typical_range.max)}`}>
                    {dimensionGuidance.typical_range.max}
                  </div>
                </div>
              </div>

              {dimensionGuidance.scoring_guidelines.length > 0 && (
                <div className="text-xs text-slate-800">
                  <div className="font-medium mb-1">评分参考：</div>
                  <ul className="space-y-1">
                    {dimensionGuidance.scoring_guidelines.slice(0, 2).map((guideline, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1 h-1 bg-slate-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        <span>{guideline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Score Ranges */}
          {advice && (
            <div>
              <button
                onClick={() => toggleSection('ranges')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">评分范围参考</span>
                </div>
                {expandedSections.ranges ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>

              <AnimatePresence>
                {expandedSections.ranges && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-2"
                  >
                    {Object.entries(advice.typical_score_ranges).map(([dimension, range]) => (
                      <div 
                        key={dimension}
                        className={`flex items-center justify-between p-2 rounded ${
                          selectedDimension === dimension ? 'bg-slate-50 border border-blue-200' : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-sm text-gray-700 capitalize">{dimension}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{range[0]}-{range[1]}分</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-yellow-400 to-green-500"
                              style={{ width: `${(range[1] - range[0]) / 30 * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Evaluation Tips */}
          {advice?.evaluation_tips && (
            <div>
              <button
                onClick={() => toggleSection('tips')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">评分提示</span>
                </div>
                {expandedSections.tips ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>

              <AnimatePresence>
                {expandedSections.tips && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2"
                  >
                    <ul className="space-y-2">
                      {advice.evaluation_tips.slice(0, 3).map((tip, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Common Patterns */}
          {advice?.common_patterns && (
            <div>
              <button
                onClick={() => toggleSection('patterns')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">常见表现</span>
                </div>
                {expandedSections.patterns ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>

              <AnimatePresence>
                {expandedSections.patterns && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-1">优点：</div>
                      <ul className="space-y-1">
                        {advice.common_patterns.strengths.slice(0, 2).map((strength, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="w-1 h-1 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-orange-600 mb-1">改进点：</div>
                      <ul className="space-y-1">
                        {advice.common_patterns.areas_for_improvement.slice(0, 2).map((weakness, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="w-1 h-1 bg-orange-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ScoringAssistant;