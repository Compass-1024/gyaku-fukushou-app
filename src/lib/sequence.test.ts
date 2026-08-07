import { describe, expect, it, beforeEach } from 'vitest'
import {
  pickSequenceQuestionSet,
  expectedSequenceAnswer,
  isSequenceAnswerCorrect,
  recordSequenceAttempt,
  getAnswerTimeoutMs,
} from './sequence'
import type { Level } from '../types'

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

describe('出題重み付け（questionWeighting.ts経由）', () => {
  it('数字の重複がある系列で不正解を繰り返し記録すると、以後その系列パターンが選ばれやすくなる', () => {
    for (let i = 0; i < 20; i++) {
      recordSequenceAttempt(1, [1, 1, 1], false)
    }
    let repeatCount = 0
    const trials = 100
    for (let i = 0; i < trials; i++) {
      const [{ digits }] = pickSequenceQuestionSet(1)
      if (new Set(digits).size !== digits.length) repeatCount += 1
    }
    expect(repeatCount).toBeGreaterThan(trials * 0.45)
  })
})
