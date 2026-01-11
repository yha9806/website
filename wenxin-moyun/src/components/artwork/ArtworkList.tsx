import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Loader } from 'lucide-react';
import ArtworkCard from './ArtworkCard';
import type { Artwork } from '../../types/types';

interface ArtworkListProps {
  artworks: Artwork[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  showFilters?: boolean;
}

const ArtworkList: React.FC<ArtworkListProps> = ({ 
  artworks, 
  loading = false,
  error = null,
  title = 'Artwork Gallery',
  showFilters = true
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const types = [
    { value: 'all', label: 'All' },
    { value: 'poem', label: 'Poetry' },
    { value: 'painting', label: 'Painting' },
    { value: 'story', label: 'Story' },
    { value: 'music', label: 'Music' }
  ];

  const filteredArtworks = artworks.filter(artwork => 
    selectedType === 'all' || artwork.type === selectedType
  );

  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        
        {showFilters && artworks.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-neutral-50 dark:bg-gray-800 text-sm"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'date')}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-neutral-50 dark:bg-gray-800 text-sm"
            >
              <option value="score">By Score</option>
              <option value="date">By Date</option>
            </select>
          </div>
        )}
      </div>

      {sortedArtworks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400">
            {selectedType === 'all' ? 'No artworks yet' : `No ${types.find(t => t.value === selectedType)?.label} artworks yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {sortedArtworks.map((artwork, index) => (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <ArtworkCard 
                  artwork={artwork}
                  onClick={() => {
                    // Could open a modal or navigate to detail page
                    console.log('Artwork clicked:', artwork);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ArtworkList;