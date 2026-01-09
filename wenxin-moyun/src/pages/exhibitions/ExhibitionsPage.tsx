/**
 * ExhibitionsPage
 *
 * Main page displaying all exhibitions
 */

import { motion } from 'framer-motion';
import { useExhibitions } from '../../hooks/exhibitions';
import { ExhibitionCard } from '../../components/exhibition';
import { EmojiIcon } from '../../components/ios/core/EmojiIcon';

export function ExhibitionsPage() {
  const { exhibition, loading, error } = useExhibitions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading exhibitions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <EmojiIcon category="symbols" name="warning" size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Exhibitions
          </h2>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

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
          <EmojiIcon category="objects" name="frame" size="xl" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Exhibitions
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover contemporary art exhibitions featuring emerging artists from around the world.
          Experience AI-powered art criticism dialogues for each artwork.
        </p>
      </div>

      {/* Exhibition Grid */}
      {exhibition && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ExhibitionCard exhibition={exhibition} />
          </motion.div>

          {/* Placeholder for future exhibitions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center min-h-[300px]"
          >
            <div className="text-center p-6">
              <EmojiIcon category="symbols" name="sparkles" size="lg" className="mx-auto mb-3 opacity-50" />
              <p className="text-gray-400 dark:text-gray-500 font-medium">
                More exhibitions coming soon
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Section */}
      {exhibition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-blue-500">{exhibition.artworks_count}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Artworks</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-green-500">{exhibition.chapters.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chapters</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-orange-500">50+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Artists</p>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-purple-500">8</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI Critics</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default ExhibitionsPage;
