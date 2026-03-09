import { describe, it, expect } from 'vitest'
import {
  iosAnimations,
  iosStaggerDelays,
  getStaggerDelay,
  getStaggerContainer,
  staggerItem,
  hapticFeedback,
} from '../../components/ios/utils/animations'

describe('iosAnimations', () => {
  it('should export an object with all expected animation presets', () => {
    const expectedKeys = [
      'buttonTap', 'buttonHover',
      'spring', 'springBounce', 'springSmooth',
      'fadeIn', 'fadeInUp', 'fadeInScale',
      'slideInFromRight', 'slideInFromBottom',
      'iosModalPresent', 'iosSheetPresent',
      'pulse', 'shimmer',
    ]
    expectedKeys.forEach((key) => {
      expect(iosAnimations).toHaveProperty(key)
    })
  })

  describe('button animations', () => {
    it('buttonTap should scale down', () => {
      expect(iosAnimations.buttonTap.scale).toBe(0.96)
      expect(iosAnimations.buttonTap.transition).toBeDefined()
      expect(iosAnimations.buttonTap.transition.duration).toBe(0.1)
    })

    it('buttonHover should scale up', () => {
      expect(iosAnimations.buttonHover.scale).toBe(1.02)
      expect(iosAnimations.buttonHover.transition).toBeDefined()
      expect(iosAnimations.buttonHover.transition.duration).toBe(0.2)
    })
  })

  describe('spring animations', () => {
    it('spring should have correct stiffness and damping', () => {
      expect(iosAnimations.spring.type).toBe('spring')
      expect(iosAnimations.spring.stiffness).toBe(400)
      expect(iosAnimations.spring.damping).toBe(30)
    })

    it('springBounce should be bouncier than spring', () => {
      expect(iosAnimations.springBounce.type).toBe('spring')
      expect(iosAnimations.springBounce.stiffness).toBe(300)
      expect(iosAnimations.springBounce.damping).toBe(20)
      // Bouncier = lower damping
      expect(iosAnimations.springBounce.damping).toBeLessThan(iosAnimations.spring.damping)
    })

    it('springSmooth should be smoother than spring', () => {
      expect(iosAnimations.springSmooth.type).toBe('spring')
      expect(iosAnimations.springSmooth.stiffness).toBe(500)
      expect(iosAnimations.springSmooth.damping).toBe(40)
      // Smoother = higher damping
      expect(iosAnimations.springSmooth.damping).toBeGreaterThan(iosAnimations.spring.damping)
    })
  })

  describe('fade animations', () => {
    it('fadeIn should go from opacity 0 to 1', () => {
      expect(iosAnimations.fadeIn.initial).toEqual({ opacity: 0 })
      expect(iosAnimations.fadeIn.animate).toEqual({ opacity: 1 })
      expect(iosAnimations.fadeIn.exit).toEqual({ opacity: 0 })
    })

    it('fadeInUp should include y translation', () => {
      expect(iosAnimations.fadeInUp.initial).toEqual({ opacity: 0, y: 10 })
      expect(iosAnimations.fadeInUp.animate).toEqual({ opacity: 1, y: 0 })
    })

    it('fadeInScale should include scale transformation', () => {
      expect(iosAnimations.fadeInScale.initial).toEqual({ opacity: 0, scale: 0.95 })
      expect(iosAnimations.fadeInScale.animate).toEqual({ opacity: 1, scale: 1 })
    })
  })

  describe('slide animations', () => {
    it('slideInFromRight should animate from right', () => {
      expect(iosAnimations.slideInFromRight.initial).toEqual({ x: '100%', opacity: 0 })
      expect(iosAnimations.slideInFromRight.animate).toEqual({ x: 0, opacity: 1 })
      expect(iosAnimations.slideInFromRight.transition.type).toBe('spring')
    })

    it('slideInFromBottom should animate from bottom', () => {
      expect(iosAnimations.slideInFromBottom.initial).toEqual({ y: '100%', opacity: 0 })
      expect(iosAnimations.slideInFromBottom.animate).toEqual({ y: 0, opacity: 1 })
      expect(iosAnimations.slideInFromBottom.transition.type).toBe('spring')
    })
  })

  describe('iOS-specific animations', () => {
    it('iosModalPresent should slide up with spring', () => {
      expect(iosAnimations.iosModalPresent.initial).toEqual({ y: '100%', opacity: 0 })
      expect(iosAnimations.iosModalPresent.animate.y).toBe(0)
      expect(iosAnimations.iosModalPresent.animate.opacity).toBe(1)
      expect(iosAnimations.iosModalPresent.animate.transition.type).toBe('spring')
    })

    it('iosSheetPresent should slide up with spring', () => {
      expect(iosAnimations.iosSheetPresent.initial).toEqual({ y: '100%' })
      expect(iosAnimations.iosSheetPresent.animate.y).toBe(0)
      expect(iosAnimations.iosSheetPresent.animate.transition.type).toBe('spring')
    })
  })

  describe('pulse animation', () => {
    it('should pulse scale with infinite repeat', () => {
      expect(iosAnimations.pulse.scale).toEqual([1, 1.05, 1])
      expect(iosAnimations.pulse.transition.repeat).toBe(Infinity)
    })
  })

  describe('shimmer animation', () => {
    it('should have horizontal movement with infinite repeat', () => {
      expect(iosAnimations.shimmer.x).toEqual([-100, 100])
      expect(iosAnimations.shimmer.transition.repeat).toBe(Infinity)
      expect(iosAnimations.shimmer.transition.ease).toBe('linear')
    })
  })
})

