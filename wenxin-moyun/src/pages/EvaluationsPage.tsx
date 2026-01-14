import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useEvaluations } from '../hooks/useEvaluations';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import type { EvaluationTask } from '../types/types';
import CreateEvaluationModal from '../components/evaluation/CreateEvaluationModal';
import EvaluationCard from '../components/evaluation/EvaluationCard';
import LoginPrompt from '../components/auth/LoginPrompt';
import { hasReachedDailyLimit, getRemainingUsage, addEvaluationToGuest, isGuestMode } from '../utils/guestSession';
import { IOSButton, IOSCard, StatusEmoji } from '../components/ios';

const EvaluationsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { 
    evaluations, 
    loading, 
    error, 
    total, 
    page, 
    setPage, 
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    refreshEvaluations 
  } = useEvaluations(
    undefined,
    selectedType === 'all' ? undefined : selectedType
  );

  // Login prompt management
  const {
    isPromptOpen,
    promptTrigger,
    remainingUsage,
    isGuestMode: isGuest,
    hidePrompt,
    checkLimitReached,
    checkSaveProgress,
    checkSmartPrompt
  } = useLoginPrompt();

  const filteredEvaluations = evaluations.filter(e => {
    if (selectedStatus !== 'all' && e.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'processing':
        return 'text-slate-600';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const handleCreateEvaluation = async (data: any) => {
    try {
      // Check if guest user has reached limit
      if (isGuest && hasReachedDailyLimit()) {
        checkLimitReached();
        return;
      }

      const evaluation = await createEvaluation(data);
      setShowCreateModal(false);
      
      // Track guest usage
      if (isGuest && evaluation) {
        addEvaluationToGuest(evaluation.id);
      }
      
      // Smart prompts for guest users
      if (isGuest) {
        const currentCount = evaluations.length + 1;
        checkSaveProgress(currentCount);
        checkSmartPrompt();
      }
    } catch (err) {
      console.error('Failed to create evaluation:', err);
    }
  };

  const handleCreateButtonClick = () => {
    // Check guest limit before showing modal
    if (isGuest && hasReachedDailyLimit()) {
      checkLimitReached();
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                AI Evaluation Tasks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and view AI model artistic creation evaluation tasks
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={refreshEvaluations}
                className="px-4 py-2 ios-glass liquid-glass-container rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              
              <button
                onClick={handleCreateButtonClick}
                className="px-6 py-2 bg-gradient-to-r from-amber-700 to-slate-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Task
                {isGuest && (
                  <span className="ml-2 px-2 py-1 bg-neutral-50 bg-opacity-20 rounded-full text-xs">
                    {remainingUsage} left
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          <IOSCard variant="glass" padding="lg" className="mb-6">
            <div className="flex items-center gap-4">
              🔍
              
              <div className="flex gap-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 ios-glass bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="all">All Types</option>
                  <option value="poem">Poetry Creation</option>
                  <option value="story">Story Creation</option>
                  <option value="painting">Painting Creation</option>
                  <option value="music">Music Creation</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 ios-glass bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="ml-auto flex items-center space-x-4">
                {isGuest && (
                  <div className="text-sm text-orange-600 ios-glass px-3 py-1 rounded-full">
                    👤 Guest Mode · {remainingUsage} uses left today
                  </div>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  📊 Total {total} tasks
                </div>
              </div>
            </div>
          </IOSCard>

          {/* Evaluations List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-700" />
            </div>
          ) : error ? (
            <div className="glass-effect rounded-xl p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="glass-effect rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No evaluation tasks yet</p>
              <button
                onClick={handleCreateButtonClick}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-700 to-slate-700 text-white rounded-lg"
              >
                Create your first evaluation task
                {isGuest && (
                  <span className="ml-2">({remainingUsage} free)</span>
                )}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onUpdate={updateEvaluation}
                  onDelete={deleteEvaluation}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg ${
                    p === page
                      ? 'bg-gradient-to-r from-amber-700 to-slate-700 text-white'
                      : 'bg-neutral-50 dark:bg-[#21262D] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Evaluation Modal */}
      {showCreateModal && (
        <CreateEvaluationModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEvaluation}
        />
      )}

      {/* Login Prompt */}
      <LoginPrompt
        isOpen={isPromptOpen}
        onClose={hidePrompt}
        trigger={promptTrigger}
        remainingUsage={remainingUsage}
      />
    </div>
  );
};

export default EvaluationsPage;