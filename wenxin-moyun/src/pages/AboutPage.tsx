import { Target, Users, Zap, Shield, Heart, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { IOSButton, IOSCard, IOSCardHeader, IOSCardContent, IOSCardFooter, EmojiIcon } from '../components/ios';

export default function AboutPage() {
  const features = [
    {
      icon: Target,
      title: 'Professional Evaluation',
      description: 'Multi-dimensional evaluation system to comprehensively assess AI models in artistic creation'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Combining user voting with expert review to ensure objective and fair evaluation results'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Continuously tracking the latest AI models with timely updates to evaluation data and rankings'
    },
    {
      icon: Shield,
      title: 'Fair and Transparent',
      description: 'All evaluation standards and methods are open and transparent, subject to community supervision'
    }
  ];

  const roadmap = [
    {
      phase: 'Phase 1',
      title: 'MVP Stage',
      status: 'completed',
      items: ['Basic Leaderboard', 'Model Battle System', 'Core Evaluation Dimensions']
    },
    {
      phase: 'Phase 2',
      title: 'Feature Expansion',
      status: 'current',
      items: ['API Integration', 'Automated Evaluation', 'Community Gallery']
    },
    {
      phase: 'Phase 3',
      title: 'Ecosystem Building',
      status: 'upcoming',
      items: ['Custom Services', 'Expert Certification System', 'Creator Community']
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
          <span className="gradient-text">About WenXin MoYun</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          We are dedicated to becoming the world's leading AI model capability evaluation and insight platform in the humanities and arts,
          empowering creative expression with quantitative data and connecting technology developers with artistic creators.
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <IOSCard variant="glass" padding="xl" animate className="liquid-glass-container">
          <IOSCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <IOSCardHeader
                  title="Our Mission"
                  emoji={<EmojiIcon category="feedback" name="love" size="lg" />}
                  className="mb-4"
                />
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  In today's era of rapid AI development, we believe artistic creativity is a crucial dimension for measuring AI intelligence.
                  WenXin MoYun focuses on evaluating AI's creativity, aesthetic value, and cultural relevance in poetry, painting, narrative, and other artistic domains.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  By establishing a scientific and fair evaluation system, we aim to advance AI's artistic capabilities,
                  providing researchers with improvement directions, creators with tool selection criteria, and enthusiasts with the infinite possibilities of AI art.
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
          </IOSCardContent>
        </IOSCard>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center mb-8">
          Platform Features
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
              >
                <IOSCard variant="glass" interactive animate className="text-center h-full">
                  <IOSCardContent className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </IOSCardContent>
                </IOSCard>
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
        className="mb-12"
      >
        <IOSCard variant="glass" padding="xl" className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900">
          <IOSCardHeader
            title="Evaluation Methodology"
            emoji={<EmojiIcon category="feedback" name="info" size="lg" />}
            className="mb-6"
          />
          <IOSCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <EmojiIcon category="actions" name="like" size="sm" />
                  <span className="ml-2">1. Multi-dimensional Assessment</span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Comprehensive evaluation across six core dimensions: rhythm and meter, composition and color,
                  narrative logic, emotional expression, creative innovation, and cultural relevance.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <EmojiIcon category="status" name="completed" size="sm" />
                  <span className="ml-2">2. Standardized Testing</span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Using standardized prompts and evaluation tasks to ensure all models are tested under identical conditions,
                  guaranteeing comparable and fair results.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <EmojiIcon category="feedback" name="celebration" size="sm" />
                  <span className="ml-2">3. Human-AI Collaboration</span>
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Combining automated evaluation tools with human expert review to ensure both efficiency
                  and deep understanding with accurate assessment of artistic works.
                </p>
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      </motion.div>

      {/* Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center mb-8">
          Development Roadmap
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((phase, index) => (
            <div
              key={index}
              className={`
                relative ios-glass liquid-glass-container rounded-lg p-6 
                ${phase.status === 'current' ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
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
        className="ios-glass liquid-glass-container rounded-xl p-8 text-center"
      >
        <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">Join Our Journey</h2>
        <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
          Whether you're an AI researcher, artistic creator, or technology enthusiast, welcome to join the WenXin MoYun community
        </p>
        <div className="flex gap-4 justify-center">
          <IOSButton 
            variant="secondary" 
            size="lg" 
            glassMorphism
          >
            <EmojiIcon category="actions" name="upload" size="sm" />
            Submit Model
          </IOSButton>
          <IOSButton 
            variant="glass" 
            size="lg"
          >
            <EmojiIcon category="feedback" name="info" size="sm" />
            Contact Us
          </IOSButton>
        </div>
      </motion.div>
    </div>
  );
}