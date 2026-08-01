import { describe, expect, it } from 'vitest'
import {
  pickToneQuestionSet,
  isToneAnswerCorrect,
  getAnswerTimeoutMs,
  PAD_COUNT,
} from './tone'

describe('pickToneQuestionSet', () => {
  it('generates 3 questions per set', () => {
    expect(pickToneQuestionSet(1)).toHaveLength(3)
  })

  it('scales sequence length by level', () => {
    expect(pickToneQuestionSet(1)[0].sequence).toHaveLength(3)
    expect(pickToneQuestionSet(2)[0].sequence).toHaveLength(4)
    expect(pickToneQuestionSet(3)[0].sequence).toHaveLength(5)
  })

  it('only uses pad indices within bounds', () => {
    const question = pickToneQuestionSet(3)[0]
    for (const pad of question.sequence) {
      expect(pad).toBeGreaterThanOrEqual(0)
      expect(pad).toBeLessThan(PAD_COUNT)
    }
  })
})

describe('isToneAnswerCorrect', () => {
  it('returns true when tapped order exactly matches the sequence', () => {
    expect(isToneAnswerCorrect([0, 1, 2], [0, 1, 2])).toBe(true)
  })

  it('returns false when the order differs', () => {
    expect(isToneAnswerCorrect([1, 0, 2], [0, 1, 2])).toBe(false)
  })

  it('returns false when the length differs', () => {
    expect(isToneAnswerCorrect([0, 1], [0, 1, 2])).toBe(false)
  })
})

describe('getAnswerTimeoutMs', () => {
  it('increases with sequence length', () => {
    expect(getAnswerTimeoutMs(3)).toBeLessThan(getAnswerTimeoutMs(5))
  })
})
