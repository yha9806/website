import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  Star, MessageSquare, Trash2, Eye, 
  Sparkles, Palette, BookOpen, Music 
} from 'lucide-react';
import type { EvaluationTask } from '../../types/types';
import EvaluationDetailModal from './EvaluationDetailModal';
import HumanRatingModal from './HumanRatingModal';

interface EvaluationCardProps {
  evaluation: EvaluationTask;
  onUpdate: (id: string, data: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ 
  evaluation, 
  onUpdate, 
  onDelete 
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusIcon = () => {
    switch (evaluation.status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'processing':
        return <Clock className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (evaluation.status) {
      case 'pending':
        return 'text-yellow-500 bg-yellow-50';
      case 'processing':
        return 'text-blue-500 bg-blue-50';
      case 'completed':
        return 'text-green-500 bg-green-50';
      case 'failed':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getTaskIcon = () => {
    switch (evaluation.taskType) {
      case 'poem':
        return <BookOpen className="w-5 h-5" />;
      case 'painting':
        return <Palette className="w-5 h-5" />;
      case 'story':
        return <Sparkles className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTaskTypeName = () => {
    switch (evaluation.taskType) {
      case 'poem':
        return '诗歌创作';
      case 'painting':
        return '绘画创作';
      case 'story':
        return '故事创作';
      case 'music':
        return '音乐创作';
      default:
        return '未知类型';
    }
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个评测任务吗？')) {
      setIsDeleting(true);
      try {
        await onDelete(evaluation.id);
      } catch (err) {
        console.error('Failed to delete evaluation:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleRatingSubmit = async (score: number, feedback: string) => {
    try {
      await onUpdate(evaluation.id, {
        humanScore: score,
        humanFeedback: feedback
      });
      setShowRating(false);
    } catch (err) {
      console.error('Failed to update rating:', err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect rounded-xl p-6 hover:shadow-lg transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
              {getTaskIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{evaluation.modelName || 'Unknown Model'}</h3>
              <p className="text-sm text-gray-600">{getTaskTypeName()}</p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{evaluation.status}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 line-clamp-2">{evaluation.prompt}</p>
        </div>

        {evaluation.result && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">AI评分</span>
              <span className="text-xl font-bold gradient-text">
                {evaluation.result.score}/100
              </span>
            </div>
            
            {evaluation.humanScore && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">人工评分</span>
                <span className="text-xl font-bold text-purple-600">
                  {evaluation.humanScore}/100
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{new Date(evaluation.createdAt).toLocaleString('zh-CN')}</span>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetail(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            {evaluation.status === 'completed' && (
              <button
                onClick={() => setShowRating(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="人工评分"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {showDetail && (
        <EvaluationDetailModal
          evaluation={evaluation}
          onClose={() => setShowDetail(false)}
        />
      )}

      {showRating && (
        <HumanRatingModal
          evaluation={evaluation}
          onClose={() => setShowRating(false)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </>
  );
};

export default EvaluationCard;