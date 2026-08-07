import { describe, expect, it, beforeEach } from 'vitest'
import {
  pickSpatialQuestionSet,
  reverseSequence,
  isSpatialAnswerCorrect,
  getGridSize,
  getAnswerTimeoutMs,
  recordSpatialAttempt,
} from './spatial'

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

beforeEach(() => {
  globalThis.localStorage = createMemoryStorage()
})

function hasAdjacentPair(sequence: number[], gridSize: number): boolean {
  for (let i = 1; i < sequence.length; i++) {
    const ax = sequence[i - 1] % gridSize
    const ay = Math.floor(sequence[i - 1] / gridSize)
    const bx = sequence[i] % gridSize
    const by = Math.floor(sequence[i] / gridSize)
    if (Math.abs(ax - bx) + Math.abs(ay - by) === 1) return true
  }
  return false
}

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

describe('出題重み付け（questionWeighting.ts経由）', () => {
  it('隣接マス移動を含む系列で不正解を繰り返し記録すると、以後その系列パターンが選ばれやすくなる', () => {
    for (let i = 0; i < 20; i++) {
      recordSpatialAttempt(1, [0, 1, 2], 3, false)
    }
    let adjacentCount = 0
    const trials = 100
    for (let i = 0; i < trials; i++) {
      const [{ sequence, gridSize }] = pickSpatialQuestionSet(1)
      if (hasAdjacentPair(sequence, gridSize)) adjacentCount += 1
    }
    expect(adjacentCount).toBeGreaterThan(trials * 0.6)
  })
})
