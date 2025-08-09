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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-white/80 via-rose-50/60 to-indigo-50/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-16 text-center"
          style={{
            transform: 'perspective(1000px) rotateX(2deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <motion.h1 
            className="text-7xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'serif' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            文心墨韵
          </motion.h1>
          <motion.p 
            className="text-2xl md:text-3xl text-slate-700 mb-8 max-w-3xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            融合传统美学与现代AI的艺术评测平台
          </motion.p>
          <motion.p 
            className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            如水墨丹青，评AI之美 · 似诗词歌赋，鉴机器之智
          </motion.p>
          <div className="flex gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/leaderboard"
                className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl shadow-2xl font-semibold text-lg mr-4 hover:from-rose-600 hover:to-purple-700 transition-all duration-300"
                style={{ boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)' }}
              >
                探索榜单 <Trophy className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/battle"
                className="inline-flex items-center px-10 py-5 bg-neutral-50/90 backdrop-blur-md text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-purple-600 border-2 border-gradient-to-r from-rose-200 to-purple-200 rounded-2xl font-semibold text-lg hover:bg-neutral-50 transition-all duration-300"
                style={{ boxShadow: '0 10px 30px rgba(147, 51, 234, 0.1)' }}
              >
                模型对决 <Swords className="ml-2 w-5 h-5 text-purple-600" />
              </Link>
            </motion.div>
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
              className="card hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
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
                    className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-xs rounded-full text-neutral-600 dark:text-neutral-400 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                to={`/model/${entry.model.id}`}
                className="btn-primary btn text-center"
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
              className="card p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105"
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
              className="card hover:shadow-xl transition-all duration-300"
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
                className="btn-secondary btn text-center mt-4"
              >
                参与投票
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="card p-12 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900">
        <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200 mb-12 text-center">
          <TrendingUp className="inline-block w-8 h-8 mr-2 text-success" />
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