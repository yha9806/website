import { describe, it, expect } from 'vitest'
import { coreEmojis, getEmoji, type CoreEmojiCategory } from '../../components/ios/utils/emojiMap'

describe('coreEmojis', () => {
  it('should have all expected top-level categories', () => {
    const expectedCategories = [
      'status', 'evaluationType', 'rank', 'trend',
      'feedback', 'navigation', 'actions', 'rating', 'content',
    ]
    expectedCategories.forEach((cat) => {
      expect(coreEmojis).toHaveProperty(cat)
    })
  })

  it('should have status emojis', () => {
    expect(coreEmojis.status.pending).toBe('⏱️')
    expect(coreEmojis.status.processing).toBe('⚙️')
    expect(coreEmojis.status.completed).toBe('✅')
    expect(coreEmojis.status.failed).toBe('❌')
    expect(coreEmojis.status.warning).toBe('⚠️')
  })

  it('should have evaluation type emojis', () => {
    expect(coreEmojis.evaluationType.poem).toBe('📝')
    expect(coreEmojis.evaluationType.painting).toBe('🎨')
    expect(coreEmojis.evaluationType.story).toBe('📖')
    expect(coreEmojis.evaluationType.music).toBe('🎵')
    expect(coreEmojis.evaluationType.general).toBe('✨')
  })

  it('should have rank emojis', () => {
    expect(coreEmojis.rank[1]).toBe('🥇')
    expect(coreEmojis.rank[2]).toBe('🥈')
    expect(coreEmojis.rank[3]).toBe('🥉')
    expect(coreEmojis.rank.top10).toBe('🏆')
    expect(coreEmojis.rank.rising).toBe('🚀')
    expect(coreEmojis.rank.new).toBe('🆕')
  })

  it('should have trend emojis', () => {
    expect(coreEmojis.trend.up).toBe('📈')
    expect(coreEmojis.trend.down).toBe('📉')
    expect(coreEmojis.trend.stable).toBe('➖')
    expect(coreEmojis.trend.hot).toBe('🔥')
  })

  it('should have feedback emojis', () => {
    expect(coreEmojis.feedback.success).toBe('😊')
    expect(coreEmojis.feedback.error).toBe('😔')
    expect(coreEmojis.feedback.info).toBe('ℹ️')
    expect(coreEmojis.feedback.celebration).toBe('🎉')
  })

  it('should have navigation emojis', () => {
    expect(coreEmojis.navigation.home).toBe('🏠')
    expect(coreEmojis.navigation.leaderboard).toBe('📊')
    expect(coreEmojis.navigation.battle).toBe('⚔️')
    expect(coreEmojis.navigation.evaluation).toBe('📋')
    expect(coreEmojis.navigation.settings).toBe('⚙️')
  })

  it('should have actions emojis', () => {
    expect(coreEmojis.actions.like).toBe('👍')
    expect(coreEmojis.actions.share).toBe('🔗')
    expect(coreEmojis.actions.edit).toBe('✏️')
    expect(coreEmojis.actions.refresh).toBe('🔄')
    expect(coreEmojis.actions.filter).toBe('🔍')
    expect(coreEmojis.actions.check).toBe('✅')
    expect(coreEmojis.actions.close).toBe('❌')
    expect(coreEmojis.actions.back).toBe('◀️')
    expect(coreEmojis.actions.warning).toBe('⚠️')
    expect(coreEmojis.actions.battle).toBe('⚔️')
  })

  it('should have rating emojis', () => {
    expect(coreEmojis.rating.star).toBe('⭐')
    expect(coreEmojis.rating.fire).toBe('🔥')
    expect(coreEmojis.rating.gem).toBe('💎')
    expect(coreEmojis.rating.trophy).toBe('🏆')
    expect(coreEmojis.rating.highlight).toBe('✨')
  })

  it('should have content emojis', () => {
    expect(coreEmojis.content.organization).toBe('🏢')
    expect(coreEmojis.content.tag).toBe('🏷️')
    expect(coreEmojis.content.text).toBe('📝')
    expect(coreEmojis.content.visual).toBe('🎨')
    expect(coreEmojis.content.frame).toBe('🖼️')
    expect(coreEmojis.content.video).toBe('🎬')
    expect(coreEmojis.content.gallery).toBe('🎭')
    expect(coreEmojis.content.exhibition).toBe('🏛️')
  })

  it('should only contain string values in all categories', () => {
    for (const category of Object.values(coreEmojis)) {
      for (const value of Object.values(category)) {
        expect(typeof value).toBe('string')
        expect((value as string).length).toBeGreaterThan(0)
      }
    }
  })
})

describe('getEmoji', () => {
  it('should return the correct emoji for a valid category and key', () => {
    expect(getEmoji('status', 'completed')).toBe('✅')
    expect(getEmoji('rank', '1')).toBe('🥇')
    expect(getEmoji('evaluationType', 'painting')).toBe('🎨')
    expect(getEmoji('trend', 'hot')).toBe('🔥')
  })

  it('should return default fallback for unknown key', () => {
    expect(getEmoji('status', 'nonexistent')).toBe('✨')
  })

  it('should return custom fallback for unknown key when specified', () => {
    expect(getEmoji('status', 'nonexistent', '🔮')).toBe('🔮')
  })

  it('should return fallback for invalid category', () => {
    expect(getEmoji('invalidCategory' as CoreEmojiCategory, 'key')).toBe('✨')
  })

  it('should return custom fallback for invalid category', () => {
    expect(getEmoji('invalidCategory' as CoreEmojiCategory, 'key', '🎯')).toBe('🎯')
  })

  it('should return fallback for empty string key', () => {
    expect(getEmoji('status', '')).toBe('✨')
  })

  it('should handle numeric rank keys as strings', () => {
    expect(getEmoji('rank', '1')).toBe('🥇')
    expect(getEmoji('rank', '2')).toBe('🥈')
    expect(getEmoji('rank', '3')).toBe('🥉')
  })

  it('should handle all categories without throwing', () => {
    const categories: CoreEmojiCategory[] = [
      'status', 'evaluationType', 'rank', 'trend',
      'feedback', 'navigation', 'actions', 'rating', 'content',
    ]
    categories.forEach((cat) => {
      expect(() => getEmoji(cat, 'someKey')).not.toThrow()
    })
  })
})
