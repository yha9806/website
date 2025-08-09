import React from 'react';
import { motion } from 'framer-motion';
import { Star, Image, FileText, Music, BookOpen } from 'lucide-react';
import type { Artwork } from '../../types/types';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick?: () => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onClick }) => {
  const getTypeIcon = () => {
    switch (artwork.type) {
      case 'poem':
        return <FileText className="w-5 h-5" />;
      case 'painting':
        return <Image className="w-5 h-5" />;
      case 'story':
        return <BookOpen className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (artwork.type) {
      case 'poem':
        return '诗词';
      case 'painting':
        return '绘画';
      case 'story':
        return '故事';
      case 'music':
        return '音乐';
      default:
        return '作品';
    }
  };

  const renderContent = () => {
    if (artwork.type === 'painting' && artwork.imageUrl) {
      return (
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="object-cover rounded-lg"
            loading="lazy"
          />
        </div>
      );
    }

    if (artwork.content) {
      const displayContent = artwork.content.length > 150 
        ? artwork.content.substring(0, 150) + '...' 
        : artwork.content;
      
      return (
        <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line mb-4">
          {displayContent}
        </p>
      );
    }

    return null;
  };

  return (
    <motion.div
      className="bg-neutral-50 dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getTypeLabel()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm font-semibold">{artwork.score.toFixed(1)}</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
        {artwork.title}
      </h3>

      {renderContent()}

      {artwork.prompt && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">创作提示</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {artwork.prompt}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        {new Date(artwork.createdAt).toLocaleDateString('zh-CN')}
      </div>
    </motion.div>
  );
};

export default ArtworkCard;