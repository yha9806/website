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
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'processing':
        return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20';
      case 'completed':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-800';
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
        return 'Poetry Creation';
      case 'painting':
        return 'Painting Creation';
      case 'story':
        return 'Story Creation';
      case 'music':
        return 'Music Creation';
      default:
        return 'Unknown Type';
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this evaluation task?')) {
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-slate-100">
              {getTaskIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{evaluation.modelName || 'Unknown Model'}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{getTaskTypeName()}</p>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{evaluation.status}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{evaluation.prompt}</p>
        </div>

        {evaluation.result && (
          <div className="mb-4 p-3 ios-glass rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Score</span>
              <span className="text-xl font-bold gradient-text">
                {evaluation.result.score}/100
              </span>
            </div>
            
            {evaluation.humanScore && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Human Score</span>
                <span className="text-xl font-bold text-amber-700">
                  {evaluation.humanScore}/100
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{new Date(evaluation.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetail(true)}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors backdrop-blur-sm"
              aria-label="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {evaluation.status === 'completed' && (
              <button
                onClick={() => setShowRating(true)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors backdrop-blur-sm"
                aria-label="Human Rating"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-lg transition-colors"
              aria-label="Delete evaluation"
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