describe('iosStaggerDelays', () => {
  it('should have list, grid, and page delay groups', () => {
    expect(iosStaggerDelays).toHaveProperty('list')
    expect(iosStaggerDelays).toHaveProperty('grid')
    expect(iosStaggerDelays).toHaveProperty('page')
  })

  it('should have fast, normal, slow speeds for list', () => {
    expect(iosStaggerDelays.list.fast).toBe(0.03)
    expect(iosStaggerDelays.list.normal).toBe(0.05)
    expect(iosStaggerDelays.list.slow).toBe(0.08)
  })

  it('should have fast, normal, slow speeds for grid', () => {
    expect(iosStaggerDelays.grid.fast).toBe(0.08)
    expect(iosStaggerDelays.grid.normal).toBe(0.1)
    expect(iosStaggerDelays.grid.slow).toBe(0.15)
  })

  it('should have hero, section, element speeds for page', () => {
    expect(iosStaggerDelays.page.hero).toBe(0.2)
    expect(iosStaggerDelays.page.section).toBe(0.15)
    expect(iosStaggerDelays.page.element).toBe(0.1)
  })

  it('should have increasing delays from fast to slow', () => {
    expect(iosStaggerDelays.list.fast).toBeLessThan(iosStaggerDelays.list.normal)
    expect(iosStaggerDelays.list.normal).toBeLessThan(iosStaggerDelays.list.slow)

    expect(iosStaggerDelays.grid.fast).toBeLessThan(iosStaggerDelays.grid.normal)
    expect(iosStaggerDelays.grid.normal).toBeLessThan(iosStaggerDelays.grid.slow)
  })
})

describe('getStaggerDelay', () => {
  it('should return 0 for index 0', () => {
    expect(getStaggerDelay(0)).toBe(0)
  })

  it('should return delay * index for default list/normal', () => {
    expect(getStaggerDelay(1)).toBe(0.05)
    expect(getStaggerDelay(3)).toBeCloseTo(0.15)
    expect(getStaggerDelay(5)).toBeCloseTo(0.25)
  })

  it('should use list fast delay', () => {
    expect(getStaggerDelay(2, 'list', 'fast')).toBeCloseTo(0.06)
  })

  it('should use grid normal delay', () => {
    expect(getStaggerDelay(3, 'grid', 'normal')).toBeCloseTo(0.3)
  })

  it('should use page hero delay', () => {
    expect(getStaggerDelay(1, 'page', 'hero')).toBe(0.2)
  })

  it('should use page element delay', () => {
    expect(getStaggerDelay(2, 'page', 'element')).toBeCloseTo(0.2)
  })

  it('should use default delay for unknown speed', () => {
    // For list, default is 0.05
    expect(getStaggerDelay(1, 'list', 'unknown')).toBe(0.05)
    // For page, default is 0.1
    expect(getStaggerDelay(1, 'page', 'unknown')).toBe(0.1)
  })
})

