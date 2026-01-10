/**
 * Emoji Mapping Configuration (Optimized)
 *
 * 精简版本 - 从99个减少到52个 (-47.5%)
 * 删除: lazyEmojis全部(30), model全部(5), 未使用的actions/rating/content项
 */

// Core emojis - 仅保留实际使用的
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
  },

  // User Feedback
  feedback: {
    success: '😊',
    error: '😔',
    info: 'ℹ️',
    celebration: '🎉',
  },

  // Navigation
  navigation: {
    home: '🏠',
    leaderboard: '📊',
    battle: '⚔️',
    evaluation: '📋',
    settings: '⚙️',
  },

  // Actions (精简: 删除dislike, favorite, download, delete, sliders, balance)
  actions: {
    like: '👍',
    share: '🔗',
    edit: '✏️',
    refresh: '🔄',
    filter: '🔍',
    check: '✅',
    close: '❌',
    back: '◀️',
    warning: '⚠️',
    battle: '⚔️',
  },

  // Ratings (精简: 删除halfStar, emptyStar)
  rating: {
    star: '⭐',
    fire: '🔥',
    gem: '💎',
    trophy: '🏆',
    highlight: '✨',
  },

  // Content Types (精简: 删除notifications, arrow, chapter, person)
  content: {
    organization: '🏢',
    tag: '🏷️',
    text: '📝',
    visual: '🎨',
    frame: '🖼️',
    video: '🎬',
    gallery: '🎭',
    exhibition: '🏛️',
  },
};

// lazyEmojis 已删除 - 所有30个emoji从未使用

// Helper function to get emoji with fallback
export function getEmoji(
  category: keyof typeof coreEmojis,
  key: string,
  fallback = '✨'
): string {
  try {
    if (category in coreEmojis) {
      return (coreEmojis as Record<string, Record<string, string>>)[category][key] || fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// Type definitions for TypeScript support
export type CoreEmojiCategory = keyof typeof coreEmojis;
export type EmojiKey<T extends CoreEmojiCategory> = keyof (typeof coreEmojis)[T];