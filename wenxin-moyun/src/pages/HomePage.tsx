import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockBattles, categories } from '../data/mockData';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { 
  IOSButton, 
  IOSCard, 
  IOSCardHeader, 
  IOSCardContent, 
  IOSCardFooter,
  IOSCardGrid,
  StatusEmoji, 
  TypeEmoji,
  RankEmoji,
  EmojiIcon
} from '../components/ios';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function HomePage() {
  const { entries: leaderboard } = useLeaderboard();
  const topModels = leaderboard.slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Modern iOS Hero Section */}
      <section className="relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="liquid-glass-hero rounded-3xl p-12 text-center"
        >
          {/* iOS Large Title */}
          <motion.h1 
            className="text-large-title mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            WenXin MoYun
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className="text-h2 mb-8 max-w-3xl mx-auto text-gray-600 dark:text-gray-300"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            AI Art Evaluation Platform
          </motion.p>
          
          {/* Description */}
          <motion.p 
            className="text-body mb-12 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Experience the future of AI creativity assessment with modern design and intelligent evaluation
          </motion.p>
          
          {/* iOS Button Group */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <Link to="/leaderboard">
                <IOSButton 
                  variant="primary" 
                  size="lg" 
                  emoji="favorite"
                  glassMorphism={true}
                  data-testid="explore-rankings-button"
                >
                  <EmojiIcon category="rating" name="star" size="sm" />
                  Explore Rankings
                </IOSButton>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <Link to="/battle">
                <IOSButton 
                  variant="secondary" 
                  size="lg" 
                  glassMorphism={true}
                  data-testid="model-battle-button"
                >
                  <EmojiIcon category="actions" name="battle" size="sm" />
                  Model Battle
                </IOSButton>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Top Models Table - Rich Content Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h2 flex items-center gap-2">
            <EmojiIcon category="rating" name="chart" size="md" />
            Model Rankings
            <EmojiIcon category="trend" name="hot" size="sm" />
          </h2>
          <Link to="/leaderboard">
            <IOSButton variant="text">
              View Full Rankings
            </IOSButton>
          </Link>
        </div>
        
        <IOSCard variant="glass" className="overflow-hidden liquid-glass-container">
          <IOSCardContent className="p-0">
            <LeaderboardTable 
              data={leaderboard.slice(0, 10).map(entry => ({
                ...entry,
                // 确保数据格式匹配
                change: Math.floor(Math.random() * 5) - 2, // 模拟趋势变化
                battles: Math.floor(Math.random() * 100) + 20,
                winRate: (entry.score || 0) * 0.8 + Math.random() * 10
              }))}
              loading={false}
              onRowClick={(entry) => window.location.href = `/model/${entry.model.id}`}
            />
          </IOSCardContent>
        </IOSCard>
      </section>

      {/* Top Models - iOS Style */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-h2 flex items-center gap-2">
            <RankEmoji rank={1} size="md" />
            Leading Models
            <EmojiIcon category="feedback" name="celebration" size="md" />
          </h2>
          <Link to="/leaderboard">
            <IOSButton variant="text">
              View All Rankings
            </IOSButton>
          </Link>
        </div>

        <IOSCardGrid columns={3} gap="lg">
          {topModels.map((entry, index) => (
            <IOSCard
              key={entry.model.id}
              variant="glass"
              interactive
              animate
              className="relative liquid-glass-container"
            >
              {/* Rank Badge - positioned at top-center to avoid blocking content */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <RankEmoji rank={entry.rank} size="lg" />
              </div>
              
              <IOSCardHeader
                title={entry.model.name}
                subtitle={entry.model.organization}
                emoji={<TypeEmoji type="painting" size="lg" />}
                action={
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {entry.score != null ? entry.score.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-footnote text-gray-500">Score</div>
                  </div>
                }
              />

              <IOSCardContent>
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {entry.model.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-xs rounded-full text-blue-600 dark:text-blue-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </IOSCardContent>

              <IOSCardFooter>
                <Link to={`/model/${entry.model.id}`} className="w-full">
                  <IOSButton 
                    variant="primary" 
                    size="md" 
                    className="w-full"
                  >
                    View Details
                  </IOSButton>
                </Link>
              </IOSCardFooter>
            </IOSCard>
          ))}
        </IOSCardGrid>
      </section>

      {/* Evaluation Categories - Liquid Glass Version */}
      <section className="liquid-glass-container rounded-2xl p-6">
        <h2 className="text-h2 mb-6 flex items-center gap-2">
          <EmojiIcon category="evaluationType" name="general" size="md" />
          Evaluation Dimensions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/leaderboard/${category.id}`}
              className="group"
            >
              <div className="flex items-center gap-2 px-4 py-3 ios-glass liquid-glass-container rounded-xl hover:shadow-md hover:scale-105 transition-all duration-200 border border-gray-100 dark:border-gray-700">
                <span className="text-2xl flex-shrink-0">{category.icon}</span>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {category.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Active Battles */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-h2 flex items-center gap-2">
            <EmojiIcon category="navigation" name="battle" size="md" />
            Live Battles
            <EmojiIcon category="trend" name="hot" size="md" />
          </h2>
          <Link to="/battle">
            <IOSButton variant="text">
              Join Voting
            </IOSButton>
          </Link>
        </div>

        <IOSCardGrid columns={2} gap="lg">
          {mockBattles.slice(0, 2).map((battle) => (
            <IOSCard
              key={battle.id}
              variant="glass"
              interactive
              animate
              className="liquid-glass-container"
            >
              <IOSCardHeader
                title={battle.task.category}
                subtitle={battle.task.prompt}
                emoji={<StatusEmoji status="processing" size="lg" animated />}
                action={<StatusEmoji status="pending" size="md" />}
              />

              <IOSCardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center">
                    <p className="font-semibold text-body">
                      {battle.modelA.name}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {battle.votesA}
                    </p>
                  </div>
                  <div className="text-gray-400 font-bold">VS</div>
                  <div className="text-center">
                    <p className="font-semibold text-body">
                      {battle.modelB.name}
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {battle.votesB}
                    </p>
                  </div>
                </div>
              </IOSCardContent>

              <IOSCardFooter>
                <Link to="/battle" className="w-full">
                  <IOSButton 
                    variant="secondary" 
                    size="md" 
                    className="w-full"
                    emoji="like"
                  >
                    Vote Now
                  </IOSButton>
                </Link>
              </IOSCardFooter>
            </IOSCard>
          ))}
        </IOSCardGrid>
      </section>

      {/* Platform Stats */}
      <section>
        <IOSCard variant="glass" padding="lg" className="text-center liquid-glass-container">
          <IOSCardHeader
            title="Platform Statistics"
            emoji={<TrendingUp className="w-8 h-8 text-green-600" />}
          />
          
          <IOSCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {leaderboard.length}
                </div>
                <p className="text-footnote">AI Models</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  1,248
                </div>
                <p className="text-footnote">Battle Rounds</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                  15,692
                </div>
                <p className="text-footnote">User Votes</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  6
                </div>
                <p className="text-footnote">Dimensions</p>
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      </section>
    </div>
  );
}