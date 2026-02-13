/**
 * Changelog Page
 *
 * Displays version history and updates for the VULCA platform.
 * Part of Sprint 0: SEO infrastructure.
 */

import { motion } from 'framer-motion';
import { IOSCard, IOSCardContent } from '../components/ios/core/IOSCard';
import {
  Sparkles, Bug, Zap, Package, Shield, FileText
} from 'lucide-react';
import { usePageSEO } from '../hooks/useSEO';
import { VERSION_BADGE } from '../config/version';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Change type icons and colors
const changeTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  feature: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'bg-slate-600/10 text-slate-600',
    label: 'New Feature'
  },
  improvement: {
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-green-500/10 text-green-500',
    label: 'Improvement'
  },
  fix: {
    icon: <Bug className="w-4 h-4" />,
    color: 'bg-orange-500/10 text-orange-500',
    label: 'Bug Fix'
  },
  security: {
    icon: <Shield className="w-4 h-4" />,
    color: 'bg-red-500/10 text-red-500',
    label: 'Security'
  },
  breaking: {
    icon: <Package className="w-4 h-4" />,
    color: 'bg-amber-600/10 text-amber-600',
    label: 'Breaking Change'
  }
};

// Changelog data
const changelog = [
  {
    version: '1.2.0',
    date: '2026-01-12',
    title: 'VULCA 47D Framework & Enterprise Features',
    changes: [
      {
        type: 'feature',
        description: '47-dimension VULCA evaluation framework with complete cultural analysis'
      },
      {
        type: 'feature',
        description: '8 cultural perspective support (Chinese, Western, Japanese, Korean, Indian, Middle Eastern, African, Latin American)'
      },
      {
        type: 'feature',
        description: 'Sample report PDF download for enterprise evaluation preview'
      },
      {
        type: 'feature',
        description: 'Pilot request page with lead capture integration'
      },
      {
        type: 'improvement',
        description: 'Firebase Hosting configuration for improved performance and SEO'
      },
      {
        type: 'improvement',
        description: 'Sentry error monitoring integration for production stability'
      },
      {
        type: 'security',
        description: 'GCP monitoring alerts and budget controls'
      }
    ]
  },
  {
    version: '1.1.0',
    date: '2025-12-15',
    title: 'Leaderboard & Real-time Evaluation',
    changes: [
      {
        type: 'feature',
        description: 'Comprehensive leaderboard with 42 AI models from 15 organizations'
      },
      {
        type: 'feature',
        description: 'Real-time evaluation progress tracking with visual feedback'
      },
      {
        type: 'feature',
        description: 'Model comparison and battle mode for head-to-head evaluation'
      },
      {
        type: 'improvement',
        description: 'iOS design system with glass morphism effects'
      },
      {
        type: 'improvement',
        description: 'Dark mode support across all pages'
      },
      {
        type: 'fix',
        description: 'Fixed mobile responsive layout issues on leaderboard'
      }
    ]
  },
  {
    version: '1.0.0',
    date: '2025-11-01',
    title: 'Initial Release',
    changes: [
      {
        type: 'feature',
        description: 'VULCA platform launch with basic model evaluation'
      },
      {
        type: 'feature',
        description: 'VULCA 6D scoring system (Creativity, Technique, Emotion, Context, Innovation, Impact)'
      },
      {
        type: 'feature',
        description: 'Exhibition module with AI dialogue generation for artworks'
      },
      {
        type: 'feature',
        description: 'User authentication with JWT tokens'
      },
      {
        type: 'improvement',
        description: 'FastAPI backend with async SQLAlchemy'
      },
      {
        type: 'improvement',
        description: 'React 19 frontend with TypeScript'
      }
    ]
  },
  {
    version: '0.9.0',
    date: '2025-10-01',
    title: 'Beta Release',
    changes: [
      {
        type: 'feature',
        description: 'Beta version for internal testing'
      },
      {
        type: 'feature',
        description: 'Basic model ranking and scoring'
      },
      {
        type: 'improvement',
        description: 'Initial UI/UX design implementation'
      }
    ]
  }
];

export default function ChangelogPage() {
  usePageSEO({
    title: 'Changelog | VULCA',
    description: 'See what\'s new in VULCA. Latest updates, features, improvements, and bug fixes for the AI cultural evaluation platform.',
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-600/10 text-slate-600 dark:text-slate-500 text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Current Version: {VERSION_BADGE.short}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Changelog
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Track the evolution of VULCA. See new features, improvements, and fixes.
          </p>
        </motion.div>

        {/* Legend */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-12">
          {Object.entries(changeTypeConfig).map(([key, config]) => (
            <div
              key={key}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color} text-sm`}
            >
              {config.icon}
              {config.label}
            </div>
          ))}
        </motion.div>

        {/* Changelog entries */}
        <div className="space-y-8">
          {changelog.map((release, index) => (
            <motion.div key={release.version} variants={itemVariants}>
              <IOSCard variant="elevated">
                {/* Custom header for changelog entry */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      v{release.version}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(release.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {release.title}
                    </span>
                  </div>
                </div>
                <IOSCardContent>
                  <ul className="space-y-3">
                    {release.changes.map((change, changeIndex) => {
                      const config = changeTypeConfig[change.type];
                      return (
                        <li
                          key={changeIndex}
                          className="flex items-start gap-3"
                        >
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.color} flex-shrink-0 mt-0.5`}>
                            {config.icon}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {change.description}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </IOSCardContent>
              </IOSCard>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center mt-12">
          <p className="text-gray-500 dark:text-gray-400">
            Looking for older versions? Check our{' '}
            <a
              href="https://github.com/yha9806/website"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:underline"
            >
              GitHub repository
            </a>{' '}
            for complete history.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
