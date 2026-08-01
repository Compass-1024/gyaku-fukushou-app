import { describe, expect, it } from 'vitest'
import {
  normalizeForCompare,
  isCloseMatch,
  findMatchingAlternative,
} from './kana'

describe('normalizeForCompare', () => {
  it('converts katakana to hiragana', () => {
    expect(normalizeForCompare('ツク')).toBe(normalizeForCompare('つく'))
    expect(normalizeForCompare('ツク')).toBe('つく')
  })

  it('strips punctuation and whitespace', () => {
    expect(normalizeForCompare('つく。')).toBe('つく')
    expect(normalizeForCompare('つ く')).toBe('つく')
  })

  it('preserves small kana', () => {
    expect(normalizeForCompare('キョウシツ')).toBe('きょうしつ')
  })
})

describe('isCloseMatch', () => {
  it('matches identical hiragana strings', () => {
    expect(isCloseMatch('つく', 'つく', 0)).toBe(true)
  })

  it('matches katakana against hiragana with 0 tolerance', () => {
    expect(isCloseMatch('ツク', 'つく', 0)).toBe(true)
  })

  it('tolerates a single-character mishear within tolerance', () => {
    expect(isCloseMatch('づく', 'つく', 1)).toBe(true)
  })

  it('rejects mismatches beyond tolerance', () => {
    expect(isCloseMatch('あいう', 'つく', 1)).toBe(false)
  })
})

describe('findMatchingAlternative', () => {
  it('returns the alternative within tolerance', () => {
    const result = findMatchingAlternative(
      ['あいう', 'つく', 'かきく'],
      'つく',
      1,
    )
    expect(result).toBe('つく')
  })

  it('returns undefined when nothing matches', () => {
    expect(findMatchingAlternative(['あいう'], 'つく', 1)).toBeUndefined()
  })

  it('ignores empty-string alternatives', () => {
    expect(findMatchingAlternative([''], 'つく', 2)).toBeUndefined()
  })
})
