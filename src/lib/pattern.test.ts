import { describe, expect, it } from 'vitest'
import {
  pickPatternQuestionSet,
  isPatternAnswerCorrect,
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

  it('keeps comparisonCells identical to filledCells when hasChange is false', () => {
    for (let i = 0; i < 50; i++) {
      const q = pickPatternQuestionSet(2)[0]
      if (!q.hasChange) {
        expect([...q.comparisonCells].sort()).toEqual(
          [...q.filledCells].sort(),
        )
      }
    }
  })

  it('changes exactly one cell when hasChange is true', () => {
    for (let i = 0; i < 50; i++) {
      const q = pickPatternQuestionSet(2)[0]
      if (q.hasChange) {
        const before = new Set(q.filledCells)
        const after = new Set(q.comparisonCells)
        const onlyBefore = [...before].filter((c) => !after.has(c))
        const onlyAfter = [...after].filter((c) => !before.has(c))
        expect(onlyBefore).toHaveLength(1)
        expect(onlyAfter).toHaveLength(1)
        expect(after.size).toBe(before.size)
      }
    }
  })
})

describe('isPatternAnswerCorrect', () => {
  it('is correct when the answer matches whether a change occurred', () => {
    expect(isPatternAnswerCorrect(true, true)).toBe(true)
    expect(isPatternAnswerCorrect(false, false)).toBe(true)
  })

  it('is incorrect when the answer does not match', () => {
    expect(isPatternAnswerCorrect(true, false)).toBe(false)
    expect(isPatternAnswerCorrect(false, true)).toBe(false)
  })
})

describe('getAnswerTimeoutMs', () => {
  it('increases with the number of filled cells', () => {
    expect(getAnswerTimeoutMs(4)).toBeLessThan(getAnswerTimeoutMs(8))
  })
})
