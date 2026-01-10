import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, CheckCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import type { EvaluationTask } from '../../types/types';

interface ProgressStage {
  id: string;
  name: string;
  description: string;
  duration: number; // estimated seconds
  icon: React.ReactNode;
}

interface ProgressVisualizerProps {
  evaluation: EvaluationTask;
  onProgressComplete?: () => void;
}

const ProgressVisualizer: React.FC<ProgressVisualizerProps> = ({
  evaluation,
  onProgressComplete
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Define progress stages based on task type
  const getProgressStages = (taskType: string): ProgressStage[] => {
    const commonStages = {
      poem: [
        {
          id: 'analyzing',
          name: '分析提示词',
          description: '理解创作主题和要求',
          duration: 15,
          icon: <Sparkles className="w-4 h-4" />
        },
        {
          id: 'generating',
          name: '构思创作',
          description: '生成诗歌内容',
          duration: 45,
          icon: <Zap className="w-4 h-4" />
        },
        {
          id: 'refining',
          name: '润色优化',
          description: '调整韵律和意境',
          duration: 30,
          icon: <RefreshCw className="w-4 h-4" />
        },
        {
          id: 'evaluating',
          name: '质量评估',
          description: '多维度综合评分',
          duration: 20,
          icon: <CheckCircle className="w-4 h-4" />
        }
      ],
      story: [
        {
          id: 'analyzing',
          name: '理解需求',
          description: '分析故事类型和风格',
          duration: 20,
          icon: <Sparkles className="w-4 h-4" />
        },
        {
          id: 'structuring',
          name: '构建框架',
          description: '设计故事结构和人物',
          duration: 35,
          icon: <Zap className="w-4 h-4" />
        },
        {
          id: 'writing',
          name: '内容创作',
          description: '编写故事情节',
          duration: 60,
          icon: <RefreshCw className="w-4 h-4" />
        },
        {
          id: 'evaluating',
          name: '综合评估',
          description: '评价叙事质量',
          duration: 25,
          icon: <CheckCircle className="w-4 h-4" />
        }
      ],
      painting: [
        {
          id: 'analyzing',
          name: '主题分析',
          description: '理解视觉创作需求',
          duration: 18,
          icon: <Sparkles className="w-4 h-4" />
        },
        {
          id: 'composing',
          name: '构图设计',
          description: '规划画面布局',
          duration: 40,
          icon: <Zap className="w-4 h-4" />
        },
        {
          id: 'rendering',
          name: '图像生成',
          description: '创建视觉作品',
          duration: 80,
          icon: <RefreshCw className="w-4 h-4" />
        },
        {
          id: 'evaluating',
          name: '美学评估',
          description: '评价艺术质量',
          duration: 22,
          icon: <CheckCircle className="w-4 h-4" />
        }
      ],
      music: [
        {
          id: 'analyzing',
          name: '风格分析',
          description: '确定音乐风格和情感',
          duration: 25,
          icon: <Sparkles className="w-4 h-4" />
        },
        {
          id: 'composing',
          name: '旋律创作',
          description: '生成主旋律和和声',
          duration: 70,
          icon: <Zap className="w-4 h-4" />
        },
        {
          id: 'arranging',
          name: '编曲制作',
          description: '完善音乐编排',
          duration: 50,
          icon: <RefreshCw className="w-4 h-4" />
        },
        {
          id: 'evaluating',
          name: '音乐评估',
          description: '评价旋律和节奏',
          duration: 18,
          icon: <CheckCircle className="w-4 h-4" />
        }
      ]
    };

    return commonStages[taskType as keyof typeof commonStages] || commonStages.poem;
  };

  const stages = getProgressStages(evaluation.taskType);
  const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);

  // Progress simulation
  useEffect(() => {
    if (evaluation.status === 'completed' || evaluation.status === 'failed') {
      setIsCompleted(true);
      if (evaluation.status === 'completed' && onProgressComplete) {
        onProgressComplete();
      }
      return;
    }

    if (evaluation.status !== 'processing') return;

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newElapsed = prev + 1;
        
        // Calculate current stage based on elapsed time
        let cumulativeTime = 0;
        let newCurrentStage = 0;
        
        for (let i = 0; i < stages.length; i++) {
          cumulativeTime += stages[i].duration;
          if (newElapsed <= cumulativeTime) {
            newCurrentStage = i;
            break;
          }
          newCurrentStage = stages.length - 1;
        }
        
        setCurrentStage(newCurrentStage);
        setEstimatedTimeRemaining(Math.max(0, totalDuration - newElapsed));
        
        // Auto-complete simulation (for demo purposes)
        if (newElapsed >= totalDuration) {
          setIsCompleted(true);
          if (onProgressComplete) {
            setTimeout(onProgressComplete, 500);
          }
        }
        
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [evaluation.status, stages, totalDuration, onProgressComplete]);

  // Calculate progress percentage
  const getStageProgress = (stageIndex: number): number => {
    if (stageIndex < currentStage) return 100;
    if (stageIndex > currentStage) return 0;
    
    // Current stage progress calculation
    const stagesBeforeCurrent = stages.slice(0, stageIndex);
    const timeBeforeCurrent = stagesBeforeCurrent.reduce((sum, stage) => sum + stage.duration, 0);
    const timeIntoCurrentStage = elapsedTime - timeBeforeCurrent;
    const currentStageDuration = stages[stageIndex].duration;
    
    return Math.min(100, Math.max(0, (timeIntoCurrentStage / currentStageDuration) * 100));
  };

  const getStatusColor = () => {
    if (evaluation.status === 'completed') return 'text-success-500';
    if (evaluation.status === 'failed') return 'text-error-500';
    if (evaluation.status === 'processing') return 'text-primary-500';
    return 'text-warning-500';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            evaluation.status === 'completed' ? 'bg-success-100' :
            evaluation.status === 'failed' ? 'bg-error-100' : 
            'bg-primary-100'
          }`}>
            {evaluation.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-success-500" />
            ) : evaluation.status === 'failed' ? (
              <AlertCircle className="w-5 h-5 text-error-500" />
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-5 h-5 text-primary-500" />
              </motion.div>
            )}
          </div>
          <div>
            <h3 className="text-h3 text-neutral-900">评测进度</h3>
            <p className="text-caption text-neutral-600">
              {evaluation.status === 'completed' ? '评测已完成' :
               evaluation.status === 'failed' ? '评测失败' :
               evaluation.status === 'processing' ? '正在进行评测...' : '等待开始'}
            </p>
          </div>
        </div>
        
        {evaluation.status === 'processing' && estimatedTimeRemaining > 0 && (
          <div className="text-right">
            <div className="flex items-center text-caption text-neutral-600">
              <Clock className="w-4 h-4 mr-1" />
              剩余约 {formatTime(estimatedTimeRemaining)}
            </div>
            <div className="text-caption text-neutral-500">
              已用时 {formatTime(elapsedTime)}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-body font-medium text-neutral-700">总体进度</span>
          <span className="text-caption text-neutral-600">
            {Math.round((elapsedTime / totalDuration) * 100)}%
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min(100, (elapsedTime / totalDuration) * 100)}%` 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const progress = getStageProgress(index);
          const isActive = index === currentStage && evaluation.status === 'processing';
          const isCompleted = index < currentStage || evaluation.status === 'completed';
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary-50 border border-primary-200' :
                isCompleted ? 'bg-success-50' : 'bg-neutral-100'
              }`}
            >
              <div className={`flex-shrink-0 p-2 rounded-full ${
                isCompleted ? 'bg-success-500 text-white' :
                isActive ? 'bg-primary-500 text-white' :
                'bg-neutral-400 text-neutral-200'
              }`}>
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      key="active"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {stage.icon}
                    </motion.div>
                  )}
                  {!isActive && (
                    <motion.div key="static">
                      {stage.icon}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium ${
                    isActive ? 'text-primary-800' :
                    isCompleted ? 'text-success-700' :
                    'text-neutral-600'
                  }`}>
                    {stage.name}
                  </h4>
                  {(isActive || isCompleted) && (
                    <span className={`text-caption font-medium ${
                      isCompleted ? 'text-success-600' : 'text-primary-600'
                    }`}>
                      {isCompleted ? '完成' : `${Math.round(progress)}%`}
                    </span>
                  )}
                </div>
                <p className={`text-caption ${
                  isActive ? 'text-primary-600' :
                  isCompleted ? 'text-success-600' :
                  'text-neutral-500'
                }`}>
                  {stage.description}
                </p>
                
                {/* Stage progress bar for active stage */}
                {isActive && progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-primary-200 rounded-full h-1">
                      <motion.div
                        className="bg-primary-500 h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressVisualizer;