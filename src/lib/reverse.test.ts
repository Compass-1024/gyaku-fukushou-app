import { describe, expect, it } from 'vitest'
import { reverseText } from './reverse'

describe('reverseText', () => {
  it('reverses basic hiragana', () => {
    expect(reverseText('くつ')).toBe('つく')
  })

  it('returns the same string for palindromes', () => {
    expect(reverseText('しんぶんし')).toBe('しんぶんし')
  })

  it('handles an empty string', () => {
    expect(reverseText('')).toBe('')
  })

  it('handles a single character', () => {
    expect(reverseText('あ')).toBe('あ')
  })
})
