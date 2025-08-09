import { useState, useEffect } from 'react';
import type { Model, Artwork } from '../types/types';
import { modelsService } from '../services/models.service';
import { artworksService } from '../services/artworks.service';
import { mockModels } from '../data/mockData';

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
        const modelResponse = await modelsService.getModel(modelId);
        setModel(modelResponse);
        
        // Fetch artworks for this model
        const artworksResponse = await artworksService.getArtworksByModel(modelId);
        setArtworks(artworksResponse.artworks || []);
      } catch (err) {
        console.error('Error fetching model detail:', err);
        // Fallback to mock data
        const mockModel = mockModels.find(m => m.id === modelId);
        if (mockModel) {
          setModel(mockModel);
          setArtworks(mockModel.works || []);
        } else {
          setError('Failed to load model details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModelDetail();
  }, [modelId]);

  return { model, artworks, loading, error };
}