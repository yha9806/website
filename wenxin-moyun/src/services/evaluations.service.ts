import apiClient from './api';
import type { EvaluationTask } from '../types/types';

interface EvaluationTaskResponse {
  id: string;
  model_id: string;
  model_name?: string;
  task_type: string;
  prompt: string;
  parameters?: Record<string, any>;
  status: string;
  result?: {
    content?: string;
    image_url?: string;
    audio_url?: string;
    score: number;
    metrics: {
      creativity: number;
      quality: number;
      relevance: number;
      cultural: number;
      technical?: number;
    };
    analysis?: string;
    processing_time?: number;
  };
  created_at: string;
  updated_at: string;
  user_id?: string;
  human_score?: number;
  human_feedback?: string;
}

interface EvaluationListResponse {
  evaluations: EvaluationTaskResponse[];
  total: number;
  page: number;
  page_size: number;
}

interface CreateEvaluationRequest {
  model_id: string;
  task_type: 'poem' | 'story' | 'painting' | 'music';
  prompt: string;
  parameters?: Record<string, any>;
}

interface UpdateEvaluationRequest {
  human_score?: number;
  human_feedback?: string;
}

function convertToEvaluationTask(response: EvaluationTaskResponse): EvaluationTask {
  return {
    id: response.id,
    modelId: response.model_id,
    modelName: response.model_name,
    taskType: response.task_type as 'poem' | 'story' | 'painting' | 'music',
    prompt: response.prompt,
    parameters: response.parameters,
    status: response.status as 'pending' | 'processing' | 'completed' | 'failed',
    result: response.result ? {
      content: response.result.content,
      imageUrl: response.result.image_url,
      audioUrl: response.result.audio_url,
      score: response.result.score,
      metrics: response.result.metrics,
      analysis: response.result.analysis,
      processingTime: response.result.processing_time
    } : undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    userId: response.user_id,
    humanScore: response.human_score,
    humanFeedback: response.human_feedback
  };
}

class EvaluationsService {
  async getEvaluations(page = 1, pageSize = 10, modelId?: string, taskType?: string): Promise<{
    evaluations: EvaluationTask[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const params: any = { page, page_size: pageSize };
      if (modelId) params.model_id = modelId;
      if (taskType) params.task_type = taskType;
      
      const response = await apiClient.get<EvaluationListResponse>('/evaluations/', { params });
      
      return {
        evaluations: response.data.evaluations.map(convertToEvaluationTask),
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.page_size
      };
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
      // Fallback to mock data
      const mockEvaluations: EvaluationTask[] = [
        {
          id: '1',
          modelId: 'qwen2-72b',
          modelName: 'Qwen2-72B',
          taskType: 'poem',
          prompt: '写一首关于春天的诗',
          status: 'completed',
          result: {
            content: '春风又绿江南岸，明月何时照我还',
            score: 92,
            metrics: {
              creativity: 90,
              quality: 95,
              relevance: 93,
              cultural: 91
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return {
        evaluations: mockEvaluations,
        total: mockEvaluations.length,
        page: 1,
        pageSize: 10
      };
    }
  }

  async getEvaluation(id: string): Promise<EvaluationTask> {
    try {
      const response = await apiClient.get<EvaluationTaskResponse>(`/evaluations/${id}/`);
      return convertToEvaluationTask(response.data);
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
      throw error;
    }
  }

  async createEvaluation(data: {
    modelId: string;
    taskType: 'poem' | 'story' | 'painting' | 'music';
    prompt: string;
    parameters?: Record<string, any>;
  }): Promise<EvaluationTask> {
    try {
      const request: CreateEvaluationRequest = {
        model_id: data.modelId,
        task_type: data.taskType,
        prompt: data.prompt,
        parameters: data.parameters
      };
      
      const response = await apiClient.post<EvaluationTaskResponse>('/evaluations/', request);
      return convertToEvaluationTask(response.data);
    } catch (error) {
      console.error('Failed to create evaluation:', error);
      throw error;
    }
  }

  async updateEvaluation(id: string, data: {
    humanScore?: number;
    humanFeedback?: string;
  }): Promise<EvaluationTask> {
    try {
      const request: UpdateEvaluationRequest = {
        human_score: data.humanScore,
        human_feedback: data.humanFeedback
      };
      
      const response = await apiClient.put<EvaluationTaskResponse>(`/evaluations/${id}/`, request);
      return convertToEvaluationTask(response.data);
    } catch (error) {
      console.error('Failed to update evaluation:', error);
      throw error;
    }
  }

  async deleteEvaluation(id: string): Promise<void> {
    try {
      await apiClient.delete(`/evaluations/${id}/`);
    } catch (error) {
      console.error('Failed to delete evaluation:', error);
      throw error;
    }
  }
}

export const evaluationsService = new EvaluationsService();