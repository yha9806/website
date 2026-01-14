import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';
import type { EvaluationTask } from '../../types/types';

interface HumanRatingModalProps {
  evaluation: EvaluationTask;
  onClose: () => void;
  onSubmit: (score: number, feedback: string) => Promise<void>;
}

const HumanRatingModal: React.FC<HumanRatingModalProps> = ({ 
  evaluation, 
  onClose, 
  onSubmit 
}) => {
  const [score, setScore] = useState(evaluation.humanScore || 80);
  const [feedback, setFeedback] = useState(evaluation.humanFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(score, feedback);
      onClose();
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-slate-700';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = () => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '待改进';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-50 dark:bg-[#161B22] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-neutral-50 dark:bg-gray-900 border-b dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text">人工评分</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">为AI创作内容打分并提供反馈</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Display Content */}
          {evaluation.result && (
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold mb-3">创作内容</h3>
              {evaluation.result.content && (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
                  {evaluation.result.content}
                </p>
              )}
              {evaluation.result.imageUrl && (
                <img 
                  src={evaluation.result.imageUrl} 
                  alt="Generated content"
                  className="w-full rounded-lg"
                />
              )}
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">AI评分</p>
                <p className="text-xl font-bold gradient-text">
                  {evaluation.result.score}/100
                </p>
              </div>
            </div>
          )}

          {/* Score Input */}
          <div>
            <label htmlFor="human-rating-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              您的评分
            </label>

            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                id="human-rating-score"
                aria-label="Human rating score"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="flex-1"
              />
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor()}`}>
                  {score}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{getScoreLabel()}</div>
              </div>
            </div>

            {/* Quick Score Buttons */}
            <div className="flex gap-2">
              {[95, 85, 75, 65, 50].map(quickScore => (
                <button
                  key={quickScore}
                  type="button"
                  onClick={() => setScore(quickScore)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    score === quickScore
                      ? 'bg-gradient-to-r from-amber-700 to-slate-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {quickScore}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              评价反馈
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="请提供您的评价和建议..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
              rows={5}
            />

            {/* Feedback Templates */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">快速评价:</span>
              {[
                '创意独特，表现力强',
                '符合主题，质量优秀',
                '还有改进空间',
                '偏离主题要求'
              ].map(template => (
                <button
                  key={template}
                  type="button"
                  onClick={() => setFeedback(prev =>
                    prev ? `${prev}；${template}` : template
                  )}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors text-gray-700 dark:text-gray-300"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Stars Visual */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-8 h-8 transition-colors ${
                  score >= star * 20
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-amber-700 to-slate-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '提交中...' : '提交评分'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default HumanRatingModal;