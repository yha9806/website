export interface Model {
  id: string;
  name: string;
  organization: string;
  version: string;
  releaseDate: string;
  description: string;
  category: 'text' | 'visual' | 'multimodal';
  overallScore: number | null;
  metrics: ModelMetrics;
  works: Artwork[];
  avatar?: string;
  tags: string[];
}

export interface ModelMetrics {
  rhythm: number;        // 格律韵律
  composition: number;   // 构图色彩
  narrative: number;     // 叙事逻辑
  emotion: number;       // 情感表达
  creativity: number;    // 创意新颖性
  cultural: number;      // 文化契合度
}

export interface Artwork {
  id: string;
  type: 'poem' | 'painting' | 'story' | 'music';
  title: string;
  content: string;
  imageUrl?: string;
  score: number;
  createdAt: string;
  prompt?: string;
}

export interface Battle {
  id: string;
  modelA: Model;
  modelB: Model;
  task: BattleTask;
  votesA: number;
  votesB: number;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface BattleTask {
  id: string;
  type: 'poem' | 'painting' | 'story';
  prompt: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type VoteChoice = 'model_a' | 'model_b';

export interface LeaderboardEntry {
  rank: number;
  model: Model;
  score: number;
  change: number; // Position change from last week
  battles: number;
  winRate: number;
}

export type LeaderboardCategory = 'overall' | 'text' | 'visual' | 'multimodal' | 'poetry' | 'painting' | 'narrative';

// Evaluation related types
export interface EvaluationTask {
  id: string;
  modelId: string;
  modelName?: string;
  taskType: 'poem' | 'story' | 'painting' | 'music';
  prompt: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: EvaluationResult;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  humanScore?: number;
  humanFeedback?: string;
}

export interface EvaluationResult {
  content?: string;
  imageUrl?: string;
  audioUrl?: string;
  score: number;
  metrics: {
    creativity: number;
    quality: number;
    relevance: number;
    cultural: number;
    technical?: number;
  };
  analysis?: string;
  processingTime?: number;
}