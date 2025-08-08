import { useState } from 'react';
import { Swords, RefreshCw, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockBattles } from '../data/mockData';

export default function BattlePage() {
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [votedBattles, setVotedBattles] = useState<Set<string>>(new Set());

  const currentBattle = mockBattles[currentBattleIndex];

  const handleVote = (choice: 'A' | 'B') => {
    if (votedBattles.has(currentBattle.id)) return;
    
    setUserVote(choice);
    setVotedBattles(new Set([...votedBattles, currentBattle.id]));
    
    // In a real app, this would send the vote to the backend
    if (choice === 'A') {
      currentBattle.votesA += 1;
    } else {
      currentBattle.votesB += 1;
    }
  };

  const nextBattle = () => {
    if (currentBattleIndex < mockBattles.length - 1) {
      setCurrentBattleIndex(currentBattleIndex + 1);
      setUserVote(null);
    }
  };

  const prevBattle = () => {
    if (currentBattleIndex > 0) {
      setCurrentBattleIndex(currentBattleIndex - 1);
      setUserVote(null);
    }
  };

  const totalVotes = currentBattle.votesA + currentBattle.votesB;
  const percentageA = totalVotes > 0 ? (currentBattle.votesA / totalVotes) * 100 : 50;
  const percentageB = totalVotes > 0 ? (currentBattle.votesB / totalVotes) * 100 : 50;

  const hasVoted = votedBattles.has(currentBattle.id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          <Swords className="inline-block w-10 h-10 mr-3 text-red-500" />
          模型对决竞技场
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          参与投票，帮助评选最优秀的 AI 艺术创作模型
        </p>
      </div>

      {/* Battle Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevBattle}
          disabled={currentBattleIndex === 0}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            对决 {currentBattleIndex + 1} / {mockBattles.length}
          </span>
        </div>
        
        <button
          onClick={nextBattle}
          disabled={currentBattleIndex === mockBattles.length - 1}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Battle Arena */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBattle.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8"
        >
          {/* Task Description */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {currentBattle.task.category}
              </span>
              <span className="text-xs px-2 py-1 bg-white dark:bg-gray-700 rounded-full">
                {currentBattle.task.difficulty === 'easy' ? '简单' : 
                 currentBattle.task.difficulty === 'medium' ? '中等' : '困难'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              创作任务
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              {currentBattle.task.prompt}
            </p>
          </div>

          {/* Models Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Model A */}
            <motion.div
              whileHover={{ scale: hasVoted ? 1 : 1.02 }}
              className={`
                border-2 rounded-xl p-6 transition-all cursor-pointer
                ${hasVoted && userVote === 'A' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-400'}
              `}
              onClick={() => !hasVoted && handleVote('A')}
            >
              <div className="text-center mb-4">
                <img
                  src={currentBattle.modelA.avatar}
                  alt={currentBattle.modelA.name}
                  className="w-20 h-20 rounded-xl mx-auto mb-3"
                />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {hasVoted ? currentBattle.modelA.name : '模型 A'}
                </h3>
                {hasVoted && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentBattle.modelA.organization}
                  </p>
                )}
              </div>

              {/* Sample Output (would be actual generated content in production) */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  {currentBattle.task.type === 'poem' ? 
                    '"秋月如霜照故园，梧桐叶落夜无眠..."' :
                    '[此处展示模型A的创作内容]'}
                </p>
              </div>

              {/* Vote Button or Results */}
              {!hasVoted ? (
                <button className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  投票给模型 A
                </button>
              ) : (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">得票率</span>
                    <span className="font-semibold">{percentageA.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentageA}%` }}
                      className="h-3 rounded-full bg-primary-500"
                    />
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {currentBattle.votesA} 票
                  </p>
                </div>
              )}
            </motion.div>

            {/* Model B */}
            <motion.div
              whileHover={{ scale: hasVoted ? 1 : 1.02 }}
              className={`
                border-2 rounded-xl p-6 transition-all cursor-pointer
                ${hasVoted && userVote === 'B' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-secondary-400'}
              `}
              onClick={() => !hasVoted && handleVote('B')}
            >
              <div className="text-center mb-4">
                <img
                  src={currentBattle.modelB.avatar}
                  alt={currentBattle.modelB.name}
                  className="w-20 h-20 rounded-xl mx-auto mb-3"
                />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {hasVoted ? currentBattle.modelB.name : '模型 B'}
                </h3>
                {hasVoted && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentBattle.modelB.organization}
                  </p>
                )}
              </div>

              {/* Sample Output */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  {currentBattle.task.type === 'poem' ? 
                    '"月华如水洒人间，秋思绵绵到天边..."' :
                    '[此处展示模型B的创作内容]'}
                </p>
              </div>

              {/* Vote Button or Results */}
              {!hasVoted ? (
                <button className="w-full py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors">
                  投票给模型 B
                </button>
              ) : (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">得票率</span>
                    <span className="font-semibold">{percentageB.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentageB}%` }}
                      className="h-3 rounded-full bg-secondary-500"
                    />
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {currentBattle.votesB} 票
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Battle Stats */}
          <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>总投票数: {totalVotes}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>状态: {currentBattle.status === 'active' ? '进行中' : '已结束'}</span>
            </div>
            <button className="flex items-center hover:text-primary-600 dark:hover:text-primary-400">
              <RefreshCw className="w-4 h-4 mr-2" />
              <span>刷新对决</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">公平对决</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            投票前不显示模型信息，确保评判客观公正
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🔄</div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">实时更新</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            投票结果实时更新，影响模型排行榜排名
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">多维评测</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            涵盖诗歌、绘画、叙事等多个艺术创作维度
          </p>
        </div>
      </div>
    </div>
  );
}