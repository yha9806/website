import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Activity, 
  TrendingUp, 
  Users, 
  Award,
  Zap,
  Globe,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import ScatterPlot from '../components/charts/ScatterPlot';
import BubbleChart from '../components/charts/BubbleChart';
import { mockBattles } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { entries, loading } = useLeaderboard();
  const [refreshing, setRefreshing] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!entries.length) return null;
    
    const totalModels = entries.length;
    // Filter out NULL scores for calculations
    const validScores = entries.filter(e => e.score != null).map(e => e.score);
    const avgScore = validScores.length > 0 ? validScores.reduce((acc, s) => acc + s, 0) / validScores.length : 0;
    const topScore = validScores.length > 0 ? Math.max(...validScores) : 0;
    const totalBattles = entries.reduce((acc, e) => acc + e.battles, 0);
    
    // Statistics by organization
    const byOrg = entries.reduce((acc, entry) => {
      const org = entry.model.organization;
      if (!acc[org]) acc[org] = 0;
      acc[org]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Statistics by category
    const byCategory = entries.reduce((acc, entry) => {
      const cat = entry.model.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat]++;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalModels,
      avgScore,
      topScore,
      totalBattles,
      byOrg,
      byCategory
    };
  }, [entries]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const MetricCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    color 
  }: {
    icon: any;
    label: string;
    value: string | number;
    change?: number;
    color: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="ios-glass liquid-glass-container rounded-xl shadow-lg p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
            }`}>
              <TrendingUp className="w-4 h-4" />
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            <BarChart className="inline-block w-10 h-10 mr-3 text-primary-600" />
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time AI Model Evaluation Platform Overview
          </p>
        </motion.div>
        
        <button
          onClick={handleRefresh}
          className={`p-3 ios-glass liquid-glass-container rounded-lg shadow hover:shadow-md transition-all ${
            refreshing ? 'animate-spin' : ''
          }`}
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Evaluated Models"
          value={stats.totalModels}
          change={12}
          color="bg-blue-500"
        />
        <MetricCard
          icon={Award}
          label="Highest Score"
          value={stats.topScore > 0 ? stats.topScore.toFixed(1) : 'N/A'}
          change={2.5}
          color="bg-green-500"
        />
        <MetricCard
          icon={Activity}
          label="Average Score"
          value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : 'N/A'}
          change={-1.2}
          color="bg-purple-500"
        />
        <MetricCard
          icon={Zap}
          label="Total Battles"
          value={stats.totalBattles.toLocaleString()}
          change={25}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scatter Plot */}
        <ScatterPlot
          data={entries}
          xAxis="score"
          yAxis="winRate"
          title="Score vs Win Rate Distribution"
          onModelClick={(entry) => navigate(`/model/${entry.model.id}`)}
        />
        
        {/* Bubble Chart */}
        <BubbleChart
          data={entries}
          title="Creativity and Cultural Dimension Analysis"
          onBubbleClick={(entry) => navigate(`/model/${entry.model.id}`)}
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Organization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ios-glass liquid-glass-container rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Organization Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byOrg)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([org, count]) => (
                <div key={org} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{org}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / stats.totalModels) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* By Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ios-glass liquid-glass-container rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-green-500" />
            Category Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byCategory).map(([category, count]) => {
              const percentage = (count / stats.totalModels) * 100;
              const categoryNames: Record<string, string> = {
                text: 'Text Generation',
                visual: 'Visual Creation',
                multimodal: 'Multimodal'
              };
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {categoryNames[category] || category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Battles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ios-glass liquid-glass-container rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Recent Battles
          </h3>
          <div className="space-y-3">
            {mockBattles.slice(0, 4).map((battle) => {
              const totalVotes = battle.votesA + battle.votesB;
              const percentA = totalVotes > 0 ? (battle.votesA / totalVotes) * 100 : 50;
              
              return (
                <div key={battle.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                      {battle.modelA.name}
                    </span>
                    <span className="text-xs text-gray-500 px-2">VS</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1 text-right">
                      {battle.modelB.name}
                    </span>
                  </div>
                  <div className="flex h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 transition-all duration-300"
                      style={{ width: `${percentA}%` }}
                    />
                    <div
                      className="bg-orange-500 transition-all duration-300"
                      style={{ width: `${100 - percentA}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{battle.votesA} votes</span>
                    <span>{battle.votesB} votes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-glass liquid-glass-container rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          🏆 Top Model Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {entries.slice(0, 3).map((entry, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={entry.model.id}
                className="flex items-center gap-4 p-4 ios-glass rounded-lg"
              >
                <div className="text-3xl">{medals[index]}</div>
                <img
                  src={entry.model.avatar}
                  alt={entry.model.name}
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {entry.model.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.model.organization}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm font-medium text-primary-600">
                      Score: {entry.score != null ? entry.score.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Win Rate: {entry.winRate != null ? entry.winRate.toFixed(1) : 'N/A'}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}