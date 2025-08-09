import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RefreshCw,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  FileText,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import Layout from '../components/common/Layout';
import RealTimeProgressTracker from '../components/evaluation/RealTimeProgressTracker';
import ComparisonRadar from '../components/charts/ComparisonRadar';
import ScoreDistribution from '../components/charts/ScoreDistribution';

interface EvaluationDetail {
  id: string;
  modelName: string;
  taskType: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: {
    overallScore: number;
    dimensions: {
      creativity: number;
      quality: number;
      relevance: number;
      fluency: number;
      coherence: number;
      style: number;
    };
    generatedContent: string;
    evaluationComments: string;
    suggestions: string[];
  };
  metrics?: {
    processingTime: number;
    tokensGenerated: number;
    confidence: number;
  };
}

const EvaluationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // Simulate fetching evaluation data
  useEffect(() => {
    const fetchEvaluation = () => {
      // Simulate API call
      setTimeout(() => {
        const mockEvaluation: EvaluationDetail = {
          id: id || '1',
          modelName: 'Qwen2-72B',
          taskType: 'poetry',
          prompt: '春江花月夜',
          status: 'processing',
          createdAt: new Date().toISOString(),
        };
        setEvaluation(mockEvaluation);
        setIsLoading(false);
      }, 1000);
    };

    fetchEvaluation();
  }, [id]);

  const handleProgressComplete = (result: any) => {
    if (!evaluation) return;

    const completedEvaluation: EvaluationDetail = {
      ...evaluation,
      status: 'completed',
      completedAt: new Date().toISOString(),
      result: {
        overallScore: result.score || 92.5,
        dimensions: {
          creativity: 95,
          quality: 90,
          relevance: 93,
          fluency: 91,
          coherence: 89,
          style: 94
        },
        generatedContent: `春江潮水连海平，海上明月共潮生。
滟滟随波千万里，何处春江无月明。
江流宛转绕芳甸，月照花林皆似霰。
空里流霜不觉飞，汀上白沙看不见。`,
        evaluationComments: '这首诗词展现了深厚的文学功底，意境优美，韵律和谐。诗人巧妙地将春江、明月、花林等自然元素融合，创造出如梦如幻的意境。',
        suggestions: [
          '可以进一步加强情感的表达深度',
          '部分用词可以更加精炼',
          '可以尝试更多样的韵律变化'
        ]
      },
      metrics: {
        processingTime: 45.3,
        tokensGenerated: 256,
        confidence: 94.5
      }
    };

    setEvaluation(completedEvaluation);
    setTimeout(() => setShowResult(true), 500);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Sharing evaluation...');
  };

  const handleDownload = () => {
    // Implement download functionality
    console.log('Downloading report...');
  };

  const handleRetry = () => {
    if (evaluation) {
      setEvaluation({ ...evaluation, status: 'processing' });
      setShowResult(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">加载评测详情...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!evaluation) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">评测任务不存在</p>
            <button
              onClick={() => navigate('/evaluations')}
              className="btn-primary mt-4"
            >
              返回评测列表
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/evaluations')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">评测详情</h1>
              <p className="text-gray-600">ID: {evaluation.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {evaluation.status === 'completed' && (
              <>
                <button
                  onClick={handleShare}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>分享</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>下载报告</span>
                </button>
              </>
            )}
            {evaluation.status === 'failed' && (
              <button
                onClick={handleRetry}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重试</span>
              </button>
            )}
          </div>
        </div>

        {/* Task Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">任务信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">模型</span>
                  <span className="font-medium">{evaluation.modelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">任务类型</span>
                  <span className="font-medium">
                    {evaluation.taskType === 'poetry' ? '诗歌创作' :
                     evaluation.taskType === 'story' ? '故事创作' :
                     evaluation.taskType === 'painting' ? '绘画创作' : '音乐创作'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">创建时间</span>
                  <span className="font-medium">
                    {new Date(evaluation.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                {evaluation.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">完成时间</span>
                    <span className="font-medium">
                      {new Date(evaluation.completedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-2">创作提示</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-800">{evaluation.prompt}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            {evaluation.status === 'completed' && evaluation.result && (
              <div className="card bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                    <Award className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">综合评分</h3>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {evaluation.result.overallScore}
                  </div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(evaluation.result.overallScore / 20)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {evaluation.metrics && (
              <div className="card mt-4">
                <h3 className="font-semibold mb-3">性能指标</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">处理时间</span>
                    </div>
                    <span className="text-sm font-medium">
                      {evaluation.metrics.processingTime}秒
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">生成令牌</span>
                    </div>
                    <span className="text-sm font-medium">
                      {evaluation.metrics.tokensGenerated}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">置信度</span>
                    </div>
                    <span className="text-sm font-medium">
                      {evaluation.metrics.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Tracker or Results */}
        <AnimatePresence mode="wait">
          {evaluation.status === 'processing' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RealTimeProgressTracker
                evaluationId={evaluation.id}
                taskType={evaluation.taskType}
                modelName={evaluation.modelName}
                onComplete={handleProgressComplete}
              />
            </motion.div>
          )}

          {showResult && evaluation.result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Generated Content */}
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <span>生成内容</span>
                </h2>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap font-serif text-lg text-gray-800 leading-relaxed">
                    {evaluation.result.generatedContent}
                  </pre>
                </div>
              </div>

              {/* Dimension Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">维度评分</h3>
                  <ComparisonRadar
                    models={[
                      {
                        name: evaluation.modelName,
                        metrics: evaluation.result.dimensions
                      }
                    ]}
                    dimensions={Object.keys(evaluation.result.dimensions)}
                  />
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">评分分布</h3>
                  <ScoreDistribution
                    scores={Object.values(evaluation.result.dimensions)}
                    labels={Object.keys(evaluation.result.dimensions)}
                  />
                </div>
              </div>

              {/* Evaluation Comments */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <span>专业评价</span>
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {evaluation.result.evaluationComments}
                </p>
                
                {evaluation.result.suggestions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-3">改进建议</h4>
                    <ul className="space-y-2">
                      {evaluation.result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default EvaluationDetailPage;