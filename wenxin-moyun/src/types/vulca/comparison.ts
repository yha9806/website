/**
 * VULCA Comparison Types
 * Separate file to resolve export issues
 */

// Define VULCAEvaluation inline to avoid circular dependency
interface VULCAEvaluationForComparison {
  modelId: number;
  modelName: string;
  scores6D: {
    creativity: number;
    technique: number;
    emotion: number;
    context: number;
    innovation: number;
    impact: number;
  };
  scores47D: {
    [key: string]: number;
  };
  culturalPerspectives: {
    western: number;
    eastern: number;
    african: number;
    latin_american: number;
    middle_eastern: number;
    south_asian: number;
    oceanic: number;
    indigenous: number;
  };
  evaluationDate: string;
  metadata?: {
    algorithmVersion: string;
    expansionMethod: string;
    culturalPerspectivesCount: number;
  };
}

export interface VULCAComparison {
  models: VULCAEvaluationForComparison[];
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