describe('getStaggerContainer', () => {
  it('should return hidden and show variants', () => {
    const container = getStaggerContainer()
    expect(container).toHaveProperty('hidden')
    expect(container).toHaveProperty('show')
  })

  it('should have hidden state with opacity 0', () => {
    const container = getStaggerContainer()
    expect(container.hidden).toEqual({ opacity: 0 })
  })

  it('should have show state with staggerChildren', () => {
    const container = getStaggerContainer()
    expect(container.show.opacity).toBe(1)
    expect(container.show.transition.staggerChildren).toBe(0.05) // list normal
  })

  it('should use correct stagger delay for grid slow', () => {
    const container = getStaggerContainer('grid', 'slow')
    expect(container.show.transition.staggerChildren).toBe(0.15)
  })

  it('should use correct stagger delay for page section', () => {
    const container = getStaggerContainer('page', 'section')
    expect(container.show.transition.staggerChildren).toBe(0.15)
  })

  it('should use default delay for unknown speed', () => {
    const container = getStaggerContainer('list', 'unknown')
    expect(container.show.transition.staggerChildren).toBe(0.05) // list default
  })
})

describe('staggerItem', () => {
  it('should have hidden state with opacity 0 and y offset', () => {
    expect(staggerItem.hidden).toEqual({ opacity: 0, y: 20 })
  })

  it('should have show state with full opacity and y=0', () => {
    expect(staggerItem.show.opacity).toBe(1)
    expect(staggerItem.show.y).toBe(0)
  })

  it('should use spring transition', () => {
    expect(staggerItem.show.transition.type).toBe('spring')
    expect(staggerItem.show.transition.stiffness).toBe(400)
    expect(staggerItem.show.transition.damping).toBe(30)
  })
})

describe('hapticFeedback', () => {
  it('should have all feedback types', () => {
    expect(hapticFeedback).toHaveProperty('light')
    expect(hapticFeedback).toHaveProperty('medium')
    expect(hapticFeedback).toHaveProperty('heavy')
    expect(hapticFeedback).toHaveProperty('success')
    expect(hapticFeedback).toHaveProperty('error')
  })

  it('light should have subtle scale change', () => {
    expect(hapticFeedback.light.scale).toEqual([1, 0.98, 1])
    expect(hapticFeedback.light.transition.duration).toBe(0.15)
  })

  it('medium should have moderate scale change', () => {
    expect(hapticFeedback.medium.scale).toEqual([1, 0.96, 1])
    expect(hapticFeedback.medium.transition.duration).toBe(0.2)
  })

  it('heavy should have strong scale change', () => {
    expect(hapticFeedback.heavy.scale).toEqual([1, 0.94, 1])
    expect(hapticFeedback.heavy.transition.duration).toBe(0.25)
  })

  it('success should scale up', () => {
    expect(hapticFeedback.success.scale).toEqual([1, 1.05, 1])
    expect(hapticFeedback.success.transition.duration).toBe(0.3)
  })

  it('error should shake horizontally', () => {
    expect(hapticFeedback.error.x).toEqual([0, -10, 10, -10, 10, 0])
    expect(hapticFeedback.error.transition.duration).toBe(0.4)
  })

  it('should have increasing duration from light to heavy', () => {
    expect(hapticFeedback.light.transition.duration)
      .toBeLessThan(hapticFeedback.medium.transition.duration)
    expect(hapticFeedback.medium.transition.duration)
      .toBeLessThan(hapticFeedback.heavy.transition.duration)
  })

  it('should have decreasing minimum scale from light to heavy', () => {
    const lightMin = Math.min(...hapticFeedback.light.scale)
    const mediumMin = Math.min(...hapticFeedback.medium.scale)
    const heavyMin = Math.min(...hapticFeedback.heavy.scale)
    expect(lightMin).toBeGreaterThan(mediumMin)
    expect(mediumMin).toBeGreaterThan(heavyMin)
  })
})
