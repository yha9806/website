import apiClient from './api';
import type { EvaluationTask } from '../types/types';

interface EvaluationTaskResponse {
  id: string;
  model_id: string;
  model_name?: string;
  model_organization?: string;
  task_type: string;
  prompt: string;
  parameters?: Record<string, any>;
  status: string;
  result?: {
    title?: string;
    content?: string;
    image_url?: string;
    audio_url?: string;
    score?: number;
    style?: string;
    word_count?: number;
    metrics?: Record<string, number>;
    analysis?: string;
    processing_time?: number;
  };
  created_at: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  user_id?: string;
  guest_id?: string;
  auto_score?: number;
  human_score?: number;
  final_score?: number;
  evaluation_metrics?: Record<string, number>;
  evaluation_notes?: string;
  error_message?: string;
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
  // Map backend status to frontend expected status
  const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
    'pending': 'pending',
    'running': 'processing', 
    'completed': 'completed',
    'failed': 'failed'
  };
  
  return {
    id: response.id,
    modelId: response.model_id,
    modelName: response.model_name,
    taskType: response.task_type as 'poem' | 'story' | 'painting' | 'music',
    prompt: response.prompt,
    parameters: response.parameters || {},
    status: statusMap[response.status] || 'pending',
    result: response.result ? {
      content: response.result.content,
      imageUrl: response.result.image_url,
      audioUrl: response.result.audio_url,
      score: response.result.score || response.auto_score || 0, // Use auto_score as fallback
      metrics: {
        creativity: (response.result.metrics?.creativity || response.evaluation_metrics?.creativity || 0),
        quality: (response.result.metrics?.quality || response.evaluation_metrics?.quality || 0),
        relevance: (response.result.metrics?.relevance || response.evaluation_metrics?.relevance || 0),
        cultural: (response.result.metrics?.cultural || response.evaluation_metrics?.cultural || 0),
        technical: (response.result.metrics?.technical || response.evaluation_metrics?.technical),
      },
      analysis: response.result.analysis || response.evaluation_notes,
      processingTime: response.result.processing_time
    } : undefined,
    createdAt: response.created_at,
    updatedAt: response.updated_at || response.created_at,
    userId: response.user_id,
    humanScore: response.human_score,
    humanFeedback: response.human_feedback || response.evaluation_notes
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
      const params: any = { skip: (page - 1) * pageSize, limit: pageSize };
      if (modelId) params.model_id = modelId;
      if (taskType) params.task_type = taskType;
      
      // Backend returns array directly, not wrapped object
      const response = await apiClient.get<EvaluationTaskResponse[]>('/evaluations/', { params });
      
      // Ensure response.data is an array
      const evaluationsArray = Array.isArray(response.data) ? response.data : [];
      
      return {
        evaluations: evaluationsArray.map(convertToEvaluationTask),
        total: evaluationsArray.length, // Note: actual total count not available from backend
        page: page,
        pageSize: pageSize
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