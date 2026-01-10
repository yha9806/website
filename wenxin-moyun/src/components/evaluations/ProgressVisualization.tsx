import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import apiClient from '../../services/api';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Progress');

// Polling configuration
const POLL_INTERVAL = 5000;      // 5 seconds (was 2 seconds)
const MAX_POLL_COUNT = 60;       // Maximum 60 polls (5 minutes total)

interface ProgressData {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_stage: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

interface ProgressVisualizationProps {
  taskId: string;
  taskType: 'poem' | 'story' | 'painting' | 'music';
  onComplete?: () => void;
}

const progressStages: Record<string, string[]> = {
  poem: ['Analyzing Prompt', 'Conceptualizing', 'Refining & Optimizing', 'Quality Assessment'],
  story: ['Understanding Requirements', 'Building Framework', 'Content Creation', 'Comprehensive Evaluation'],
  painting: ['Theme Analysis', 'Composition Design', 'Image Generation', 'Aesthetic Evaluation'],
  music: ['Style Analysis', 'Melody Creation', 'Arrangement Production', 'Music Evaluation']
};

const stageDurations: Record<string, number[]> = {
  poem: [5, 15, 10, 7],      // Total ~37 seconds
  story: [7, 12, 20, 8],     // Total ~47 seconds
  painting: [6, 13, 27, 7],  // Total ~53 seconds
  music: [8, 23, 17, 6]      // Total ~54 seconds
};

export const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  taskId,
  taskType,
  onComplete
}) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const pollCountRef = useRef(0);

  const stages = progressStages[taskType] || progressStages.poem;
  const durations = stageDurations[taskType] || stageDurations.poem;

  useEffect(() => {
    if (isPolling) {
      pollCountRef.current = 0; // Reset poll count on new task
      const interval = setInterval(() => {
        // Stop polling if max count reached
        if (pollCountRef.current >= MAX_POLL_COUNT) {
          logger.warn('Max poll count reached, stopping polling');
          setIsPolling(false);
          clearInterval(interval);
          return;
        }
        pollCountRef.current++;
        fetchProgress();
      }, POLL_INTERVAL);
      fetchProgress(); // Initial fetch
      return () => clearInterval(interval);
    }
  }, [taskId, isPolling]);

  useEffect(() => {
    if (progressData?.current_stage) {
      const index = stages.findIndex(stage => stage === progressData.current_stage);
      if (index !== -1) {
        setCurrentStageIndex(index);
      }
    }
  }, [progressData?.current_stage, stages]);

  const fetchProgress = async () => {
    try {
      const response = await apiClient.get<ProgressData>(`/evaluations/${taskId}/progress/`);
      setProgressData(response.data);
      
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setIsPolling(false);
        if (response.data.status === 'completed' && onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      logger.error('Failed to fetch progress:', error);
      // Stop polling on repeated errors
      if (pollCountRef.current > 3) {
        logger.warn('Multiple fetch errors, stopping polling');
        setIsPolling(false);
      }
    }
  };

  const getStatusIcon = () => {
    if (!progressData) return <Loader2 className="w-5 h-5 animate-spin" />;
    
    switch (progressData.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-error-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusText = () => {
    if (!progressData) return 'Initializing...';
    
    switch (progressData.status) {
      case 'completed':
        return 'Evaluation Complete';
      case 'failed':
        return 'Evaluation Failed';
      case 'running':
        return progressData.current_stage || 'Processing';
      default:
        return 'Waiting to Start';
    }
  };

  const getProgressColor = () => {
    if (!progressData) return 'bg-neutral-200';
    
    switch (progressData.status) {
      case 'completed':
        return 'bg-gradient-to-r from-success to-primary';
      case 'failed':
        return 'bg-error-500';
      case 'running':
        return 'bg-gradient-to-r from-primary to-accent';
      default:
        return 'bg-neutral-300';
    }
  };

  return (
    <div className="bg-neutral-50 rounded-xl p-6 shadow-lg border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800">Evaluation Progress</h3>
            <p className="text-sm text-neutral-600">{getStatusText()}</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-primary">
          {progressData?.progress ? `${Math.round(progressData.progress)}%` : '0%'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-neutral-100 rounded-full overflow-hidden mb-6 shadow-inner">
        <motion.div
          className={`h-full ${getProgressColor()} rounded-full shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${progressData?.progress || 0}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
        {progressData?.status === 'running' && (
          <div className="absolute inset-0">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        )}
      </div>

      {/* Stage Progress */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isActive = index === currentStageIndex && progressData?.status === 'running';
          const isCompleted = progressData?.progress 
            ? index < currentStageIndex || (index === currentStageIndex && progressData.status === 'completed')
            : false;
          const isPending = index > currentStageIndex || (!progressData?.progress && index > 0);

          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive ? 'bg-primary/10 border-2 border-primary shadow-sm' :
                isCompleted ? 'bg-success-500/10 border border-success-500' :
                isPending ? 'bg-neutral-50 border border-neutral-200' :
                'bg-neutral-50 border border-neutral-200'
              }`}
            >
              {/* Stage Icon */}
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                isActive ? 'bg-primary animate-pulse' :
                isCompleted ? 'bg-success-500' :
                'bg-neutral-300'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <span className="text-xs text-white font-medium">{index + 1}</span>
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    isActive ? 'text-primary' :
                    isCompleted ? 'text-success-500' :
                    'text-neutral-500'
                  }`}>
                    {stage}
                  </span>
                  <span className="text-xs text-neutral-500">
                    Est. {durations[index]}s
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    className="mt-1 h-1 bg-neutral-200 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: durations[index], ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error Message */}
      {progressData?.error_message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-error-500/10 border border-error-500 rounded-lg"
        >
          <p className="text-sm text-error-500">{progressData.error_message}</p>
        </motion.div>
      )}

      {/* Time Info */}
      {progressData?.started_at && (
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
          <span>Start Time: {new Date(progressData.started_at).toLocaleTimeString()}</span>
          {progressData.completed_at && (
            <span>Completion Time: {new Date(progressData.completed_at).toLocaleTimeString()}</span>
          )}
        </div>
      )}
    </div>
  );
};