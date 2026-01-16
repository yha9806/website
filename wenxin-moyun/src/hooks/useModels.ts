import { useState, useEffect } from 'react';
import modelsService from '../services/models.service';
import type { Model } from '../types/types';

export const useModels = (category?: string) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        try {
          const apiModels = await modelsService.getModels({ 
            category, 
            is_active: true 
          });
          
          if (apiModels.length > 0) {
            const frontendModels = apiModels.map(model =>
              modelsService.convertToFrontendModel(model)
            );
            setModels(frontendModels);
          } else {
            // Fallback to mock data if API returns empty
            const { mockModels } = await import('../data/mockData');
            const filtered = category 
              ? mockModels.filter(m => m.category === category)
              : mockModels;
            setModels(filtered);
          }
        } catch (apiError) {
          // Fallback to mock data if API fails
          console.log('API unavailable, using mock data');
          const { mockModels } = await import('../data/mockData');
          const filtered = category 
            ? mockModels.filter(m => m.category === category)
            : mockModels;
          setModels(filtered);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [category]);

  return { models, loading, error };
};

export const useModelById = (id: string) => {
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try API first
        try {
          const apiModel = await modelsService.getModelById(id);
          setModel(modelsService.convertToFrontendModel(apiModel));
        } catch (apiError) {
          // Fallback to mock data
          console.log('API unavailable, using mock data');
          const { mockModels } = await import('../data/mockData');
          const foundModel = mockModels.find(m => m.id === id);
          setModel(foundModel || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchModel();
    }
  }, [id]);

  return { model, loading, error };
};