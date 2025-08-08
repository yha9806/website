import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Swords, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockBattles, categories } from '../data/mockData';
import { useLeaderboard } from '../hooks/useLeaderboard';

export default function HomePage() {
  const { entries: leaderboard } = useLeaderboard();
  const topModels = leaderboard.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/20 to-secondary-100/20 dark:from-primary-900/20 dark:to-secondary-900/20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center py-20"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">文心墨韵</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            专业的 AI 艺术创作能力评测平台
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            评测 AI 在诗歌、绘画、叙事等领域的创造力与美学价值，用数据赋能艺术创作
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/leaderboard"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              查看排行榜 <Trophy className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/battle"
              className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              模型对决 <Swords className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Top Models */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            <Trophy className="inline-block w-8 h-8 mr-2 text-yellow-500" />
            当前领先模型
          </h2>
          <Link
            to="/leaderboard"
            className="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
          >
            查看完整排行榜 <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topModels.map((entry, index) => (
            <motion.div
              key={entry.model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`text-3xl font-bold mr-3 ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    'text-orange-600'
                  }`}>
                    #{entry.rank}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {entry.model.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.model.organization}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {entry.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">综合评分</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {entry.model.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                to={`/model/${entry.model.id}`}
                className="block text-center py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                查看详情
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8">
          <Sparkles className="inline-block w-8 h-8 mr-2 text-purple-500" />
          评测维度
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/leaderboard/${category.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Active Battles */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            <Swords className="inline-block w-8 h-8 mr-2 text-red-500" />
            实时对决
          </h2>
          <Link
            to="/battle"
            className="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
          >
            参与投票 <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockBattles.slice(0, 2).map((battle) => (
            <div
              key={battle.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                  进行中
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {battle.task.category}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {battle.task.prompt}
              </p>

              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {battle.modelA.name}
                  </p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {battle.votesA}
                  </p>
                </div>
                <div className="text-gray-400">VS</div>
                <div className="text-center">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {battle.modelB.name}
                  </p>
                  <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                    {battle.votesB}
                  </p>
                </div>
              </div>

              <Link
                to="/battle"
                className="block mt-4 text-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                参与投票
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-8 text-center">
          <TrendingUp className="inline-block w-8 h-8 mr-2 text-green-500" />
          平台数据
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
              {leaderboard.length}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">评测模型</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-secondary-600 dark:text-secondary-400">
              1,248
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">对决场次</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              15,692
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">用户投票</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              6
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">评测维度</p>
          </div>
        </div>
      </section>
    </div>
  );
}