import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Trophy, Zap } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { mockModels } from '../data/mockData';
import { motion } from 'framer-motion';

export default function ModelDetailPage() {
  const { id } = useParams();
  const model = mockModels.find(m => m.id === id);

  if (!model) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">模型未找到</h2>
        <Link to="/leaderboard" className="text-primary-600 dark:text-primary-400 mt-4 inline-block">
          返回排行榜
        </Link>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = [
    { subject: '格律韵律', value: model.metrics.rhythm, fullMark: 100 },
    { subject: '构图色彩', value: model.metrics.composition, fullMark: 100 },
    { subject: '叙事逻辑', value: model.metrics.narrative, fullMark: 100 },
    { subject: '情感表达', value: model.metrics.emotion, fullMark: 100 },
    { subject: '创意新颖', value: model.metrics.creativity, fullMark: 100 },
    { subject: '文化契合', value: model.metrics.cultural, fullMark: 100 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/leaderboard"
        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回排行榜
      </Link>

      {/* Model Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={model.avatar}
              alt={model.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                {model.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {model.organization} · {model.version}
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-4xl font-bold gradient-text">
              {model.overallScore}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">综合评分</p>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {model.description}
        </p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            发布时间：{model.releaseDate}
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Zap className="w-4 h-4 mr-2" />
            类型：{model.category === 'text' ? '文本' : model.category === 'visual' ? '视觉' : '多模态'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {model.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm flex items-center"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            能力雷达图
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#6b7280' }}
              />
              <Radar
                name={model.name}
                dataKey="value"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Metrics Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            详细评分
          </h2>
          <div className="space-y-4">
            {radarData.map((item) => (
              <div key={item.subject}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 dark:text-gray-300">{item.subject}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {item.value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sample Works */}
      {model.works.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            代表作品
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {model.works.map((work) => (
              <div
                key={work.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {work.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {work.type === 'poem' ? '诗歌' : work.type === 'painting' ? '绘画' : '故事'}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {work.score}
                    </span>
                  </div>
                </div>

                {work.prompt && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>提示词：</strong>{work.prompt}
                    </p>
                  </div>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                    {work.content}
                  </pre>
                </div>

                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  创作于 {work.createdAt}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Similar Models */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
          相似模型
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockModels
            .filter(m => m.id !== model.id && m.category === model.category)
            .slice(0, 3)
            .map((similarModel) => (
              <Link
                key={similarModel.id}
                to={`/model/${similarModel.id}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={similarModel.avatar}
                    alt={similarModel.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {similarModel.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      评分: {similarModel.overallScore}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </motion.div>
    </div>
  );
}