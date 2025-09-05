/**
 * VULCA Type Definitions
 * TypeScript interfaces for VULCA evaluation system
 * Consolidated export to avoid circular dependencies
 */

// Basic Score Types
export interface VULCAScore6D {
  creativity: number;
  technique: number;
  emotion: number;
  context: number;
  innovation: number;
  impact: number;
}

export interface VULCAScore47D {
  [key: string]: number; // dim_0 to dim_46 or named dimensions
}

export interface CulturalPerspective {
  western: number;
  eastern: number;
  african: number;
  latin_american: number;
  middle_eastern: number;
  south_asian: number;
  oceanic: number;
  indigenous: number;
}

// Main Evaluation Type
export interface VULCAEvaluation {
  modelId: number;
  modelName: string;
  scores6D: VULCAScore6D;
  scores47D: VULCAScore47D;
  culturalPerspectives: CulturalPerspective;
  evaluationDate: string;
  metadata?: {
    algorithmVersion: string;
    expansionMethod: string;
    culturalPerspectivesCount: number;
  };
}

// Comparison Type
export interface VULCAComparison {
  models: VULCAEvaluation[];
  differenceMatrix: number[][];
  summary: {
    mostSimilar: {
      models: string[];
      difference: number;
    };
    mostDifferent: {
      models: string[];
      difference: number;
    };
    averageDifference: number;
    dimensionStatistics?: {
      meanByDimension: number[];
      stdByDimension: number[];
      maxByDimension: number[];
      minByDimension: number[];
    };
    culturalAnalysis?: {
      [perspective: string]: {
        mean: number;
        std: number;
        bestModel: string;
      };
    };
  };
  comparisonDate: string;
}

// Information Types
export interface VULCADimensionInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  weight: number;
}

export interface VULCACulturalPerspectiveInfo {
  id: string;
  name: string;
  description: string;
  weightRange: string;
}

// View Types
export type ViewMode = '6d' | '47d';
export type VisualizationType = 'radar' | 'heatmap' | 'bar' | 'parallel';

// API Response Type
export interface VULCAApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

// Export all types from here to ensure single source of truth
export type {
  VULCAScore6D as Score6D,
  VULCAScore47D as Score47D,
  CulturalPerspective as Cultural,
  VULCAEvaluation as Evaluation,
  VULCAComparison as Comparison,
  VULCADimensionInfo as DimensionInfo,
  VULCACulturalPerspectiveInfo as CulturalInfo,
};