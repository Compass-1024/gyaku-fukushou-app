import { describe, expect, it } from 'vitest'
import {
  pickSequenceQuestionSet,
  expectedSequenceAnswer,
  isSequenceAnswerCorrect,
  getAnswerTimeoutMs,
} from './sequence'
import type { Level } from '../types'

describe('pickSequenceQuestionSet', () => {
  it('generates 3 questions with the correct digit length per level', () => {
    const lengths: Record<Level, number> = { 1: 3, 2: 5, 3: 7 }
    for (const level of [1, 2, 3] as const) {
      const set = pickSequenceQuestionSet(level)
      expect(set).toHaveLength(3)
      for (const q of set) {
        expect(q.digits).toHaveLength(lengths[level])
      }
    }
  })
})

describe('expectedSequenceAnswer', () => {
  it('joins the digits in the same order (no reversal)', () => {
    expect(expectedSequenceAnswer([5, 2, 3, 0])).toBe('5230')
  })
})

describe('isSequenceAnswerCorrect', () => {
  it('accepts an answer typed without a leading zero', () => {
    expect(isSequenceAnswerCorrect('325', '0325')).toBe(true)
  })

  it('rejects a wrong digit sequence', () => {
    expect(isSequenceAnswerCorrect('35', '0325')).toBe(false)
  })

  it('rejects an empty answer', () => {
    expect(isSequenceAnswerCorrect('', '0325')).toBe(false)
  })
})

describe('getAnswerTimeoutMs', () => {
  it('grows with digit length', () => {
    expect(getAnswerTimeoutMs(7)).toBeGreaterThan(getAnswerTimeoutMs(3))
  })
})
