import api from './api';
import type { Battle } from '../types/types';

export interface BattleResponse {
  id: string;
  model_a: any;
  model_b: any;
  task_type: 'poem' | 'painting' | 'story';
  task_prompt: string;
  task_category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  votes_a: number;
  votes_b: number;
  status: 'active' | 'completed';
  created_at: string;
  completed_at?: string;
}

export interface BattlesListResponse {
  battles: BattleResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface VoteRequest {
  vote_for: 'model_a' | 'model_b';
}

export interface VoteResponse {
  success: boolean;
  message: string;
  votes_a: number;
  votes_b: number;
}

class BattlesService {
  async getBattles(status?: 'active' | 'completed', page = 1, pageSize = 20): Promise<BattlesListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    const response = await api.get<BattlesListResponse>(`/battles?${params}`);
    return response.data;
  }

  async getBattleById(id: string): Promise<BattleResponse> {
    const response = await api.get<BattleResponse>(`/battles/${id}`);
    return response.data;
  }

  async getRandomBattle(): Promise<BattleResponse> {
    const response = await api.get<BattleResponse>('/battles/random');
    return response.data;
  }

  async voteForBattle(battleId: string, voteFor: 'model_a' | 'model_b'): Promise<VoteResponse> {
    const response = await api.post<VoteResponse>(`/battles/${battleId}/vote`, {
      vote_for: voteFor
    });
    return response.data;
  }

  async createBattle(battleData: {
    model_a_id: string;
    model_b_id: string;
    task_type: 'poem' | 'painting' | 'story';
    task_prompt: string;
    task_category: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<BattleResponse> {
    const response = await api.post<BattleResponse>('/battles', battleData);
    return response.data;
  }

  async completeBattle(battleId: string): Promise<BattleResponse> {
    const response = await api.patch<BattleResponse>(`/battles/${battleId}/complete`);
    return response.data;
  }
}

export default new BattlesService();