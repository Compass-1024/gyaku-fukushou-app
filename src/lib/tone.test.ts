import { describe, expect, it, beforeEach } from 'vitest'
import {
  pickToneQuestionSet,
  isToneAnswerCorrect,
  getAnswerTimeoutMs,
  recordToneAttempt,
  PAD_COUNT,
} from './tone'

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

describe('出題重み付け（questionWeighting.ts経由）', () => {
  it('パッドの重複がある系列で不正解を繰り返し記録すると、以後その系列パターンが選ばれやすくなる', () => {
    for (let i = 0; i < 20; i++) {
      recordToneAttempt(1, [0, 0, 1], false)
    }
    let repeatCount = 0
    const trials = 100
    for (let i = 0; i < trials; i++) {
      const [{ sequence }] = pickToneQuestionSet(1)
      if (new Set(sequence).size !== sequence.length) repeatCount += 1
    }
    // パッドは4種から重複ありで選ぶため、重み付けなしでも repeat の
    // ベース確率は6割強とかなり高い。重み付けによりそれをさらに上回るはず
    expect(repeatCount).toBeGreaterThan(trials * 0.75)
  })
})
