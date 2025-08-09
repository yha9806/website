import { useState, useEffect, useCallback } from 'react';
import { Swords, RefreshCw, Users, Clock, ChevronLeft, ChevronRight, Loader2, Wifi, WifiOff, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattles } from '../hooks/useBattles';
import { useWebSocket, type BattleUpdateData } from '../hooks/useWebSocket';
import type { Battle } from '../types/types';

export default function BattlePage() {
  const { battles, loading, error, voteBattle, getRandomBattle } = useBattles();
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [userVote, setUserVote] = useState<'A' | 'B' | null>(null);
  const [votedBattles, setVotedBattles] = useState<Set<string>>(new Set());
  const [voteLoading, setVoteLoading] = useState(false);
  const [realtimeVotes, setRealtimeVotes] = useState<{[battleId: string]: {model1_votes: number, model2_votes: number}}>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [flashAnimation, setFlashAnimation] = useState<'A' | 'B' | null>(null);

  // WebSocket连接用于实时投票更新
  const handleBattleUpdate = useCallback((data: BattleUpdateData) => {
    console.log('Real-time battle update:', data);
    
    // 更新实时投票数据
    setRealtimeVotes(prev => ({
      ...prev,
      [data.id]: {
        model1_votes: data.model1_votes,
        model2_votes: data.model2_votes
      }
    }));
    
    setLastUpdateTime(new Date());
    
    // 如果是当前对战，更新投票数并触发闪烁动画
    if (currentBattle && data.id === currentBattle.id) {
      const oldVotesA = currentBattle.votesA;
      const oldVotesB = currentBattle.votesB;
      
      // 检测哪个模型获得了新投票
      if (data.model1_votes > oldVotesA) {
        setFlashAnimation('A');
        setTimeout(() => setFlashAnimation(null), 600);
      } else if (data.model2_votes > oldVotesB) {
        setFlashAnimation('B');
        setTimeout(() => setFlashAnimation(null), 600);
      }
      
      setCurrentBattle({
        ...currentBattle,
        votesA: data.model1_votes,
        votesB: data.model2_votes
      });
    }
  }, [currentBattle]);
  
  // 重新启用WebSocket连接
  const { isConnected, connectionError, useSSE } = useWebSocket({
    room: 'battle',
    onBattleUpdate: handleBattleUpdate,
    reconnectInterval: 3000,
    maxReconnectAttempts: 3
  });

  // Initialize with random battle when battles are loaded
  useEffect(() => {
    const loadInitialBattle = async () => {
      if (loading || battles.length === 0) return;
      
      console.log('Initializing battle page with', battles.length, 'battles');
      
      try {
        const randomBattle = await getRandomBattle();
        if (randomBattle) {
          console.log('Setting random battle:', randomBattle.id);
          setCurrentBattle(randomBattle);
          
          // Find and set the index
          const index = battles.findIndex(b => b.id === randomBattle.id);
          if (index !== -1) {
            setCurrentBattleIndex(index);
          }
        } else if (battles.length > 0) {
          console.log('Using first battle:', battles[0].id);
          setCurrentBattle(battles[0]);
          setCurrentBattleIndex(0);
        }
      } catch (error) {
        console.error('Failed to load initial battle:', error);
        // Fallback to first battle if available
        if (battles.length > 0) {
          setCurrentBattle(battles[0]);
          setCurrentBattleIndex(0);
        }
      }
    };

    loadInitialBattle();
  }, [loading, battles.length]); // 移除getRandomBattle依赖，避免循环

  const handleVote = async (choice: 'A' | 'B') => {
    if (!currentBattle || votedBattles.has(currentBattle.id)) return;
    
    setVoteLoading(true);
    try {
      const voteChoice = choice === 'A' ? 'model_a' : 'model_b';
      const result = await voteBattle(currentBattle.id, voteChoice);
      
      if (result.success) {
        setUserVote(choice);
        setVotedBattles(new Set([...votedBattles, currentBattle.id]));
        
        // Update local vote counts
        setCurrentBattle({
          ...currentBattle,
          votesA: result.votes_a,
          votesB: result.votes_b
        });
      } else {
        console.error('Vote failed:', result.message);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoteLoading(false);
    }
  };

  const nextBattle = () => {
    if (currentBattleIndex < battles.length - 1) {
      const nextIndex = currentBattleIndex + 1;
      setCurrentBattleIndex(nextIndex);
      setCurrentBattle(battles[nextIndex]);
      setUserVote(votedBattles.has(battles[nextIndex].id) ? 'A' : null); // Restore vote state if already voted
    }
  };

  const prevBattle = () => {
    if (currentBattleIndex > 0) {
      const prevIndex = currentBattleIndex - 1;
      setCurrentBattleIndex(prevIndex);
      setCurrentBattle(battles[prevIndex]);
      setUserVote(votedBattles.has(battles[prevIndex].id) ? 'A' : null); // Restore vote state if already voted
    }
  };

  const refreshBattle = async () => {
    const randomBattle = await getRandomBattle();
    if (randomBattle) {
      setCurrentBattle(randomBattle);
      setUserVote(votedBattles.has(randomBattle.id) ? 'A' : null);
      // Find index of this battle
      const index = battles.findIndex(b => b.id === randomBattle.id);
      if (index !== -1) {
        setCurrentBattleIndex(index);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在加载对战数据...</p>
        </div>
      </div>
    );
  }

  if (!currentBattle && battles.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">暂无可用的对战</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!currentBattle) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在获取随机对战...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400">
        加载失败: {error}
      </div>
    );
  }

  const totalVotes = currentBattle.votesA + currentBattle.votesB;
  const percentageA = totalVotes > 0 ? (currentBattle.votesA / totalVotes) * 100 : 50;
  const percentageB = totalVotes > 0 ? (currentBattle.votesB / totalVotes) * 100 : 50;

  const hasVoted = votedBattles.has(currentBattle.id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
            <Swords className="inline-block w-10 h-10 mr-3 text-red-500" />
            模型对决竞技场
          </h1>
          
          {/* 实时连接状态指示器 - 使用稳定的状态显示 */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all duration-500 ${
            isConnected 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : useSSE
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
              : connectionError?.includes('retrying')
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>实时连接</span>
                <Zap className="w-3 h-3 animate-pulse" />
              </>
            ) : useSSE ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>备用连接</span>
              </>
            ) : connectionError?.includes('retrying') ? (
              <>
                <Wifi className="w-4 h-4 animate-spin" />
                <span>重连中</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>离线模式</span>
              </>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400">
          参与投票，帮助评选最优秀的 AI 艺术创作模型
        </p>
        
        {lastUpdateTime && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            最后更新: {lastUpdateTime.toLocaleTimeString()}
          </p>
        )}
        
        {connectionError && (
          <p className="text-xs text-red-500 mt-2">
            连接错误: {connectionError}
          </p>
        )}
      </div>

      {/* Battle Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevBattle}
          disabled={currentBattleIndex === 0}
          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            对决 {currentBattleIndex + 1} / {battles.length}
          </span>
        </div>
        
        <button
          onClick={nextBattle}
          disabled={currentBattleIndex === battles.length - 1}
          className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
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
          className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-xl p-8"
        >
          {/* Task Description */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {currentBattle.task.category}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full">
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
                <button 
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={voteLoading}
                >
                  {voteLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '投票给模型 A'
                  )}
                </button>
              ) : (
                <motion.div
                  animate={flashAnimation === 'A' ? { 
                    scale: [1, 1.05, 1],
                    backgroundColor: ['rgba(0, 0, 0, 0)', 'rgba(59, 130, 246, 0.1)', 'rgba(0, 0, 0, 0)']
                  } : {}}
                  transition={{ duration: 0.6 }}
                  className="rounded-lg p-2"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">得票率</span>
                    <motion.span 
                      className="font-semibold"
                      animate={flashAnimation === 'A' ? { 
                        scale: [1, 1.2, 1],
                        color: ['#000000', '#3b82f6', '#000000']
                      } : {}}
                    >
                      {percentageA.toFixed(1)}%
                    </motion.span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${percentageA}%`,
                        backgroundColor: flashAnimation === 'A' ? '#3b82f6' : undefined
                      }}
                      transition={{ 
                        width: { duration: 0.5 },
                        backgroundColor: flashAnimation === 'A' ? { duration: 0.3 } : undefined
                      }}
                      className="h-3 rounded-full bg-primary-500"
                    />
                  </div>
                  <motion.p 
                    className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400"
                    animate={flashAnimation === 'A' ? { 
                      scale: [1, 1.1, 1],
                      fontWeight: [400, 700, 400]
                    } : {}}
                  >
                    {currentBattle.votesA} 票
                    {flashAnimation === 'A' && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="ml-2 text-primary-600"
                      >
                        +1
                      </motion.span>
                    )}
                  </motion.p>
                </motion.div>
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
                <button 
                  className="w-full py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={voteLoading}
                >
                  {voteLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '投票给模型 B'
                  )}
                </button>
              ) : (
                <motion.div
                  animate={flashAnimation === 'B' ? { 
                    scale: [1, 1.05, 1],
                    backgroundColor: ['rgba(0, 0, 0, 0)', 'rgba(16, 185, 129, 0.1)', 'rgba(0, 0, 0, 0)']
                  } : {}}
                  transition={{ duration: 0.6 }}
                  className="rounded-lg p-2"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">得票率</span>
                    <motion.span 
                      className="font-semibold"
                      animate={flashAnimation === 'B' ? { 
                        scale: [1, 1.2, 1],
                        color: ['#000000', '#10b981', '#000000']
                      } : {}}
                    >
                      {percentageB.toFixed(1)}%
                    </motion.span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${percentageB}%`,
                        backgroundColor: flashAnimation === 'B' ? '#10b981' : undefined
                      }}
                      transition={{ 
                        width: { duration: 0.5 },
                        backgroundColor: flashAnimation === 'B' ? { duration: 0.3 } : undefined
                      }}
                      className="h-3 rounded-full bg-secondary-500"
                    />
                  </div>
                  <motion.p 
                    className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400"
                    animate={flashAnimation === 'B' ? { 
                      scale: [1, 1.1, 1],
                      fontWeight: [400, 700, 400]
                    } : {}}
                  >
                    {currentBattle.votesB} 票
                    {flashAnimation === 'B' && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="ml-2 text-secondary-600"
                      >
                        +1
                      </motion.span>
                    )}
                  </motion.p>
                </motion.div>
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
            <button 
              onClick={refreshBattle}
              className="flex items-center hover:text-primary-600 dark:hover:text-primary-400"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span>刷新对决</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">公平对决</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            投票前不显示模型信息，确保评判客观公正
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="text-3xl mb-2">🔄</div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">实时更新</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            投票结果实时更新，影响模型排行榜排名
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
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