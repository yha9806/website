import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  Sparkles, 
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface MetricData {
  label: string;
  value: number;
  max: number;
  unit?: string;
  color: string;
}

interface ProcessingMetrics {
  tokenSpeed: number; // tokens per second
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  confidence: number; // 0-100
  quality: number; // 0-100
}

interface EvaluationResult {
  score: number;
  details: ProcessingMetrics;
}

interface RealTimeProgressTrackerProps {
  evaluationId: string;
  taskType: string;
  modelName: string;
  onComplete?: (result: EvaluationResult) => void;
  onError?: (error: Error) => void;
}

const RealTimeProgressTracker: React.FC<RealTimeProgressTrackerProps> = ({
  evaluationId,
  taskType,
  modelName,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('initializing');
  const [metrics, setMetrics] = useState<ProcessingMetrics>({
    tokenSpeed: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    confidence: 0,
    quality: 0
  });
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Phases for different task types
  const getPhases = (type: string) => {
    const phases: Record<string, string[]> = {
      poetry: ['初始化', '理解主题', '构思韵律', '生成诗句', '润色完善', '质量评估'],
      story: ['初始化', '分析需求', '构建框架', '创作内容', '情节优化', '综合评分'],
      painting: ['初始化', '视觉理解', '构图设计', '渲染生成', '细节优化', '美学评估'],
      music: ['初始化', '风格分析', '旋律构思', '和声编排', '节奏调整', '音质评估']
    };
    return phases[type] || phases.poetry;
  };

  const phases = getPhases(taskType);
  const currentPhaseIndex = phases.indexOf(currentPhase);

  // Simulate real-time progress updates
  useEffect(() => {
    // Progress update simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 3, 100);
        
        // Update phase based on progress
        const phaseIndex = Math.floor((newProgress / 100) * phases.length);
        if (phaseIndex < phases.length && phaseIndex !== currentPhaseIndex) {
          setCurrentPhase(phases[phaseIndex]);
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 1000);
        }

        if (newProgress >= 100) {
          clearInterval(progressInterval);
          clearInterval(metricsInterval);
          clearInterval(textStreamInterval);
          if (onComplete) {
            setTimeout(() => {
              onComplete({
                score: Math.round(80 + Math.random() * 20),
                details: metrics
              });
            }, 500);
          }
        }

        return newProgress;
      });
    }, 500);

    // Metrics update simulation
    const metricsInterval = setInterval(() => {
      setMetrics({
        tokenSpeed: 50 + Math.random() * 150,
        memoryUsage: 30 + Math.random() * 40,
        cpuUsage: 40 + Math.random() * 35,
        confidence: Math.min(95, 60 + progress * 0.35 + Math.random() * 10),
        quality: Math.min(95, 70 + progress * 0.25 + Math.random() * 10)
      });
    }, 1000);

    // Text streaming simulation
    const sampleTexts = {
      poetry: ['春江潮水连海平，', '海上明月共潮生。', '滟滟随波千万里，', '何处春江无月明。'],
      story: ['在遥远的未来，', '人类已经掌握了时间旅行的技术。', '一位年轻的科学家，', '决定回到过去改变历史...'],
      painting: ['构图采用黄金分割，', '色彩运用对比与和谐，', '光影效果突出主题，', '细节刻画精致入微。'],
      music: ['主旋律优美动听，', '和声进行自然流畅，', '节奏变化富有层次，', '情感表达细腻深刻。']
    };

    const texts = sampleTexts[taskType as keyof typeof sampleTexts] || sampleTexts.poetry;
    let textIndex = 0;

    const textStreamInterval = setInterval(() => {
      if (progress > 30 && progress < 80) {
        setIsStreaming(true);
        setStreamingText(prev => {
          if (textIndex < texts.length) {
            const newText = texts[textIndex];
            textIndex++;
            return prev + newText;
          }
          return prev;
        });
      } else {
        setIsStreaming(false);
      }
    }, 2000);

    // Sparkle effect
    const sparkleInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newSparkle = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100
        };
        setSparkles(prev => [...prev, newSparkle]);
        setTimeout(() => {
          setSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
        }, 2000);
      }
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(metricsInterval);
      clearInterval(textStreamInterval);
      clearInterval(sparkleInterval);
    };
  }, [evaluationId, phases, currentPhaseIndex, taskType, onComplete, metrics, progress]);

  // Format metrics for display
  const metricsDisplay: MetricData[] = [
    {
      label: '处理速度',
      value: metrics.tokenSpeed,
      max: 200,
      unit: 'tok/s',
      color: 'bg-slate-600'
    },
    {
      label: '内存占用',
      value: metrics.memoryUsage,
      max: 100,
      unit: '%',
      color: 'bg-green-500'
    },
    {
      label: 'CPU使用',
      value: metrics.cpuUsage,
      max: 100,
      unit: '%',
      color: 'bg-yellow-500'
    },
    {
      label: '置信度',
      value: metrics.confidence,
      max: 100,
      unit: '%',
      color: 'bg-amber-600'
    },
    {
      label: '质量评分',
      value: metrics.quality,
      max: 100,
      unit: '',
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {sparkles.map(sparkle => (
            <motion.div
              key={sparkle.id}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="card relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className={`p-3 rounded-xl ${
                progress >= 100 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                'bg-gradient-to-br from-slate-500 to-amber-700'
              }`}
              animate={pulseAnimation ? { scale: [1, 1.2, 1] } : {}}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-700 to-amber-700 bg-clip-text text-transparent">
                {modelName} 正在处理
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                任务类型: {taskType === 'poetry' ? '诗歌创作' :
                          taskType === 'story' ? '故事创作' :
                          taskType === 'painting' ? '绘画创作' : '音乐创作'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentPhase}
            </div>
          </div>
        </div>

        {/* Main progress bar */}
        <div className="mb-6">
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-slate-600 via-amber-600 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </motion.div>
            {progress < 100 && (
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                style={{ left: `${progress}%` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-1 h-5 ios-glass liquid-glass-container rounded-full shadow-lg" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex justify-between mb-6">
          {phases.map((phase, index) => (
            <div
              key={phase}
              className="flex flex-col items-center flex-1"
            >
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentPhaseIndex ? 'bg-green-500' :
                  index === currentPhaseIndex ? 'bg-slate-600' :
                  'bg-gray-300 dark:bg-gray-600'
                }`}
                animate={index === currentPhaseIndex ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {index < currentPhaseIndex ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : index === currentPhaseIndex ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <div className="w-2 h-2 ios-glass liquid-glass-container rounded-full" />
                )}
              </motion.div>
              <span className={`text-xs mt-1 ${
                index <= currentPhaseIndex ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {phase}
              </span>
            </div>
          ))}
        </div>

        {/* Real-time metrics */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {metricsDisplay.map((metric, index) => (
            <motion.div
              key={metric.label}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.label}</div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {Math.round(metric.value)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{metric.unit}</span>
              </div>
              <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${metric.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.value / metric.max) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Streaming output preview */}
        {isStreaming && streamingText && (
          <motion.div
            className="bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-900/20 dark:to-amber-900/20 rounded-lg p-4 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-slate-700 dark:text-slate-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-500">实时输出</span>
            </div>
            <div className="text-gray-700 dark:text-gray-300 font-mono text-sm">
              {streamingText}
              <span className="inline-block w-2 h-4 bg-slate-700 animate-pulse ml-1" />
            </div>
          </motion.div>
        )}

        {/* Status message */}
        {progress >= 100 && (
          <motion.div
            className="flex items-center justify-center space-x-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-300 font-medium">评测完成！正在生成报告...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RealTimeProgressTracker;
