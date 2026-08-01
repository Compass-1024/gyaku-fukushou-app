import { describe, expect, it } from 'vitest'
import {
  reverseDigits,
  sumDigits,
  isDigitAnswerCorrect,
  pickDigitQuestionSet,
  getAnswerTimeoutMs,
} from './digits'
import type { Level } from '../types'

describe('reverseDigits', () => {
  it('reverses a digit array, preserving a resulting leading zero', () => {
    expect(reverseDigits([5, 2, 3, 0])).toBe('0325')
  })

  it('handles an all-zero sequence', () => {
    expect(reverseDigits([0, 0, 0])).toBe('000')
  })
})

describe('sumDigits', () => {
  it('sums the digits', () => {
    expect(sumDigits([9, 8, 6])).toBe('23')
  })

  it('returns "0" for an all-zero sequence', () => {
    expect(sumDigits([0, 0, 0])).toBe('0')
  })
})

describe('isDigitAnswerCorrect', () => {
  it('accepts an answer typed without a leading zero', () => {
    // 5,2,3,0 reversed is "0325"; typing "325" should still count as correct
    expect(isDigitAnswerCorrect('325', '0325')).toBe(true)
  })

  it('accepts the exact answer including the leading zero', () => {
    expect(isDigitAnswerCorrect('0325', '0325')).toBe(true)
  })

  it('rejects a wrong digit sequence', () => {
    expect(isDigitAnswerCorrect('35', '0325')).toBe(false)
  })

  it('rejects an empty answer', () => {
    expect(isDigitAnswerCorrect('', '0325')).toBe(false)
  })

  it('rejects an answer with extra digits beyond the expected length', () => {
    expect(isDigitAnswerCorrect('00325', '0325')).toBe(false)
  })
})

describe('pickDigitQuestionSet', () => {
  it('generates 3 questions with the correct digit length per level', () => {
    const lengths: Record<Level, number> = { 1: 3, 2: 5, 3: 7 }
    for (const level of [1, 2, 3] as const) {
      const set = pickDigitQuestionSet(level)
      expect(set).toHaveLength(3)
      for (const q of set) {
        expect(q.digits).toHaveLength(lengths[level])
        for (const d of q.digits) {
          expect(d).toBeGreaterThanOrEqual(0)
          expect(d).toBeLessThanOrEqual(9)
        }
      }
    }
  })
})

describe('getAnswerTimeoutMs', () => {
  it('grows with digit length', () => {
    expect(getAnswerTimeoutMs(7)).toBeGreaterThan(getAnswerTimeoutMs(3))
  })
})
