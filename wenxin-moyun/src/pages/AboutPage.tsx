import { Target, Users, Zap, Shield, Heart, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const features = [
    {
      icon: Target,
      title: '专业评测',
      description: '采用多维度评测体系，全面评估AI模型在艺术创作领域的能力'
    },
    {
      icon: Users,
      title: '社区驱动',
      description: '通过用户投票和专家评审相结合，确保评测结果客观公正'
    },
    {
      icon: Zap,
      title: '实时更新',
      description: '持续跟踪最新AI模型，及时更新评测数据和排行榜'
    },
    {
      icon: Shield,
      title: '公平透明',
      description: '所有评测标准和方法公开透明，接受社区监督'
    }
  ];

  const roadmap = [
    {
      phase: 'Phase 1',
      title: 'MVP 阶段',
      status: 'completed',
      items: ['基础排行榜', '模型对决功能', '核心评测维度']
    },
    {
      phase: 'Phase 2',
      title: '功能扩展',
      status: 'current',
      items: ['API 接入', '自动化评测', '社区画廊']
    },
    {
      phase: 'Phase 3',
      title: '生态建设',
      status: 'upcoming',
      items: ['定制化服务', '专家认证体系', '创作者社区']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="gradient-text">关于文心墨韵</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          我们致力于成为全球领先的人文艺术领域 AI 模型能力评测与洞察平台，
          用量化数据赋能感性创作，连接技术开发者与艺术创作者。
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              <Heart className="inline-block w-8 h-8 mr-2 text-red-500" />
              我们的使命
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              在 AI 技术飞速发展的今天，我们相信艺术创作能力是衡量 AI 智能水平的重要维度。
              文心墨韵专注于评测 AI 在诗歌、绘画、叙事等艺术领域的创造力、美学价值和文化契合度。
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              通过建立科学、公正的评测体系，我们希望推动 AI 艺术创作能力的发展，
              为研究者提供改进方向，为创作者提供工具选择依据，为爱好者展示 AI 艺术的无限可能。
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg transform rotate-3"></div>
            <img
              src="https://picsum.photos/seed/mission/500/300"
              alt="Mission"
              className="relative rounded-lg shadow-xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center mb-8">
          平台特色
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Methodology */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          <BookOpen className="inline-block w-8 h-8 mr-2 text-primary-600" />
          评测方法论
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              1. 多维度评估
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              从格律韵律、构图色彩、叙事逻辑、情感表达、创意新颖性、文化契合度等
              六个核心维度全面评估模型能力。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              2. 标准化测试
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              使用标准化的提示词和评测任务，确保所有模型在相同条件下接受评测，
              保证结果的可比性和公正性。
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              3. 人机结合
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              结合自动化评测工具和人类专家评审，既保证评测效率，
              又确保对艺术作品的深度理解和准确评价。
            </p>
          </div>
        </div>
      </motion.div>

      {/* Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center mb-8">
          发展路线图
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((phase, index) => (
            <div
              key={index}
              className={`
                relative bg-white dark:bg-gray-800 rounded-lg p-6 
                ${phase.status === 'current' ? 'ring-2 ring-primary-500' : ''}
              `}
            >
              {phase.status === 'completed' && (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}
              <div className="mb-4">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${phase.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    phase.status === 'current' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}
                `}>
                  {phase.phase}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {phase.title}
              </h3>
              <ul className="space-y-2">
                {phase.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-start"
                  >
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-center text-white"
      >
        <h2 className="text-3xl font-bold mb-4">加入我们的旅程</h2>
        <p className="text-lg mb-6 opacity-90">
          无论您是 AI 研究者、艺术创作者还是技术爱好者，都欢迎加入文心墨韵社区
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:shadow-lg transition-shadow">
            提交模型
          </button>
          <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium hover:bg-white/30 transition-colors">
            联系我们
          </button>
        </div>
      </motion.div>
    </div>
  );
}