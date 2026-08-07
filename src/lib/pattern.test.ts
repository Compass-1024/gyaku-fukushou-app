import { describe, expect, it, beforeEach } from 'vitest'
import {
  pickPatternQuestionSet,
  isPatternSelectionCorrect,
  getAnswerTimeoutMs,
  recordPatternAttempt,
} from './pattern'

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

function isClustered(filledCells: number[], gridSize: number): boolean {
  let totalDistance = 0
  let pairCount = 0
  for (let i = 0; i < filledCells.length; i++) {
    for (let j = i + 1; j < filledCells.length; j++) {
      const ax = filledCells[i] % gridSize
      const ay = Math.floor(filledCells[i] / gridSize)
      const bx = filledCells[j] % gridSize
      const by = Math.floor(filledCells[j] / gridSize)
      totalDistance += Math.abs(ax - bx) + Math.abs(ay - by)
      pairCount += 1
    }
  }
  const avgDistance = pairCount > 0 ? totalDistance / pairCount : 0
  return avgDistance <= gridSize / 2
}

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

describe('出題重み付け（questionWeighting.ts経由）', () => {
  it('かたまった配置で不正解を繰り返し記録すると、以後その模様パターンが選ばれやすくなる', () => {
    for (let i = 0; i < 20; i++) {
      recordPatternAttempt(1, [0, 1, 4, 5], 4, false)
    }
    let clusteredCount = 0
    const trials = 100
    for (let i = 0; i < trials; i++) {
      const [{ filledCells, gridSize }] = pickPatternQuestionSet(1)
      if (isClustered(filledCells, gridSize)) clusteredCount += 1
    }
    // 4×4グリッドで4マスが「かたまって」いる確率はランダムだとかなり低い
    // （厳しめの閾値のため）が、重み付けにより明確にベースラインを上回るはず
    expect(clusteredCount).toBeGreaterThan(trials * 0.2)
  })
})
