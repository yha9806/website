import { describe, it, expect } from 'vitest'
import { cn } from '../../utils/cn'

describe('cn utility', () => {
  it('should merge basic class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle single class name', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })

  it('should filter out falsy values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    expect(cn('foo', null, 'bar')).toBe('foo bar')
    expect(cn('foo', false, 'bar')).toBe('foo bar')
    expect(cn(undefined, null, false)).toBe('')
  })

  it('should handle conditional class names', () => {
    const isActive = true
    const isDisabled = false
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active')
  })

  it('should handle object syntax via clsx', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('should handle array syntax via clsx', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should deduplicate tailwind classes with tailwind-merge', () => {
    // Later class should win over earlier conflicting class
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    expect(cn('mt-2', 'mt-4')).toBe('mt-4')
  })

  it('should merge conflicting tailwind utility classes', () => {
    expect(cn('px-4 py-2', 'px-2')).toBe('py-2 px-2')
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('should preserve non-conflicting tailwind classes', () => {
    expect(cn('p-4', 'mx-2')).toBe('p-4 mx-2')
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('should handle mixed clsx + tailwind-merge scenarios', () => {
    const variant = 'primary' as string
    expect(
      cn(
        'base-class p-4',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500',
        'p-2', // should override p-4
      ),
    ).toBe('base-class bg-blue-500 p-2')
  })
})
