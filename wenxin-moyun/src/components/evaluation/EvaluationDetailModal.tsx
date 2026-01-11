import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Calendar, User, Hash, Sparkles } from 'lucide-react';
import type { EvaluationTask } from '../../types/types';

interface EvaluationDetailModalProps {
  evaluation: EvaluationTask;
  onClose: () => void;
}

const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({ evaluation, onClose }) => {
  const getTaskTypeName = () => {
    switch (evaluation.taskType) {
      case 'poem': return '诗歌创作';
      case 'painting': return '绘画创作';
      case 'story': return '故事创作';
      case 'music': return '音乐创作';
      default: return '未知类型';
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', label: '待处理' },
      processing: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', label: '处理中' },
      completed: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', label: '已完成' },
      failed: { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', label: '失败' }
    };
    const config = statusConfig[evaluation.status] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-50 dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-neutral-50 dark:bg-gray-900 border-b dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold gradient-text">评测任务详情</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{getTaskTypeName()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="glass-effect rounded-xl p-4">
            <h3 className="font-semibold text-lg mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">任务ID:</span>
                <span className="font-mono">{evaluation.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">模型:</span>
                <span>{evaluation.modelName || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">创建时间:</span>
                <span>{new Date(evaluation.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">状态:</span>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="glass-effect rounded-xl p-4">
            <h3 className="font-semibold text-lg mb-3">创作提示</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{evaluation.prompt}</p>
          </div>

          {/* Parameters */}
          {evaluation.parameters && Object.keys(evaluation.parameters).length > 0 && (
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">参数设置</h3>
              <div className="space-y-2">
                {Object.entries(evaluation.parameters).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {evaluation.result && (
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">创作结果</h3>
              
              {/* Content */}
              {evaluation.result.content && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{evaluation.result.content}</p>
                </div>
              )}

              {/* Image */}
              {evaluation.result.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={evaluation.result.imageUrl} 
                    alt="Generated artwork"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">AI评分</p>
                  <p className="text-2xl font-bold gradient-text">
                    {evaluation.result.score}/100
                  </p>
                </div>
                
                {evaluation.humanScore !== undefined && (
                  <div className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">人工评分</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {evaluation.humanScore}/100
                    </p>
                  </div>
                )}
              </div>

              {/* Metrics */}
              {evaluation.result.metrics && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">评测指标</h4>
                  <div className="space-y-2">
                    {Object.entries(evaluation.result.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis */}
              {evaluation.result.analysis && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">AI分析</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{evaluation.result.analysis}</p>
                </div>
              )}
            </div>
          )}

          {/* Human Feedback */}
          {evaluation.humanFeedback && (
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-lg mb-3">人工评价</h3>
              <p className="text-gray-700 dark:text-gray-300">{evaluation.humanFeedback}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EvaluationDetailModal;