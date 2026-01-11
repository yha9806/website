import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Info, ChartBar, Users } from 'lucide-react';
import apiClient from '../../services/api';

interface ScoringAdvice {
  reference_score: number;
  score_range: {
    min: number;
    max: number;
  };
  confidence: 'high' | 'medium' | 'low';
  sample_size: number;
  task_specific_ranges: Record<string, [number, number]>;
  suggestion: string;
}

interface ScoringReferenceProps {
  taskId: string;
  taskType: 'poem' | 'story' | 'painting' | 'music';
  onScoreChange?: (score: number) => void;
}

export const ScoringReference: React.FC<ScoringReferenceProps> = ({
  taskId,
  taskType,
  onScoreChange
}) => {
  const [advice, setAdvice] = useState<ScoringAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchScoringAdvice();
  }, [taskId]);

  const fetchScoringAdvice = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ScoringAdvice>(`/evaluations/${taskId}/scoring-advice/`);
      setAdvice(response.data);
    } catch (error) {
      console.error('Failed to fetch scoring advice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      poem: '诗歌创作',
      story: '故事创作',
      painting: '绘画创作',
      music: '音乐创作'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-neutral-50 dark:bg-[#21262D] rounded-lg shadow-sm">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">AI 评分参考</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Info className="w-4 h-4" />
          {showDetails ? '收起' : '详情'}
        </button>
      </div>

      {/* Score Range Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">建议评分范围</span>
          <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(advice.confidence)}`}>
            {advice.confidence === 'high' ? '高置信度' : 
             advice.confidence === 'medium' ? '中置信度' : '低置信度'}
          </span>
        </div>
        
        <div className="relative h-12 bg-neutral-50 dark:bg-[#21262D] rounded-lg shadow-inner p-2">
          <div className="relative h-full">
            {/* Score range bar */}
            <div 
              className="absolute h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-md opacity-30"
              style={{
                left: `${advice.score_range.min}%`,
                width: `${advice.score_range.max - advice.score_range.min}%`
              }}
            />
            
            {/* Reference score line */}
            <div 
              className="absolute w-1 h-full bg-indigo-600 rounded-full"
              style={{ left: `${advice.reference_score}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-indigo-600">
                {advice.reference_score}
              </div>
            </div>
          </div>
          
          {/* Scale marks */}
          <div className="absolute inset-x-2 -bottom-5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Suggestion */}
      <div className="mt-8 p-3 bg-neutral-50 dark:bg-[#21262D] rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">{advice.suggestion}</p>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-3"
        >
          {/* Sample Size */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              基于 <strong>{advice.sample_size}</strong> 个同类作品分析
            </span>
          </div>

          {/* Task-specific ranges */}
          {Object.keys(advice.task_specific_ranges).length > 0 && (
            <div className="bg-neutral-50 dark:bg-[#21262D] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <ChartBar className="w-4 h-4" />
                <span>{getTaskTypeLabel(taskType)}细分指标参考</span>
              </div>
              {Object.entries(advice.task_specific_ranges).map(([metric, [min, max]]) => (
                <div key={metric} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{metric}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{min} - {max}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Score Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onScoreChange?.(advice.score_range.min)}
              className="flex-1 py-2 text-sm bg-neutral-50 dark:bg-[#21262D] text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              使用最低分 ({advice.score_range.min})
            </button>
            <button
              onClick={() => onScoreChange?.(advice.reference_score)}
              className="flex-1 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              使用参考分 ({advice.reference_score})
            </button>
            <button
              onClick={() => onScoreChange?.(advice.score_range.max)}
              className="flex-1 py-2 text-sm bg-neutral-50 dark:bg-[#21262D] text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              使用最高分 ({advice.score_range.max})
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};