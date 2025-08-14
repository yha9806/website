/**
 * Emoji Mapping Configuration
 * Maps business logic to Fluent Emoji assets
 */

// Core emojis that should be bundled (high frequency)
export const coreEmojis = {
  // Evaluation Status
  status: {
    pending: '⏱️',
    processing: '⚙️',
    completed: '✅',
    failed: '❌',
    warning: '⚠️',
  },
  
  // Evaluation Types
  evaluationType: {
    poem: '📝',
    painting: '🎨',
    story: '📖',
    music: '🎵',
    general: '✨',
  },
  
  // Rankings
  rank: {
    1: '🥇',
    2: '🥈',
    3: '🥉',
    top10: '🏆',
    rising: '🚀',
    new: '🆕',
  },
  
  // Trends
  trend: {
    up: '📈',
    down: '📉',
    stable: '➖',
    hot: '🔥',
    cold: '❄️',
  },
  
  // User Feedback
  feedback: {
    success: '😊',
    error: '😔',
    info: 'ℹ️',
    question: '❓',
    celebration: '🎉',
  },
  
  // Navigation
  navigation: {
    home: '🏠',
    leaderboard: '📊',
    battle: '⚔️',
    compare: '⚖️',
    evaluation: '📋',
    analytics: '📈',
    info: 'ℹ️',
    settings: '⚙️',
    profile: '👤',
    search: '🔍',
    add: '➕',
    close: '❌',
  },
  
  // Actions
  actions: {
    like: '👍',
    dislike: '👎',
    favorite: '⭐',
    share: '🔗',
    download: '⬇️',
    upload: '⬆️',
    edit: '✏️',
    delete: '🗑️',
    refresh: '🔄',
    filter: '🔍',
    search: '🔍',
    close: '❌',
    check: '✅',
    'chevron-down': '⬇️',
    calendar: '📅',
    sliders: '🎛️',
    balance: '⚖️',
    back: '◀️',
    expand: '🔍',
  },
  
  // Ratings
  rating: {
    star: '⭐',
    halfStar: '⭐',
    emptyStar: '☆',
    fire: '🔥',
    gem: '💎',
    chart: '📊',
  },
  
  // AI Model
  model: {
    avatar: '🤖',
    processing: '🧠',
    creativity: '💡',
    algorithm: '🔬',
    neural: '🕸️',
  },
  
  // Content Types
  content: {
    organization: '🏢',
    category: '📁',
    tag: '🏷️',
    text: '📝',
    visual: '🎨',
    multimodal: '🔀',
    portfolio: '📂',
    compare: '🔄',
  },
};

// Lazy-loaded emojis (low frequency, special occasions)
export const lazyEmojis = {
  // Special Achievements
  achievements: {
    firstPlace: '🏅',
    milestone: '🎯',
    breakthrough: '💡',
    masterpiece: '🖼️',
    legendary: '👑',
    champion: '🏆',
  },
  
  // Emotions (for detailed feedback)
  emotions: {
    love: '❤️',
    excited: '🤩',
    happy: '😄',
    neutral: '😐',
    sad: '😢',
    angry: '😠',
    surprised: '😮',
    thinking: '🤔',
  },
  
  // Special Events
  events: {
    birthday: '🎂',
    anniversary: '🎊',
    holiday: '🎁',
    newYear: '🎆',
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
  },
  
  // Categories
  categories: {
    art: '🎨',
    literature: '📚',
    technology: '💻',
    nature: '🌿',
    culture: '🏛️',
    innovation: '🚀',
    tradition: '🏮',
    modern: '🏙️',
  },
};

// Helper function to get emoji with fallback
export function getEmoji(
  category: keyof typeof coreEmojis | keyof typeof lazyEmojis,
  key: string,
  fallback = '✨'
): string {
  try {
    if (category in coreEmojis) {
      return (coreEmojis as any)[category][key] || fallback;
    }
    if (category in lazyEmojis) {
      return (lazyEmojis as any)[category][key] || fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// Type definitions for TypeScript support
export type CoreEmojiCategory = keyof typeof coreEmojis;
export type LazyEmojiCategory = keyof typeof lazyEmojis;
export type EmojiKey<T extends CoreEmojiCategory | LazyEmojiCategory> = 
  T extends CoreEmojiCategory ? keyof typeof coreEmojis[T] :
  T extends LazyEmojiCategory ? keyof typeof lazyEmojis[T] : never;

// Export emoji SVG paths (will be populated from fluent-emoji-complete.html)
export const emojiSvgPaths: Record<string, string> = {};

// Function to lazy load emoji SVG
export async function loadEmojiSvg(emoji: string): Promise<string> {
  if (emojiSvgPaths[emoji]) {
    return emojiSvgPaths[emoji];
  }
  
  // TODO: Implement SVG loading when emoji assets are available
  // For now, return Unicode emoji directly to avoid build errors
  console.debug(`Using Unicode fallback for emoji: ${emoji}`);
  return emoji; // Fallback to Unicode emoji
}