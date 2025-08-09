import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Info } from 'lucide-react';
import { RangeBar } from './RangeBar';

interface ScoringReferenceProps {
  taskType: 'poem' | 'story' | 'painting' | 'music';
  currentScore?: number;
  referenceData?: {
    reference_score: number;
    score_range: {
      min: number;
      max: number;
    };
    confidence: 'high' | 'medium' | 'low';
    sample_size: number;
    task_specific_ranges?: Record<string, [number, number]>;
    suggestion: string;
  };
}

export const ScoringReference: React.FC<ScoringReferenceProps> = ({
  taskType,
  currentScore,
  referenceData
}) => {
  const defaultData = {
    reference_score: 85,
    score_range: { min: 75, max: 95 },
    confidence: 'low' as const,
    sample_size: 0,
    suggestion: '暂无历史数据，建议参考默认评分标准'
  };

  const data = referenceData || defaultData;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-success-500';
      case 'medium': return 'text-accent-500';
      default: return 'text-neutral-400';
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'high': return '高可信度';
      case 'medium': return '中等可信度';
      default: return '低可信度';
    }
  };

  const taskTypeLabels = {
    poem: '诗歌创作',
    story: '故事写作',
    painting: '绘画生成',
    music: '音乐创作'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-50 rounded-xl p-6 shadow-sm border border-neutral-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg">
            <Target className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-800">
              AI参考评分
            </h3>
            <p className="text-sm text-neutral-500">
              基于{data.sample_size}个同类{taskTypeLabels[taskType]}作品分析
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getConfidenceColor(data.confidence)}`}>
            {getConfidenceLabel(data.confidence)}
          </span>
          <Info className="w-4 h-4 text-neutral-400" />
        </div>
      </div>

      {/* Main Score Display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-primary-500">
            {data.reference_score}
          </span>
          <span className="text-sm text-neutral-500">分</span>
          <span className="text-sm text-neutral-400">参考分数</span>
        </div>
        
        {/* Score Range Bar */}
        {currentScore && (
          <RangeBar
            label="评分区间"
            min={data.score_range.min}
            max={data.score_range.max}
            value={currentScore}
            benchmark={data.reference_score}
            showTrend={true}
          />
        )}
        
        <div className="flex justify-between mt-2 text-xs text-neutral-500">
          <span>建议范围: {data.score_range.min}-{data.score_range.max}分</span>
          {currentScore && (
            <span className={currentScore >= data.score_range.min && currentScore <= data.score_range.max ? 'text-success-500' : 'text-warning-500'}>
              当前评分: {currentScore}分
            </span>
          )}
        </div>
      </div>

      {/* Task Specific Ranges */}
      {'task_specific_ranges' in data && data.task_specific_ranges && Object.keys(data.task_specific_ranges).length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">
            维度参考分布
          </h4>
          <div className="space-y-3">
            {Object.entries(data.task_specific_ranges!).map(([dimension, [min, max]]) => (
              <div key={dimension} className="flex items-center gap-3">
                <span className="text-xs text-neutral-600 w-16 capitalize">
                  {dimension}
                </span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500/50 to-primary-500"
                    style={{
                      marginLeft: `${min}%`,
                      width: `${max - min}%`
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-500 w-12 text-right">
                  {min}-{max}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestion */}
      <div className="p-4 bg-primary-500/5 rounded-lg">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-1">
              评分建议
            </p>
            <p className="text-sm text-neutral-600">
              {data.suggestion}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Tips */}
      {data.sample_size >= 10 && (
        <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
          <p className="text-xs text-neutral-500">
            💡 提示：参考分数基于历史数据统计，仅供参考。请结合作品实际质量和您的专业判断进行评分。
          </p>
        </div>
      )}
    </motion.div>
  );
};