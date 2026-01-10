/**
 * ArtworkDetail Component
 *
 * Displays full artwork information with images, description, and artist details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Artwork } from '../../types/exhibition';
import { IOSButton } from '../ios/core/IOSButton';
import { IOSCard, IOSCardContent } from '../ios/core/IOSCard';
import { EmojiIcon } from '../ios/core/EmojiIcon';

interface ArtworkDetailProps {
  artwork: Artwork;
}

export function ArtworkDetail({ artwork }: ArtworkDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle images - they can be strings or objects with url property
  const getImageUrl = (image: string | { url: string }) => {
    if (typeof image === 'string') return image;
    return image?.url || '';
  };

  const hasMultipleImages = artwork.images && artwork.images.length > 1;
  const hasVideo = !!artwork.video_url;

  // Get artist initials safely
  const artistInitials = (artwork.artist?.firstName?.[0] || '') + (artwork.artist?.lastName?.[0] || '') || '?';

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      <div className="relative">
        {/* Main Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={getImageUrl(artwork.images?.[currentImageIndex]) || artwork.image_url || ''}
              alt={`${artwork.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>

          {/* Image Navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? artwork.images.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === artwork.images.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {artwork.images.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {hasMultipleImages && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {artwork.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`
                  flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${
                    index === currentImageIndex
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <img src={getImageUrl(image)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Button */}
      {hasVideo && (
        <a
          href={artwork.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <IOSButton variant="secondary" className="w-full" glassMorphism>
            <EmojiIcon category="content" name="video" size="sm" />
            Watch Video
          </IOSButton>
        </a>
      )}

      {/* Artwork Info */}
      <IOSCard variant="elevated">
        <IOSCardContent className="space-y-4">
          {/* Title & Chapter */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {artwork.title}
            </h1>
            {artwork.chapter && (
              <p className="text-sm text-blue-500 mt-1">{artwork.chapter.name}</p>
            )}
          </div>

          {/* Artist */}
          <div className="flex items-center gap-3 py-3 border-t border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {artistInitials}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {artwork.artist?.fullName || artwork.artist?.nickname || 'Unknown Artist'}
              </p>
              {(artwork.artist?.school || artwork.artist?.major) && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {[artwork.artist.school, artwork.artist.major].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Medium</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                {artwork.medium}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Material</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                {artwork.material}
              </p>
            </div>
            {artwork.dimensions && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Size</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {artwork.dimensions}
                </p>
              </div>
            )}
            {artwork.year && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Year</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                  {artwork.year}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {artwork.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">About</p>
              <div className={`text-sm text-gray-700 dark:text-gray-300 ${!isExpanded ? 'line-clamp-4' : ''}`}>
                {artwork.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ))}
              </div>
              {artwork.description.length > 300 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-500 text-sm font-medium mt-2"
                >
                  {isExpanded ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}

          {/* Categories */}
          {artwork.categories && artwork.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              {artwork.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </IOSCardContent>
      </IOSCard>

      {/* Artist Bio */}
      {artwork.artist.profile && (
        <IOSCard variant="bordered">
          <IOSCardContent>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              About the Artist
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {artwork.artist.profile}
            </p>
          </IOSCardContent>
        </IOSCard>
      )}
    </div>
  );
}

export default ArtworkDetail;
