import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Heart, Share2, Eye } from 'lucide-react';
import { IOSButton, IOSCard, IOSCardHeader, IOSCardContent, IOSSegmentedControl } from '../components/ios';
import { galleryApi, handleApiError, isNetworkError } from '../services/api';

interface Artwork {
  id: string;
  type: 'poem' | 'painting' | 'story' | 'music';
  title: string;
  content?: string;
  image_url?: string;
  model_id: string;
  model_name?: string;  // From backend relationship
  likes: number;
  views: number;
  created_at: string;
  prompt: string;
  score?: number;
  extra_metadata?: any;
}

interface ArtworkResponse {
  artworks: Artwork[];
  total: number;
  page: number;
  page_size: number;
}

export default function GalleryPage() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cachedArtworks, setCachedArtworks] = useState<Artwork[]>([]);

  const filterOptions = ['All', 'Poetry', 'Painting', 'Story', 'Music'];
  const filterValues = ['all', 'poem', 'painting', 'story', 'music'];

  // Fetch artworks from API
  const fetchArtworks = async (type?: string) => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = {};
      if (type && type !== 'all') {
        params.type = type;
      }
      
      const response = await galleryApi.getArtworks(params);
      const data: ArtworkResponse = response.data;
      
      setArtworks(data.artworks || []);
      setCachedArtworks(data.artworks || []);
      setIsOffline(false);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching artworks:', err);
      
      // Check if this is a network error and we have cached data
      if (isNetworkError(err)) {
        setIsOffline(true);
        if (cachedArtworks.length > 0) {
          setArtworks(cachedArtworks);
          setError(''); // Clear error when showing cached data
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Load artworks on component mount and when filter changes
  useEffect(() => {
    fetchArtworks(filter);
  }, [filter]);

  const filteredArtworks = artworks; // No need for client-side filtering as API handles it

  const handleFilterChange = (index: number) => {
    setSelectedIndex(index);
    setFilter(filterValues[index]);
  };

  const handleLike = async (id: string) => {
    try {
      // Optimistic update
      const newLikedItems = new Set(likedItems);
      const wasLiked = likedItems.has(id);
      
      if (wasLiked) {
        newLikedItems.delete(id);
        setArtworks(prev => prev.map(item => 
          item.id === id ? { ...item, likes: Math.max(0, item.likes - 1) } : item
        ));
      } else {
        newLikedItems.add(id);
        setArtworks(prev => prev.map(item => 
          item.id === id ? { ...item, likes: item.likes + 1 } : item
        ));
      }
      setLikedItems(newLikedItems);

      // Call API (for now we only increment, no unlike functionality in backend)
      if (!wasLiked) {
        const response = await galleryApi.likeArtwork(id);
        
        // Update with actual count from server
        if (response.data.new_likes !== undefined) {
          setArtworks(prev => prev.map(item => 
            item.id === id ? { ...item, likes: response.data.new_likes } : item
          ));
        }
      }
    } catch (err) {
      // Revert optimistic update on error
      console.error('Error liking artwork:', err);
      
      // Show user-friendly error for offline mode
      if (isNetworkError(err)) {
        setIsOffline(true);
        // Keep the optimistic update in offline mode
        return;
      }
      
      // Revert the like state for other errors
      const newLikedItems = new Set(likedItems);
      const wasLiked = likedItems.has(id);
      if (!wasLiked) {
        newLikedItems.delete(id);
      } else {
        newLikedItems.add(id);
      }
      setLikedItems(newLikedItems);
      
      // Refresh artworks to get correct count
      fetchArtworks(filter);
    }
  };

  const handleShare = async (artwork: Artwork) => {
    try {
      // Call share API for analytics
      await galleryApi.shareArtwork(artwork.id);
      
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: `Check out this ${artwork.type} created by ${artwork.model_name || 'AI'}`,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${artwork.title} - ${window.location.href}`);
        // Could show toast notification here
      }
    } catch (err) {
      console.error('Error sharing artwork:', err);
      
      // Handle offline sharing gracefully
      if (isNetworkError(err)) {
        // Skip API call but still try local sharing
        try {
          if (navigator.share) {
            await navigator.share({
              title: artwork.title,
              text: `Check out this ${artwork.type} created by ${artwork.model_name || 'AI'}`,
              url: window.location.href
            });
          } else {
            await navigator.clipboard.writeText(`${artwork.title} - ${window.location.href}`);
          }
        } catch (localErr) {
          console.error('Local sharing failed:', localErr);
        }
        return;
      }
      
      // Still try clipboard as fallback for other errors
      try {
        await navigator.clipboard.writeText(`${artwork.title} - ${window.location.href}`);
      } catch (clipboardErr) {
        console.error('Clipboard fallback failed:', clipboardErr);
      }
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'poem': return '📝';
      case 'painting': return '🎨';
      case 'story': return '📚';
      case 'music': return '🎵';
      default: return '✨';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'poem': return 'text-slate-700 dark:text-slate-500';
      case 'painting': return 'text-amber-700 dark:text-amber-500';
      case 'story': return 'text-green-600 dark:text-green-400';
      case 'music': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white 
                    dark:from-black dark:via-gray-900 dark:to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-700 to-amber-700 
                         bg-clip-text text-transparent">
            🎨 Community Gallery
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Discover amazing artworks created by AI models from our community
          </p>
          
          {/* Filter Tabs */}
          <div className="flex justify-center mb-8">
            <IOSSegmentedControl
              segments={filterOptions}
              selectedIndex={selectedIndex}
              onChange={handleFilterChange}
              style="filled"
            />
          </div>
        </motion.div>

        {/* Offline Banner */}
        {isOffline && (
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
              <p className="text-orange-800 dark:text-orange-200 font-medium">
                📡 You're currently offline. Showing cached content.
              </p>
              <button 
                onClick={() => fetchArtworks(filter)}
                className="mt-2 text-orange-600 dark:text-orange-400 underline hover:no-underline text-sm"
              >
                Try to reconnect
              </button>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && !isOffline && (
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">
                ❌ Error loading artworks: {error}
              </p>
              <button 
                onClick={() => fetchArtworks(filter)}
                className="mt-2 text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-slate-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading amazing artworks...</p>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && !isOffline && filteredArtworks.length === 0 && (
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">No artworks found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'No artworks have been created yet. Create an evaluation task to generate some!'
                : `No ${filter} artworks found. Try a different filter or create some ${filter} tasks!`}
            </p>
          </motion.div>
        )}

        {/* Offline Empty State */}
        {!loading && error && isOffline && filteredArtworks.length === 0 && (
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Offline Mode</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No cached artworks available. Connect to the internet to load content.
            </p>
            <IOSButton 
              variant="primary" 
              className="mt-4"
              onClick={() => fetchArtworks(filter)}
            >
              🔄 Try to Connect
            </IOSButton>
          </motion.div>
        )}

        {/* Gallery Grid */}
        {!loading && filteredArtworks.length > 0 && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
          {filteredArtworks.map((artwork, index) => (
            <motion.div
              key={artwork.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <IOSCard
                variant="elevated"
                interactive
                animate
                className="h-full overflow-hidden group"
              >
                {/* Artwork Content */}
                {artwork.type === 'painting' && artwork.image_url && (
                  <div className="relative overflow-hidden">
                    <img 
                      src={artwork.image_url} 
                      alt={artwork.title}
                      className="w-full h-48 object-cover transition-transform duration-300 
                               group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 right-2">
                      <span className={`text-2xl ${getTypeColor(artwork.type)}`}>
                        {getTypeEmoji(artwork.type)}
                      </span>
                    </div>
                  </div>
                )}
                
                {artwork.type !== 'painting' && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 
                                dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-2xl ${getTypeColor(artwork.type)}`}>
                        {getTypeEmoji(artwork.type)}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full 
                                     bg-white dark:bg-gray-600 ${getTypeColor(artwork.type)}`}>
                        {artwork.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {artwork.content}
                    </div>
                  </div>
                )}

                <IOSCardContent className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {artwork.title}
                  </h3>

                  {/* Model Info */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-blue-200 
                                   px-2 py-1 rounded-full text-xs font-medium">
                      {artwork.model_name}
                    </span>
                    <span>•</span>
                    <span>{artwork.created_at}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{artwork.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{artwork.views}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <IOSButton
                      variant={likedItems.has(artwork.id) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleLike(artwork.id)}
                      className="flex items-center gap-2"
                    >
                      <Heart className={`w-4 h-4 ${likedItems.has(artwork.id) ? 'fill-current' : ''}`} />
                      Like
                    </IOSButton>

                    <div className="flex items-center gap-2">
                      <IOSButton
                        variant="text"
                        size="sm"
                        onClick={() => handleShare(artwork)}
                      >
                        <Share2 className="w-4 h-4" />
                      </IOSButton>
                      <IOSButton variant="text" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </IOSButton>
                    </div>
                  </div>
                </IOSCardContent>
              </IOSCard>
            </motion.div>
          ))}
        </motion.div>
        )}

        {/* Load More */}
        {!loading && filteredArtworks.length > 0 && !isOffline && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <IOSButton variant="secondary" size="lg">
              Load More Artworks
            </IOSButton>
          </motion.div>
        )}

        {/* Offline Load More */}
        {!loading && filteredArtworks.length > 0 && isOffline && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              📱 Offline mode - Showing cached content
            </div>
            <IOSButton 
              variant="glass" 
              size="md" 
              className="mt-2"
              onClick={() => fetchArtworks(filter)}
            >
              🔄 Check for Updates
            </IOSButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}