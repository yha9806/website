import type { Model, Battle, LeaderboardEntry } from '../types/types';

export const mockModels: Model[] = [
  {
    id: 'qwen2-72b',
    name: 'Qwen2-72B',
    organization: 'Alibaba',
    version: '2.0',
    releaseDate: '2024-06',
    description: 'Qwen second-generation large model, excelling in Chinese literary creation',
    category: 'text',
    overallScore: 92.5,
    metrics: {
      rhythm: 95,
      composition: 88,
      narrative: 94,
      emotion: 91,
      creativity: 89,
      cultural: 96
    },
    works: [
      {
        id: 'w1',
        type: 'poem',
        title: 'Spring River Night',
        content: `Under the spring moon, the river flows with tides,
Shimmering waves carry moonbeams far and wide.
Through flowering meadows the water gently bends,
Where frost-like petals dance as daylight ends.`,
        score: 95,
        createdAt: '2024-01-15',
        prompt: 'Create a poem about spring river moonlight'
      }
    ],
    avatar: 'https://picsum.photos/seed/qwen/200/200',
    tags: ['Chinese Excellence', 'Literary Creation', 'Poetry Specialist']
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    organization: 'Anthropic',
    version: '3.0',
    releaseDate: '2024-03',
    description: 'Demonstrates exceptional ability in creative writing and artistic understanding',
    category: 'multimodal',
    overallScore: 90.8,
    metrics: {
      rhythm: 87,
      composition: 92,
      narrative: 95,
      emotion: 93,
      creativity: 94,
      cultural: 85
    },
    works: [
      {
        id: 'w2',
        type: 'story',
        title: 'The Time Bookstore',
        content: 'In a quiet corner of the city stands a mysterious bookstore. When midnight chimes, the books on the shelves turn their own pages, whispering forgotten tales...',
        score: 93,
        createdAt: '2024-01-20',
        prompt: 'Write the opening of a short story about a mysterious bookstore'
      }
    ],
    avatar: 'https://picsum.photos/seed/claude/200/200',
    tags: ['Creative Writing', 'Multimodal', 'Narrative Master']
  },
  {
    id: 'gpt4-vision',
    name: 'GPT-4 Vision',
    organization: 'OpenAI',
    version: '4.0',
    releaseDate: '2023-11',
    description: 'Benchmark model for multimodal understanding and generation capabilities',
    category: 'multimodal',
    overallScore: 89.2,
    metrics: {
      rhythm: 84,
      composition: 91,
      narrative: 92,
      emotion: 88,
      creativity: 91,
      cultural: 83
    },
    works: [],
    avatar: 'https://picsum.photos/seed/gpt4/200/200',
    tags: ['Multimodal', 'Visual Understanding', 'Creative Generation']
  },
  {
    id: 'ernie-4',
    name: 'ERNIE 4.0',
    organization: 'Baidu',
    version: '4.0',
    releaseDate: '2024-01',
    description: 'ERNIE 4th generation, deeply integrating Chinese cultural essence',
    category: 'text',
    overallScore: 88.5,
    metrics: {
      rhythm: 92,
      composition: 85,
      narrative: 89,
      emotion: 87,
      creativity: 86,
      cultural: 94
    },
    works: [],
    avatar: 'https://picsum.photos/seed/ernie/200/200',
    tags: ['Chinese Enhanced', 'Cultural Understanding', 'Poetry Creation']
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    organization: 'Google',
    version: '1.0',
    releaseDate: '2023-12',
    description: 'Google\'s latest multimodal model with balanced capabilities',
    category: 'multimodal',
    overallScore: 87.3,
    metrics: {
      rhythm: 83,
      composition: 88,
      narrative: 90,
      emotion: 86,
      creativity: 89,
      cultural: 82
    },
    works: [],
    avatar: 'https://picsum.photos/seed/gemini/200/200',
    tags: ['Multimodal', 'Balanced Development', 'Google Made']
  },
  {
    id: 'yi-34b',
    name: 'Yi-34B',
    organization: '01.AI',
    version: '1.0',
    releaseDate: '2024-01',
    description: 'Large-scale language model released by 01.AI',
    category: 'text',
    overallScore: 85.7,
    metrics: {
      rhythm: 86,
      composition: 82,
      narrative: 88,
      emotion: 85,
      creativity: 84,
      cultural: 89
    },
    works: [],
    avatar: 'https://picsum.photos/seed/yi/200/200',
    tags: ['Chinese Optimized', 'Open Source', 'Efficient Inference']
  },
  {
    id: 'chatglm3-6b',
    name: 'ChatGLM3-6B',
    organization: 'Zhipu AI',
    version: '3.0',
    releaseDate: '2023-10',
    description: 'Zhipu AI\'s lightweight conversational model, suitable for local deployment',
    category: 'text',
    overallScore: 82.4,
    metrics: {
      rhythm: 81,
      composition: 78,
      narrative: 85,
      emotion: 83,
      creativity: 80,
      cultural: 87
    },
    works: [],
    avatar: 'https://picsum.photos/seed/chatglm/200/200',
    tags: ['Lightweight', 'Local Deployment', 'Chinese Dialogue']
  },
  {
    id: 'llama3-70b',
    name: 'Llama 3 70B',
    organization: 'Meta',
    version: '3.0',
    releaseDate: '2024-04',
    description: 'Meta\'s latest open-source large model with strong performance',
    category: 'text',
    overallScore: 86.9,
    metrics: {
      rhythm: 82,
      composition: 85,
      narrative: 91,
      emotion: 87,
      creativity: 88,
      cultural: 78
    },
    works: [],
    avatar: 'https://picsum.photos/seed/llama/200/200',
    tags: ['Open Source Pioneer', 'Multilingual', 'Active Community']
  }
];

export const mockLeaderboard: LeaderboardEntry[] = mockModels
  .sort((a, b) => {
    // Handle null scores - null values go to end
    if (a.overallScore == null && b.overallScore == null) return 0;
    if (a.overallScore == null) return 1;
    if (b.overallScore == null) return -1;
    return b.overallScore - a.overallScore;
  })
  .map((model, index) => ({
    rank: index + 1,
    model,
    score: model.overallScore,
    change: Math.floor(Math.random() * 5) - 2,
    battles: Math.floor(Math.random() * 100) + 50,
    winRate: 45 + Math.random() * 30
  }));

export const mockBattles: Battle[] = [
  {
    id: 'battle1',
    modelA: mockModels[0],
    modelB: mockModels[1],
    task: {
      id: 'task1',
      type: 'poem',
      prompt: 'Create a seven-character regulated verse poem on the theme of "Autumn Moon"',
      category: 'Classical Poetry',
      difficulty: 'medium'
    },
    votesA: 156,
    votesB: 142,
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'battle2',
    modelA: mockModels[2],
    modelB: mockModels[3],
    task: {
      id: 'task2',
      type: 'painting',
      prompt: 'Create a work that combines Chinese landscape painting style with cyberpunk elements',
      category: 'Visual Arts',
      difficulty: 'hard'
    },
    votesA: 89,
    votesB: 102,
    status: 'active',
    createdAt: '2024-01-20T12:00:00Z'
  }
];

export const categories = [
  { id: 'overall', name: 'Overall Rankings', icon: '🏆' },
  { id: 'poetry', name: 'Poetry Creation', icon: '📜' },
  { id: 'painting', name: 'Visual Arts', icon: '🎨' },
  { id: 'narrative', name: 'Narrative Literature', icon: '📚' },
  { id: 'music', name: 'Music Creation', icon: '🎵' },
  { id: 'multimodal', name: 'Multimodal', icon: '🔄' }
];