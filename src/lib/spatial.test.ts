import { describe, expect, it } from 'vitest'
import {
  pickSpatialQuestionSet,
  reverseSequence,
  isSpatialAnswerCorrect,
  getGridSize,
  getAnswerTimeoutMs,
} from './spatial'

describe('pickSpatialQuestionSet', () => {
  it('generates 3 questions per set', () => {
    expect(pickSpatialQuestionSet(1)).toHaveLength(3)
  })

  it('scales grid size and sequence length by level', () => {
    const lv1 = pickSpatialQuestionSet(1)[0]
    const lv2 = pickSpatialQuestionSet(2)[0]
    const lv3 = pickSpatialQuestionSet(3)[0]
    expect(lv1.gridSize).toBe(3)
    expect(lv1.sequence).toHaveLength(3)
    expect(lv2.gridSize).toBe(3)
    expect(lv2.sequence).toHaveLength(4)
    expect(lv3.gridSize).toBe(4)
    expect(lv3.sequence).toHaveLength(5)
  })

  it('never repeats a cell within a single sequence', () => {
    for (let i = 0; i < 20; i++) {
      const question = pickSpatialQuestionSet(3)[0]
      const unique = new Set(question.sequence)
      expect(unique.size).toBe(question.sequence.length)
    }
  })

  it('only uses cell indices within the grid bounds', () => {
    const question = pickSpatialQuestionSet(3)[0]
    for (const cell of question.sequence) {
      expect(cell).toBeGreaterThanOrEqual(0)
      expect(cell).toBeLessThan(question.gridSize * question.gridSize)
    }
  })
})

describe('getGridSize', () => {
  it('returns the grid size for each level', () => {
    expect(getGridSize(1)).toBe(3)
    expect(getGridSize(2)).toBe(3)
    expect(getGridSize(3)).toBe(4)
  })
})

describe('reverseSequence', () => {
  it('reverses without mutating the original array', () => {
    const original = [1, 2, 3]
    const reversed = reverseSequence(original)
    expect(reversed).toEqual([3, 2, 1])
    expect(original).toEqual([1, 2, 3])
  })
})

describe('isSpatialAnswerCorrect', () => {
  it('returns true when tapped order exactly matches the expected order', () => {
    expect(isSpatialAnswerCorrect([3, 2, 1], [3, 2, 1])).toBe(true)
  })

  it('returns false when the order differs', () => {
    expect(isSpatialAnswerCorrect([2, 3, 1], [3, 2, 1])).toBe(false)
  })

  it('returns false when the length differs', () => {
    expect(isSpatialAnswerCorrect([3, 2], [3, 2, 1])).toBe(false)
  })
})

describe('getAnswerTimeoutMs', () => {
  it('increases with sequence length', () => {
    expect(getAnswerTimeoutMs(3)).toBeLessThan(getAnswerTimeoutMs(5))
  })
})
