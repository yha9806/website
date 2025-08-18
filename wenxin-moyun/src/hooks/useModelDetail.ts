import { useState, useEffect } from 'react';
import type { Model, Artwork } from '../types/types';
import { modelsService } from '../services/models.service';
import { artworksService } from '../services/artworks.service';

export function useModelDetail(modelId: string | undefined) {
  const [model, setModel] = useState<Model | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelId) {
      setLoading(false);
      return;
    }

    const fetchModelDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch model details
        console.log('[useModelDetail] Fetching model:', modelId);
        const modelResponse = await modelsService.getModel(modelId);
        console.log('[useModelDetail] Model response:', modelResponse);
        setModel(modelResponse);
        
        // Fetch artworks for this model
        try {
          const artworksResponse = await artworksService.getArtworksByModel(modelId);
          console.log('[useModelDetail] Artworks response:', artworksResponse);
          setArtworks(artworksResponse.artworks || []);
        } catch (artworkErr) {
          console.warn('[useModelDetail] Failed to fetch artworks:', artworkErr);
          // Don't fail if artworks fetch fails
          setArtworks([]);
        }
      } catch (err: any) {
        console.error('[useModelDetail] Error fetching model detail:', err);
        console.error('[useModelDetail] Error response:', err.response);
        
        // Set proper error message instead of falling back to mock data
        const errorMessage = err.response?.data?.detail || 
                           err.message || 
                           'Failed to load model details';
        setError(errorMessage);
        
        // Don't hide the error by using mock data
        // This allows us to see what's actually going wrong
      } finally {
        setLoading(false);
      }
    };

    fetchModelDetail();
  }, [modelId]);

  return { model, artworks, loading, error };
}