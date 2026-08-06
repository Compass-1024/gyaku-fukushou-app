import { describe, expect, it } from 'vitest'
import {
  pickPatternQuestionSet,
  isPatternSelectionCorrect,
  getAnswerTimeoutMs,
} from './pattern'

describe('pickPatternQuestionSet', () => {
  it('generates 3 questions per set', () => {
    expect(pickPatternQuestionSet(1)).toHaveLength(3)
  })

  it('scales grid size and filled cell count by level', () => {
    const lv1 = pickPatternQuestionSet(1)[0]
    const lv2 = pickPatternQuestionSet(2)[0]
    const lv3 = pickPatternQuestionSet(3)[0]
    expect(lv1.gridSize).toBe(4)
    expect(lv1.filledCells).toHaveLength(4)
    expect(lv2.gridSize).toBe(4)
    expect(lv2.filledCells).toHaveLength(6)
    expect(lv3.gridSize).toBe(5)
    expect(lv3.filledCells).toHaveLength(8)
  })

  it('never repeats a cell within filledCells', () => {
    for (let i = 0; i < 20; i++) {
      const q = pickPatternQuestionSet(3)[0]
      expect(new Set(q.filledCells).size).toBe(q.filledCells.length)
    }
  })
})

describe('isPatternSelectionCorrect', () => {
  it('is correct when the selection exactly matches the filled cells (order-independent)', () => {
    expect(isPatternSelectionCorrect([1, 2, 3], [3, 2, 1])).toBe(true)
  })

  it('is incorrect when the selection is missing a cell', () => {
    expect(isPatternSelectionCorrect([1, 2], [1, 2, 3])).toBe(false)
  })

  it('is incorrect when the selection has an extra cell', () => {
    expect(isPatternSelectionCorrect([1, 2, 3, 4], [1, 2, 3])).toBe(false)
  })

  it('is incorrect when the selection has the same size but a different cell', () => {
    expect(isPatternSelectionCorrect([1, 2, 9], [1, 2, 3])).toBe(false)
  })

  it('is correct for an empty selection matching an empty pattern', () => {
    expect(isPatternSelectionCorrect([], [])).toBe(true)
  })
})

describe('getAnswerTimeoutMs', () => {
  it('increases with the number of filled cells', () => {
    expect(getAnswerTimeoutMs(4)).toBeLessThan(getAnswerTimeoutMs(8))
  })
})
