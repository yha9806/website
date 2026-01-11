import { useNavigate, Link } from 'react-router-dom';
import RouterLink from '../components/common/RouterLink';
import { ArrowRight, Trophy, FlaskConical, Image, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardFooter,
  IOSCardGrid,
  RankEmoji
} from '../components/ios';

export default function HomePage() {
  const navigate = useNavigate();
  const { entries: leaderboard } = useLeaderboard();
  const topModels = leaderboard.slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Hero Section - Simplified */}
      <section className="relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="liquid-glass-hero rounded-3xl p-12 text-center"
        >
          <motion.h1
            className="text-large-title mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            WenXin MoYun
          </motion.h1>

          <motion.p
            className="text-h2 mb-4 max-w-3xl mx-auto text-gray-600 dark:text-gray-300"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            AI Art Evaluation Platform
          </motion.p>

          <motion.p
            className="text-body mb-10 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Multi-dimensional AI creativity assessment with VULCA 47D framework
          </motion.p>

          {/* Single Primary CTA */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <RouterLink to="/models">
              <IOSButton
                variant="primary"
                size="lg"
                glassMorphism={true}
                data-testid="explore-models-button"
              >
                <Trophy className="w-5 h-5" />
                Explore Models
                <ArrowRight className="w-5 h-5 ml-1" />
              </IOSButton>
            </RouterLink>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Models - Top 3 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h2 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-500" />
            Top Models
          </h2>
          <RouterLink to="/models">
            <IOSButton variant="text" size="sm" className="flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </IOSButton>
          </RouterLink>
        </div>

        <IOSCardGrid columns={3} gap="md">
          {topModels.map((entry) => (
            <IOSCard
              key={entry.model.id}
              variant="elevated"
              interactive
              animate
              className="relative"
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 -right-3 z-10">
                <RankEmoji rank={entry.rank} size="md" />
              </div>

              <IOSCardHeader
                title={entry.model.name}
                subtitle={entry.model.organization}
                action={
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {entry.score != null ? entry.score.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                  </div>
                }
              />

              <IOSCardContent>
                <div className="flex flex-wrap gap-1.5">
                  {entry.model.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded-md text-gray-600 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </IOSCardContent>

              <IOSCardFooter>
                <RouterLink to={`/model/${entry.model.id}`} className="w-full">
                  <IOSButton variant="secondary" size="sm" className="w-full">
                    Details
                  </IOSButton>
                </RouterLink>
              </IOSCardFooter>
            </IOSCard>
          ))}
        </IOSCardGrid>
      </section>

      {/* VULCA + Exhibition */}
      <section>
        <IOSCardGrid columns={2} gap="md">
          {/* VULCA */}
          <IOSCard variant="elevated">
            <IOSCardHeader
              title="VULCA Framework"
              subtitle="47D Evaluation System"
              emoji={<FlaskConical className="w-6 h-6 text-purple-500" />}
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Multi-cultural evaluation with 8 perspectives and 47 dimensions.
              </p>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">47</div>
                  <div className="text-xs text-gray-500">Dimensions</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">8</div>
                  <div className="text-xs text-gray-500">Perspectives</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">6</div>
                  <div className="text-xs text-gray-500">Core Areas</div>
                </div>
              </div>
            </IOSCardContent>
            <IOSCardFooter>
              <RouterLink to="/vulca" className="w-full">
                <IOSButton variant="secondary" size="sm" className="w-full">
                  Explore <ArrowRight className="w-4 h-4 ml-1" />
                </IOSButton>
              </RouterLink>
            </IOSCardFooter>
          </IOSCard>

          {/* Exhibition */}
          <IOSCard variant="elevated">
            <IOSCardHeader
              title="Echoes and Returns"
              subtitle="Contemporary Art"
              emoji={<Image className="w-6 h-6 text-orange-500" />}
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                AI dialogue on 87 artworks with multi-persona art criticism.
              </p>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">87</div>
                  <div className="text-xs text-gray-500">Artworks</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-pink-600 dark:text-pink-400">8</div>
                  <div className="text-xs text-gray-500">Critics</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-400">6</div>
                  <div className="text-xs text-gray-500">Chapters</div>
                </div>
              </div>
            </IOSCardContent>
            <IOSCardFooter>
              <RouterLink to="/exhibitions" className="w-full">
                <IOSButton variant="secondary" size="sm" className="w-full">
                  View <ArrowRight className="w-4 h-4 ml-1" />
                </IOSButton>
              </RouterLink>
            </IOSCardFooter>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* Stats Bar */}
      <section>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
          <div className="flex justify-center gap-12 md:gap-20">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {leaderboard.length}
              </div>
              <p className="text-xs text-gray-500">Models</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                130
              </div>
              <p className="text-xs text-gray-500">Artworks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                47
              </div>
              <p className="text-xs text-gray-500">Dimensions</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                8
              </div>
              <p className="text-xs text-gray-500">Perspectives</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
