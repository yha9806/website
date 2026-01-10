export const vulcaTestData = {
  // Sample VULCA 6D scores for testing
  sample6DScores: {
    creativity: 85.5,
    technique: 78.3,
    emotion: 92.1,
    context: 88.7,
    innovation: 81.9,
    impact: 90.2
  },

  // Sample 47D expanded scores
  sample47DScores: {
    // Creativity dimensions
    originality: 88.2,
    imagination: 84.7,
    artistic_vision: 86.3,
    creative_expression: 82.9,
    conceptual_depth: 85.1,
    creative_innovation: 87.5,
    aesthetic_creativity: 83.8,
    
    // Technique dimensions
    technical_precision: 79.4,
    skill_mastery: 77.8,
    execution_quality: 78.9,
    craftsmanship: 80.2,
    technical_complexity: 76.5,
    methodological_rigor: 78.1,
    technical_innovation: 79.6,
    
    // Emotion dimensions
    emotional_depth: 93.2,
    emotional_resonance: 91.5,
    empathy: 92.8,
    emotional_authenticity: 90.7,
    mood_atmosphere: 91.9,
    emotional_impact: 92.4,
    psychological_insight: 91.3,
    
    // Context dimensions
    cultural_relevance: 89.3,
    historical_awareness: 87.9,
    social_commentary: 88.1,
    contextual_appropriateness: 89.5,
    narrative_coherence: 88.2,
    thematic_consistency: 87.8,
    symbolic_meaning: 88.9,
    
    // Innovation dimensions
    novelty: 82.7,
    experimental_approach: 80.9,
    breakthrough_potential: 81.3,
    paradigm_shift: 80.5,
    technological_advancement: 82.8,
    creative_risk_taking: 83.1,
    future_orientation: 81.4,
    
    // Impact dimensions
    audience_engagement: 91.1,
    lasting_impression: 89.8,
    influence_potential: 90.5,
    transformative_power: 89.7,
    social_impact: 90.9,
    cultural_significance: 91.3,
    inspirational_value: 90.1,
    
    // Additional dimensions
    authenticity: 86.4,
    complexity: 84.2,
    harmony: 87.6,
    universality: 85.9,
    transcendence: 83.7
  },

  // Test models data
  testModels: [
    {
      id: 'gpt-5',
      name: 'GPT-5',
      organization: 'OpenAI',
      overallScore: 88.5,
      vulcaScore: 87.3
    },
    {
      id: 'claude-opus-4-1',
      name: 'Claude Opus 4.1',
      organization: 'Anthropic',
      overallScore: 87.9,
      vulcaScore: 86.8
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
      organization: 'DeepSeek',
      overallScore: 86.2,
      vulcaScore: 85.4
    }
  ],

  // Cultural perspectives
  culturalPerspectives: [
    { id: 'western', name: 'Western', weight: 1.0 },
    { id: 'eastern', name: 'Eastern', weight: 0.95 },
    { id: 'latin', name: 'Latin American', weight: 0.92 },
    { id: 'african', name: 'African', weight: 0.90 },
    { id: 'middle_eastern', name: 'Middle Eastern', weight: 0.93 },
    { id: 'nordic', name: 'Nordic', weight: 0.94 },
    { id: 'indigenous', name: 'Indigenous', weight: 0.88 },
    { id: 'global', name: 'Global Average', weight: 1.0 }
  ],

  // Visualization types
  visualizationTypes: [
    { id: 'radar', name: 'Radar Chart', icon: '📊' },
    { id: 'heatmap', name: 'Heatmap', icon: '🔥' },
    { id: 'bar', name: 'Bar Chart', icon: '📈' },
    { id: 'parallel', name: 'Parallel Coordinates', icon: '🌐' }
  ],

  // Expected API responses
  mockApiResponses: {
    info: {
      status: 'operational',
      version: '1.0.0',
      dimensions: {
        '6D': ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact'],
        '47D': 47
      },
      culturalPerspectives: 8,
      models: 42
    },
    
    evaluate: {
      model_id: 'gpt-5',
      timestamp: new Date().toISOString(),
      scores_6d: {
        creativity: 85.5,
        technique: 78.3,
        emotion: 92.1,
        context: 88.7,
        innovation: 81.9,
        impact: 90.2
      },
      overall_score: 86.1
    },
    
    compare: {
      models: ['gpt-5', 'claude-opus-4-1'],
      comparison: {
        creativity: { gpt5: 85.5, claude: 84.2, difference: 1.3 },
        technique: { gpt5: 78.3, claude: 79.1, difference: -0.8 },
        emotion: { gpt5: 92.1, claude: 91.5, difference: 0.6 },
        context: { gpt5: 88.7, claude: 89.2, difference: -0.5 },
        innovation: { gpt5: 81.9, claude: 80.7, difference: 1.2 },
        impact: { gpt5: 90.2, claude: 89.8, difference: 0.4 }
      },
      winner: 'gpt-5',
      margin: 0.8
    }
  },

  // Test timeouts and thresholds
  testConfig: {
    pageLoadTimeout: 2000, // ms
    animationTimeout: 500, // ms
    apiTimeout: 1000, // ms
    minFPS: 30,
    maxLoadTime: 2000, // ms
    retryAttempts: 3
  },

  // Error scenarios
  errorScenarios: [
    {
      name: 'API_ERROR',
      status: 500,
      message: 'Internal Server Error'
    },
    {
      name: 'NETWORK_TIMEOUT',
      delay: 5000,
      message: 'Request timeout'
    },
    {
      name: 'INVALID_DATA',
      status: 400,
      message: 'Invalid request data'
    },
    {
      name: 'NOT_FOUND',
      status: 404,
      message: 'Resource not found'
    }
  ],

  // Viewport configurations for responsive testing
  viewports: {
    desktop: { width: 1920, height: 1080, name: 'Desktop HD' },
    laptop: { width: 1366, height: 768, name: 'Laptop' },
    tablet: { width: 768, height: 1024, name: 'iPad' },
    mobile: { width: 375, height: 667, name: 'iPhone' }
  },

  // Expected UI elements selectors
  selectors: {
    pageTitle: 'h1:has-text("VULCA")',
    vulcaContainer: '.vulca-container',
    dimensionToggle: 'button:has-text("47D"), button:has-text("6D")',
    chartSurface: '.recharts-surface',
    radarChart: '.recharts-radar',
    barChart: '.recharts-bar',
    heatmap: '.heatmap-container',
    parallelCoords: '.parallel-coordinates',
    modelSelector: 'select, [role="combobox"]',
    cultureSelector: 'button:has-text("Culture"), select:has-text("Perspective")',
    tooltip: '.recharts-tooltip-wrapper, [role="tooltip"]',
    errorMessage: 'text=/error|failed|problem/i',
    loadingSpinner: '.loading, .spinner',
    scoreDisplay: '[class*="score"], text=/\\d+\\.\\d+/'
  }
};

// Helper functions for test data generation
export function generateRandomScores(dimensions: number = 6): Record<string, number> {
  const scores: Record<string, number> = {};
  const dimensionNames = dimensions === 6 
    ? ['creativity', 'technique', 'emotion', 'context', 'innovation', 'impact']
    : Object.keys(vulcaTestData.sample47DScores);
  
  dimensionNames.slice(0, dimensions).forEach(dim => {
    scores[dim] = Math.random() * 40 + 60; // Random score between 60-100
  });
  
  return scores;
}

export function generateMockModel(index: number) {
  return {
    id: `model-${index}`,
    name: `Test Model ${index}`,
    organization: ['OpenAI', 'Anthropic', 'DeepSeek'][index % 3],
    overallScore: Math.random() * 20 + 70, // 70-90
    vulcaScore: Math.random() * 20 + 70
  };
}

export function calculateAverageScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function simulateApiDelay(ms: number = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}