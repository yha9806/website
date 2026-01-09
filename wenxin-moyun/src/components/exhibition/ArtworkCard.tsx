/**
 * ArtworkCard Component
 *
 * Displays a single artwork in a card format
 */

import { Link } from 'react-router-dom';
import type { Artwork } from '../../types/exhibition';
import { IOSCard, IOSCardContent } from '../ios/core/IOSCard';

interface ArtworkCardProps {
  artwork: Artwork;
  exhibitionId: string;
}

export function ArtworkCard({ artwork, exhibitionId }: ArtworkCardProps) {
  const thumbnail = artwork.images[0] || '/placeholder-artwork.jpg';

  return (
    <Link to={`/exhibitions/${exhibitionId}/${artwork.id}`}>
      <IOSCard variant="elevated" interactive animate className="overflow-hidden group">
        {/* Thumbnail */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={thumbnail}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Video indicator */}
          {artwork.video_url && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Video
            </div>
          )}
        </div>

        <IOSCardContent className="p-3">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
            {artwork.title}
          </h3>

          {/* Artist */}
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {artwork.artist.fullName}
          </p>

          {/* Medium */}
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 line-clamp-1">
            {artwork.medium}
          </p>
        </IOSCardContent>
      </IOSCard>
    </Link>
  );
}

export default ArtworkCard;
