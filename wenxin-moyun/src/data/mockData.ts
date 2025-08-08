import type { Model, Battle, LeaderboardEntry } from '../types/types';

export const mockModels: Model[] = [
  {
    id: 'qwen2-72b',
    name: 'Qwen2-72B',
    organization: 'Alibaba',
    version: '2.0',
    releaseDate: '2024-06',
    description: '通义千问第二代大模型，在中文文学创作领域表现卓越',
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
        title: '春江花月夜',
        content: `春江潮水连海平，海上明月共潮生。
滟滟随波千万里，何处春江无月明。
江流宛转绕芳甸，月照花林皆似霰。
空里流霜不觉飞，汀上白沙看不见。`,
        score: 95,
        createdAt: '2024-01-15',
        prompt: '创作一首描写春江月夜的古诗'
      }
    ],
    avatar: 'https://picsum.photos/seed/qwen/200/200',
    tags: ['中文优秀', '文学创作', '诗词专精']
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    organization: 'Anthropic',
    version: '3.0',
    releaseDate: '2024-03',
    description: '在创意写作和艺术理解方面展现出卓越能力',
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
        title: '时光书店',
        content: '在城市的角落，有一家神秘的书店。每当午夜钟声响起，书架上的书籍会自己翻动，诉说着被遗忘的故事...',
        score: 93,
        createdAt: '2024-01-20',
        prompt: '写一个关于神秘书店的短篇故事开头'
      }
    ],
    avatar: 'https://picsum.photos/seed/claude/200/200',
    tags: ['创意写作', '多模态', '叙事大师']
  },
  {
    id: 'gpt4-vision',
    name: 'GPT-4 Vision',
    organization: 'OpenAI',
    version: '4.0',
    releaseDate: '2023-11',
    description: '多模态理解与生成能力的标杆模型',
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
    tags: ['多模态', '视觉理解', '创意生成']
  },
  {
    id: 'ernie-4',
    name: 'ERNIE 4.0',
    organization: 'Baidu',
    version: '4.0',
    releaseDate: '2024-01',
    description: '文心一言第四代，深度融合中华文化精髓',
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
    tags: ['中文强化', '文化理解', '诗词创作']
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    organization: 'Google',
    version: '1.0',
    releaseDate: '2023-12',
    description: 'Google最新多模态模型，平衡各项能力',
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
    tags: ['多模态', '平衡发展', '谷歌出品']
  },
  {
    id: 'yi-34b',
    name: 'Yi-34B',
    organization: '01.AI',
    version: '1.0',
    releaseDate: '2024-01',
    description: '零一万物推出的大规模语言模型',
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
    tags: ['中文优化', '开源模型', '高效推理']
  },
  {
    id: 'chatglm3-6b',
    name: 'ChatGLM3-6B',
    organization: 'Zhipu AI',
    version: '3.0',
    releaseDate: '2023-10',
    description: '智谱AI的轻量级对话模型，适合本地部署',
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
    tags: ['轻量级', '本地部署', '中文对话']
  },
  {
    id: 'llama3-70b',
    name: 'Llama 3 70B',
    organization: 'Meta',
    version: '3.0',
    releaseDate: '2024-04',
    description: 'Meta最新开源大模型，性能强劲',
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
    tags: ['开源先锋', '多语言', '社区活跃']
  }
];

export const mockLeaderboard: LeaderboardEntry[] = mockModels
  .sort((a, b) => b.overallScore - a.overallScore)
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
      prompt: '以"秋月"为题，创作一首七言律诗',
      category: '古典诗词',
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
      prompt: '创作一幅融合中国山水画风格与赛博朋克元素的作品',
      category: '视觉艺术',
      difficulty: 'hard'
    },
    votesA: 89,
    votesB: 102,
    status: 'active',
    createdAt: '2024-01-20T12:00:00Z'
  }
];

export const categories = [
  { id: 'overall', name: '综合排名', icon: '🏆' },
  { id: 'poetry', name: '诗词创作', icon: '📜' },
  { id: 'painting', name: '绘画艺术', icon: '🎨' },
  { id: 'narrative', name: '叙事文学', icon: '📚' },
  { id: 'music', name: '音乐创作', icon: '🎵' },
  { id: 'multimodal', name: '跨模态', icon: '🔄' }
];