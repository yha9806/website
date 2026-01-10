/**
 * ExhibitionsPage
 *
 * Main page displaying all exhibitions
 *
 * @updated 2026-01-10 - Added multi-exhibition support
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ALL_EXHIBITIONS } from '../../data/exhibitions';
import { EmojiIcon } from '../../components/ios/core/EmojiIcon';
import { IOSCard, IOSCardContent, IOSCardHeader, IOSCardFooter } from '../../components/ios/core/IOSCard';
import { IOSButton } from '../../components/ios/core/IOSButton';

export function ExhibitionsPage() {
  // Calculate total stats
  const totalArtworks = ALL_EXHIBITIONS.reduce((sum, e) => sum + e.artworks_count, 0);
  const totalExhibitions = ALL_EXHIBITIONS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-block mb-4"
        >
          <EmojiIcon category="content" name="frame" size="xl" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Exhibitions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover contemporary art exhibitions featuring emerging artists from around the world.
          Experience AI-powered art criticism and RPAIT scoring for each artwork.
        </p>
      </div>

      {/* Exhibition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ALL_EXHIBITIONS.map((exhibition, index) => (
          <motion.div
            key={exhibition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Link to={`/exhibitions/${exhibition.id}`}>
              <IOSCard
                variant="elevated"
                interactive
                animate
                className="h-full overflow-hidden"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={exhibition.cover_image}
                    alt={exhibition.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-exhibition.jpg';
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exhibition.status === 'live'
                          ? 'bg-green-500 text-white'
                          : exhibition.status === 'upcoming'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {exhibition.status.toUpperCase()}
                    </span>
                  </div>
                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {exhibition.name}
                    </h3>
                    <p className="text-sm text-white/80">
                      {exhibition.name_zh}
                    </p>
                  </div>
                </div>

                <IOSCardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {exhibition.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {exhibition.has_chapters && (
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        Chapters
                      </span>
                    )}
                    {exhibition.has_dialogues && (
                      <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                        AI Dialogues
                      </span>
                    )}
                    {exhibition.has_rpait && (
                      <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                        RPAIT Scores
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <EmojiIcon category="content" name="frame" size="xs" />
                      {exhibition.artworks_count} artworks
                    </span>
                  </div>
                </IOSCardContent>

                <IOSCardFooter>
                  <IOSButton variant="primary" className="w-full">
                    View Exhibition
                  </IOSButton>
                </IOSCardFooter>
              </IOSCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-blue-500">{totalArtworks}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Artworks</p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-green-500">{totalExhibitions}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Exhibitions</p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-orange-500">50+</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Artists</p>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-purple-500">14</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI Critics</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ExhibitionsPage;
