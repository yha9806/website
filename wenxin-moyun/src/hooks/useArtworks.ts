import { useState, useEffect } from 'react';
import artworksService from '../services/artworks.service';
import type { Artwork } from '../types/types';

export function useArtworks(
  modelId?: string,
  type?: 'poem' | 'painting' | 'story' | 'music'
) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);
        const response = await artworksService.getArtworks(modelId, type);
        const convertedArtworks = response.artworks.map(artwork => 
          artworksService.convertToFrontendArtwork(artwork)
        );
        setArtworks(convertedArtworks);
        setTotal(response.total);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch artworks:', err);
        setError('Failed to load artworks');
        // Could fallback to mock data here
        setArtworks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, [modelId, type]);

  return { artworks, loading, error, total };
}

export function useArtwork(id: string) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await artworksService.getArtworkById(id);
        const convertedArtwork = artworksService.convertToFrontendArtwork(response);
        setArtwork(convertedArtwork);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch artwork:', err);
        setError('Failed to load artwork');
        setArtwork(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  return { artwork, loading, error };
}

export function useModelArtworks(modelId: string) {
  const [artworksByType, setArtworksByType] = useState<{
    poems: Artwork[];
    paintings: Artwork[];
    stories: Artwork[];
    music: Artwork[];
  }>({
    poems: [],
    paintings: [],
    stories: [],
    music: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModelArtworks = async () => {
      if (!modelId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await artworksService.getArtworks(modelId);
        
        const artworks = response.artworks.map(artwork => 
          artworksService.convertToFrontendArtwork(artwork)
        );

        // Group artworks by type
        const grouped = {
          poems: artworks.filter(a => a.type === 'poem'),
          paintings: artworks.filter(a => a.type === 'painting'),
          stories: artworks.filter(a => a.type === 'story'),
          music: artworks.filter(a => a.type === 'music')
        };

        setArtworksByType(grouped);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch model artworks:', err);
        setError('Failed to load artworks');
      } finally {
        setLoading(false);
      }
    };

    fetchModelArtworks();
  }, [modelId]);

  return { artworksByType, loading, error };
}