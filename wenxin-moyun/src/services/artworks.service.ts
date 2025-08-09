import api from './api';
import type { Artwork } from '../types/types';

export interface ArtworkResponse {
  id: string;
  model_id: string;
  type: 'poem' | 'painting' | 'story' | 'music';
  title: string;
  content?: string;
  image_url?: string;
  prompt?: string;
  score: number;
  extra_metadata?: Record<string, any>;
  created_at: string;
}

export interface ArtworksListResponse {
  artworks: ArtworkResponse[];
  total: number;
  page: number;
  page_size: number;
}

class ArtworksService {
  async getArtworks(
    modelId?: string,
    type?: 'poem' | 'painting' | 'story' | 'music',
    page = 1,
    pageSize = 20
  ): Promise<ArtworksListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    if (modelId) {
      params.append('model_id', modelId);
    }
    
    if (type) {
      params.append('type', type);
    }
    
    const response = await api.get<ArtworksListResponse>(`/artworks?${params}`);
    return response.data;
  }

  async getArtworkById(id: string): Promise<ArtworkResponse> {
    const response = await api.get<ArtworkResponse>(`/artworks/${id}`);
    return response.data;
  }

  async createArtwork(artworkData: {
    model_id: string;
    type: 'poem' | 'painting' | 'story' | 'music';
    title: string;
    content?: string;
    image_url?: string;
    prompt?: string;
    score?: number;
    extra_metadata?: Record<string, any>;
  }): Promise<ArtworkResponse> {
    const response = await api.post<ArtworkResponse>('/artworks', artworkData);
    return response.data;
  }

  async updateArtwork(
    id: string,
    artworkData: Partial<{
      title: string;
      content: string;
      image_url: string;
      prompt: string;
      score: number;
      extra_metadata: Record<string, any>;
    }>
  ): Promise<ArtworkResponse> {
    const response = await api.put<ArtworkResponse>(`/artworks/${id}`, artworkData);
    return response.data;
  }

  async deleteArtwork(id: string): Promise<void> {
    await api.delete(`/artworks/${id}`);
  }

  async getArtworksByModel(modelId: string): Promise<{ artworks: Artwork[] }> {
    const response = await this.getArtworks(modelId);
    return {
      artworks: response.artworks.map(a => this.convertToFrontendArtwork(a))
    };
  }

  // Convert API response to frontend Artwork type
  convertToFrontendArtwork(apiArtwork: ArtworkResponse): Artwork {
    return {
      id: apiArtwork.id,
      type: apiArtwork.type,
      title: apiArtwork.title,
      content: apiArtwork.content || '',
      imageUrl: apiArtwork.image_url,
      score: apiArtwork.score,
      createdAt: apiArtwork.created_at,
      prompt: apiArtwork.prompt
    };
  }
}

const artworksService = new ArtworksService();
export { artworksService };
export default artworksService;