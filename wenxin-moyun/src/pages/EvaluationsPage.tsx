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
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                AI 评测任务
              </h1>
              <p className="text-gray-600">
                管理和查看AI模型的艺术创作评测任务
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={refreshEvaluations}
                className="px-4 py-2 bg-neutral-50 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                刷新
              </button>
              
              <button
                onClick={handleCreateButtonClick}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                创建评测
                {isGuest && (
                  <span className="ml-2 px-2 py-1 bg-neutral-50 bg-opacity-20 rounded-full text-xs">
                    剩余 {remainingUsage} 次
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              
              <div className="flex gap-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">所有类型</option>
                  <option value="poem">诗歌创作</option>
                  <option value="story">故事创作</option>
                  <option value="painting">绘画创作</option>
                  <option value="music">音乐创作</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">所有状态</option>
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                  <option value="failed">失败</option>
                </select>
              </div>

              <div className="ml-auto flex items-center space-x-4">
                {isGuest && (
                  <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    游客模式 · 今日剩余 {remainingUsage} 次
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  共 {total} 个任务
                </div>
              </div>
            </div>
          </div>

          {/* Evaluations List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="glass-effect rounded-xl p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="glass-effect rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">暂无评测任务</p>
              <button
                onClick={handleCreateButtonClick}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg"
              >
                创建第一个评测任务
                {isGuest && (
                  <span className="ml-2">({remainingUsage} 次免费)</span>
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
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-neutral-50 text-gray-700 hover:bg-gray-100'
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