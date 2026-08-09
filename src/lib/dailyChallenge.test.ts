import { describe, expect, it, beforeEach } from 'vitest'
import {
  getDailyChallengeDigits,
  reverseDigitsToString,
  hasCompletedTodayChallenge,
  recordTodayChallengeCompletion,
  loadDailyChallengeCompletions,
  replaceDailyChallengeCompletions,
  DAILY_CHALLENGE_DIGIT_COUNT,
} from './dailyChallenge'

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

describe('getDailyChallengeDigits', () => {
  // localDateKeyはローカルタイムゾーンで日付を判定するため、UTC ISO文字列を
  // 使うとテスト実行環境のタイムゾーン次第で日付境界をまたいでしまう。
  // ローカル時刻コンストラクタで同一暦日内の異なる時刻を作る
  it('returns the same digits for the same day (deterministic)', () => {
    const day = new Date(2026, 2, 5, 9, 0, 0)
    const dayLater = new Date(2026, 2, 5, 21, 0, 0)
    expect(getDailyChallengeDigits(day)).toEqual(getDailyChallengeDigits(dayLater))
  })

  it('returns digits of the configured length, each a single digit', () => {
    const digits = getDailyChallengeDigits(new Date(2026, 2, 5, 9, 0, 0))
    expect(digits).toHaveLength(DAILY_CHALLENGE_DIGIT_COUNT)
    for (const d of digits) {
      expect(d).toBeGreaterThanOrEqual(0)
      expect(d).toBeLessThanOrEqual(9)
    }
  })

  it('differs across different days (in the vast majority of cases)', () => {
    const a = getDailyChallengeDigits(new Date(2026, 2, 5, 9, 0, 0))
    const b = getDailyChallengeDigits(new Date(2026, 2, 6, 9, 0, 0))
    expect(a).not.toEqual(b)
  })
})

describe('reverseDigitsToString', () => {
  it('reverses digits into a string', () => {
    expect(reverseDigitsToString([1, 2, 3, 4])).toBe('4321')
  })
})

describe('daily challenge completion tracking', () => {
  it('is not completed by default', () => {
    expect(hasCompletedTodayChallenge(new Date(2026, 2, 5, 9, 0, 0))).toBe(false)
  })

  it('records a completion and reflects it for the same day', () => {
    const now = new Date(2026, 2, 5, 9, 0, 0)
    recordTodayChallengeCompletion(true, now)
    expect(hasCompletedTodayChallenge(now)).toBe(true)
    expect(loadDailyChallengeCompletions()).toEqual([{ dateKey: '2026-03-05', correct: true }])
  })

  it('does not double-record within the same day', () => {
    const now = new Date(2026, 2, 5, 9, 0, 0)
    recordTodayChallengeCompletion(true, now)
    recordTodayChallengeCompletion(false, now)
    expect(loadDailyChallengeCompletions()).toHaveLength(1)
  })

  it('is not completed on a different day', () => {
    recordTodayChallengeCompletion(true, new Date(2026, 2, 5, 9, 0, 0))
    expect(hasCompletedTodayChallenge(new Date(2026, 2, 6, 9, 0, 0))).toBe(false)
  })
})

describe('replaceDailyChallengeCompletions (③-8: バックアップ復元用)', () => {
  it('replaces the stored completion log wholesale', () => {
    recordTodayChallengeCompletion(true, new Date(2026, 2, 5, 9, 0, 0))
    const restored = [
      { dateKey: '2026-01-01', correct: true },
      { dateKey: '2026-01-02', correct: false },
    ]
    replaceDailyChallengeCompletions(restored)
    expect(loadDailyChallengeCompletions()).toEqual(restored)
  })

  it('filters out invalid entries', () => {
    // @ts-expect-error 意図的に不正な形の配列を渡す
    replaceDailyChallengeCompletions([{ dateKey: '2026-01-01' }, { correct: true }])
    expect(loadDailyChallengeCompletions()).toEqual([])
  })
})
