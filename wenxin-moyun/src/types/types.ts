// ============= VULCA Unified Types =============

/**
 * VULCA 6D Score - Unified type for all 6-dimensional evaluations
 * This is the canonical 6D structure used by the VULCA framework
 */
export interface VULCAScore6D {
  creativity: number;   // 创造力 - Originality and imaginative expression
  technique: number;    // 技术 - Technical skill and execution quality
  emotion: number;      // 情感 - Emotional depth and resonance
  context: number;      // 情境 - Cultural and historical awareness
  innovation: number;   // 创新 - Novel approaches and breakthrough thinking
  impact: number;       // 影响力 - Lasting influence and transformative power
}

/**
 * VULCA 47D Score - Full dimensional evaluation
 */
export type VULCAScore47D = Record<string, number>;

/**
 * Cultural Perspective Scores
 */
export type VULCACulturalScores = Record<string, number>;

// ============= Model Types =============

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
  scoreHighlights?: string[];
  scoreWeaknesses?: string[];
  benchmarkResponses?: unknown;
  benchmarkMetadata?: unknown;
  dataSource?: string;
  // VULCA integration fields (unified types)
  vulca_scores_6d?: VULCAScore6D;
  vulca_scores_47d?: VULCAScore47D;
  vulca_cultural_perspectives?: VULCACulturalScores;
  vulca_evaluation_date?: string;
  vulca_sync_status?: string;
}

/**
 * ModelMetrics - Legacy UI display metrics
 * @deprecated Use VULCAScore6D for evaluation data. This interface is kept for
 * backward compatibility with existing UI components (radar charts, etc.)
 *
 * Legacy to VULCA mapping:
 * - rhythm + composition → technique
 * - narrative + cultural → context
 * - emotion → emotion
 * - creativity → creativity
 * - (no mapping) → innovation, impact
 */
export interface ModelMetrics {
  rhythm: number;        // 格律韵律 → maps to technique
  composition: number;   // 构图色彩 → maps to technique
  narrative: number;     // 叙事逻辑 → maps to context
  emotion: number;       // 情感表达 → maps to emotion
  creativity: number;    // 创意新颖性 → maps to creativity
  cultural: number;      // 文化契合度 → maps to context
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
  score: number | null; // Allow null for image models
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
  parameters?: Record<string, unknown>;
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
