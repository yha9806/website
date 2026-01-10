import apiClient from './api';
import type { Model } from '../types/types';

export interface ModelMetrics {
  rhythm: number;
  composition: number;
  narrative: number;
  emotion: number;
  creativity: number;
  cultural: number;
}

export interface AIModelResponse {
  id: string;
  name: string;
  organization: string;
  version: string;
  category: string;
  description: string;
  overall_score: number | null;
  metrics: ModelMetrics;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  tags: string[];
  avatar_url?: string;
  // VULCA integration fields
  vulca_scores_47d?: any;
  vulca_cultural_perspectives?: any;
  vulca_evaluation_date?: string;
  vulca_sync_status?: string;
}

export interface AIModelWithStats extends AIModelResponse {
  total_evaluations: number;
  total_battles: number;
  win_rate: number;
  recent_works: any[];
  score_highlights?: string[];
  score_weaknesses?: string[];
  benchmark_responses?: any;
  benchmark_metadata?: any;
  data_source?: string;
}

export interface ModelListParams {
  skip?: number;
  limit?: number;
  category?: string;
  is_active?: boolean;
  include_vulca?: boolean;
}

class ModelsService {
  async getModels(params?: ModelListParams): Promise<AIModelResponse[]> {
    const response = await apiClient.get<AIModelResponse[]>('/models/', { params });
    return response.data;
  }

  async getModelById(id: string): Promise<AIModelWithStats> {
    const response = await apiClient.get<AIModelWithStats>(`/models/${id}`);
    return response.data;
  }

  async createModel(data: Partial<AIModelResponse>): Promise<AIModelResponse> {
    const response = await apiClient.post<AIModelResponse>('/models/', data);
    return response.data;
  }

  async updateModel(id: string, data: Partial<AIModelResponse>): Promise<AIModelResponse> {
    const response = await apiClient.put<AIModelResponse>(`/models/${id}`, data);
    return response.data;
  }

  async deleteModel(id: string): Promise<void> {
    await apiClient.delete(`/models/${id}`);
  }

  async getModel(id: string): Promise<Model> {
    const apiModel = await this.getModelById(id);
    return this.convertToFrontendModel(apiModel);
  }

  // Convert API response to frontend Model type
  convertToFrontendModel(apiModel: AIModelWithStats): Model {
    return {
      id: apiModel.id,
      name: apiModel.name,
      organization: apiModel.organization || '',
      version: apiModel.version || '',
      releaseDate: apiModel.created_at ? apiModel.created_at.substring(0, 10) : '',
      description: apiModel.description || '',
      category: apiModel.category as 'text' | 'multimodal',
      overallScore: apiModel.overall_score, // Keep as is, frontend handles null
      metrics: apiModel.metrics || {
        rhythm: 0,
        composition: 0,
        narrative: 0,
        emotion: 0,
        creativity: 0,
        cultural: 0
      },
      works: [],
      avatar: apiModel.avatar_url || `https://picsum.photos/seed/${apiModel.id}/200/200`,
      tags: apiModel.tags || [],
      scoreHighlights: apiModel.score_highlights,
      scoreWeaknesses: apiModel.score_weaknesses,
      benchmarkResponses: apiModel.benchmark_responses,
      benchmarkMetadata: apiModel.benchmark_metadata,
      dataSource: apiModel.data_source,
      // VULCA integration fields
      vulca_scores_47d: apiModel.vulca_scores_47d,
      vulca_cultural_perspectives: apiModel.vulca_cultural_perspectives,
      vulca_evaluation_date: apiModel.vulca_evaluation_date,
      vulca_sync_status: apiModel.vulca_sync_status
    };
  }
}

const modelsService = new ModelsService();
export { modelsService };
export default modelsService;