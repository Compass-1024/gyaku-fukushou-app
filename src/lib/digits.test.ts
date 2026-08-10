import { describe, expect, it, beforeEach } from 'vitest'
import {
  reverseDigits,
  sumDigits,
  isDigitAnswerCorrect,
  pickDigitQuestionSet,
  recordDigitAttempt,
  getAnswerTimeoutMs,
} from './digits'
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

describe('pickDigitQuestionSet の除外機能', () => {
  it('excludeに渡した数字列を避けて生成する（モードを途中でやめて再挑戦した際、同じ問題が出ないようにする）', () => {
    const exclude = [[1, 2, 3]]
    for (let i = 0; i < 200; i++) {
      const [{ digits }] = pickDigitQuestionSet(1, exclude)
      expect(digits).not.toEqual([1, 2, 3])
    }
  })

  it('同一セット内で同じ数字列が重複して出題されない', () => {
    for (let i = 0; i < 200; i++) {
      const set = pickDigitQuestionSet(1)
      const serialized = set.map((q) => q.digits.join(','))
      expect(new Set(serialized).size).toBe(set.length)
    }
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
      recordDigitAttempt(1, [1, 1, 1], false)
    }
    let repeatCount = 0
    // 乱数依存のテストのため、試行回数を増やして分散を抑え閾値付近での
    // フレーキーな失敗を防ぐ（実測: 重みなしrepeat率≈28%、この重み付け後は
    // ≈52%。閾値40%はその中間より十分低く、5000試行の実測で標準偏差の
    // 5倍以上の余裕がある）
    const trials = 500
    for (let i = 0; i < trials; i++) {
      const [{ digits }] = pickDigitQuestionSet(1)
      if (new Set(digits).size !== digits.length) repeatCount += 1
    }
    expect(repeatCount).toBeGreaterThan(trials * 0.4)
  })
})
