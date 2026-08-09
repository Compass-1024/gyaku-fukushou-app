import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadHistory,
  appendHistoryEntry,
  clearHistory,
  getLevelStats,
  getTodayCount,
  getStreakDays,
  getAllAreaStats,
  getWeakestAreas,
  getBestSetAccuracy,
  getTodayBestSetAccuracy,
  getDailyAccuracyTrend,
  getActivityCalendar,
} from './history'
import type { HistoryEntry } from '../types'

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

describe('loadHistory / appendHistoryEntry', () => {
  it('starts empty', () => {
    expect(loadHistory()).toEqual([])
  })

  it('persists an entry with a generated timestamp', () => {
    appendHistoryEntry({ mode: 'word', level: 1, correct: 2, total: 3 })
    const history = loadHistory()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({
      mode: 'word',
      level: 1,
      correct: 2,
      total: 3,
    })
    expect(typeof history[0].timestamp).toBe('string')
  })
})

describe('getLevelStats', () => {
  it('returns null accuracy with no matching entries', () => {
    expect(getLevelStats([], 1, 'word')).toEqual({
      attempts: 0,
      accuracy: null,
    })
  })

  it('aggregates only entries matching level/mode/gameType', () => {
    const now = new Date().toISOString()
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 2, total: 3, timestamp: now },
      { mode: 'word', level: 2, correct: 1, total: 3, timestamp: now },
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 1,
        correct: 3,
        total: 3,
        timestamp: now,
      },
    ]
    expect(getLevelStats(history, 1, 'word')).toEqual({
      attempts: 1,
      accuracy: 67,
    })
    expect(getLevelStats(history, 1, 'digit', 'reverse')).toEqual({
      attempts: 1,
      accuracy: 100,
    })
    expect(getLevelStats(history, 1, 'digit', 'sum')).toEqual({
      attempts: 0,
      accuracy: null,
    })
  })
})

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function entryOn(timestamp: string): HistoryEntry {
  return { mode: 'word', level: 1, correct: 1, total: 1, timestamp }
}

// タイムゾーンによる日付ずれを避けるため、現地時刻の正午を使って
// 特定の暦日を指すHistoryEntryを作る
function entryOnLocalDate(year: number, month: number, day: number): HistoryEntry {
  return entryOn(new Date(year, month - 1, day, 12).toISOString())
}

function localKeyDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('getTodayCount', () => {
  it('counts only entries from today', () => {
    const history = [entryOn(daysAgo(0)), entryOn(daysAgo(1))]
    expect(getTodayCount(history)).toBe(1)
  })
})

describe('getStreakDays', () => {
  it('counts consecutive days including today', () => {
    const history = [entryOn(daysAgo(0)), entryOn(daysAgo(1)), entryOn(daysAgo(2))]
    expect(getStreakDays(history)).toBe(3)
  })

  it('keeps the streak alive if today has not been played yet', () => {
    const history = [entryOn(daysAgo(1)), entryOn(daysAgo(2))]
    expect(getStreakDays(history)).toBe(2)
  })

  it('breaks the streak when there is a gap', () => {
    const history = [entryOn(daysAgo(2))]
    expect(getStreakDays(history)).toBe(0)
  })

  it('returns 0 for empty history', () => {
    expect(getStreakDays([])).toBe(0)
  })

  it('fix③-5: counts extraPlayedDateKeys (e.g. daily challenge) toward the streak', () => {
    const extra = new Set([localKeyDaysAgo(0)])
    // historyには何も無いが、デイリーチャレンジのみ今日取り組んだ場合
    expect(getStreakDays([], new Date(), extra)).toBe(1)
  })

  it('fix③-5: merges history days and extraPlayedDateKeys into one continuous streak', () => {
    const history = [entryOn(daysAgo(1)), entryOn(daysAgo(2))]
    const extra = new Set([localKeyDaysAgo(0)]) // 今日はデイリーチャレンジのみ
    expect(getStreakDays(history, new Date(), extra)).toBe(3)
  })

  it('bridges a single missed day using a streak freeze', () => {
    // day0, day1 プレイ、day2 欠落、day3 プレイ
    const history = [entryOn(daysAgo(0)), entryOn(daysAgo(1)), entryOn(daysAgo(3))]
    expect(getStreakDays(history)).toBe(3)
  })

  it('does not bridge two consecutive missed days', () => {
    // day0, day1 プレイ、day2・day3 欠落（2日連続）
    const history = [entryOn(daysAgo(0)), entryOn(daysAgo(1)), entryOn(daysAgo(4))]
    expect(getStreakDays(history)).toBe(2)
  })

  it('stops bridging once the monthly freeze budget is used up', () => {
    // 実時刻(daysAgo)を使うと月境界をまたぐ日に実行された場合に結果が
    // 変わってしまう（月ごとに猶予が独立してリセットされるため）ため、
    // 月境界をまたがない固定日付で検証する
    const now = new Date(2026, 7, 15, 12) // 2026-08-15
    // 8/14, 8/12, 8/10 欠落（3回目の単日欠落は月2回の上限を超えるため救済されない）
    const history = [
      entryOnLocalDate(2026, 8, 15),
      entryOnLocalDate(2026, 8, 13),
      entryOnLocalDate(2026, 8, 11),
      entryOnLocalDate(2026, 8, 9),
    ]
    expect(getStreakDays(history, now)).toBe(3)
  })

  it('resets the freeze budget independently per calendar month', () => {
    // 2026年8月分の猶予を8/3・8/1で使い切っていても、月をまたいだ7/30の
    // 欠落は7月分の猶予として独立に消費されるため引き続き橋渡しされる
    const now = new Date(2026, 7, 5, 12) // 2026-08-05
    const history = [
      entryOnLocalDate(2026, 8, 5),
      entryOnLocalDate(2026, 8, 4),
      // 2026-08-03 欠落（8月の猶予 1/2）
      entryOnLocalDate(2026, 8, 2),
      // 2026-08-01 欠落（8月の猶予 2/2、上限到達）
      entryOnLocalDate(2026, 7, 31),
      // 2026-07-30 欠落（7月の猶予 1/2。8月の上限とは独立）
      entryOnLocalDate(2026, 7, 29),
    ]
    expect(getStreakDays(history, now)).toBe(5)
  })
})

describe('getAllAreaStats', () => {
  it('enumerates all 24 mode/gameType/level combinations', () => {
    const areas = getAllAreaStats([])
    expect(areas).toHaveLength(24)
    expect(areas.every((a) => a.stats.attempts === 0)).toBe(true)
  })
})

describe('getWeakestAreas', () => {
  it('excludes areas with no attempts and sorts ascending by accuracy', () => {
    const now = new Date().toISOString()
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 3, total: 3, timestamp: now },
      { mode: 'word', level: 2, correct: 1, total: 4, timestamp: now },
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 1,
        correct: 2,
        total: 4,
        timestamp: now,
      },
    ]
    const weakest = getWeakestAreas(history, 2)
    expect(weakest).toHaveLength(2)
    expect(weakest[0]).toMatchObject({ mode: 'word', level: 2 })
    expect(weakest[1]).toMatchObject({ mode: 'digit', gameType: 'reverse', level: 1 })
  })

  it('returns an empty array when nothing has been attempted', () => {
    expect(getWeakestAreas([], 2)).toEqual([])
  })

  it('prefers areas with enough attempts over a single unlucky attempt', () => {
    const now = new Date().toISOString()
    const history: HistoryEntry[] = [
      // 1回だけ挑戦して0%（たまたまの失敗）
      { mode: 'word', level: 1, correct: 0, total: 3, timestamp: now },
      // 複数回挑戦した上での40%（より確からしい苦手分野）
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 1,
        correct: 1,
        total: 3,
        timestamp: now,
      },
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 1,
        correct: 1,
        total: 2,
        timestamp: now,
      },
    ]
    const weakest = getWeakestAreas(history, 1)
    expect(weakest[0]).toMatchObject({ mode: 'digit', gameType: 'reverse', level: 1 })
  })

  it('falls back to single-attempt areas when none meet the reliability threshold', () => {
    const now = new Date().toISOString()
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 0, total: 3, timestamp: now },
      { mode: 'word', level: 2, correct: 3, total: 3, timestamp: now },
    ]
    const weakest = getWeakestAreas(history, 1)
    expect(weakest[0]).toMatchObject({ mode: 'word', level: 1 })
  })

  it('resurfaces a high-accuracy area that has not been attempted in a long time', () => {
    const reference = new Date('2026-08-01T00:00:00Z')
    const longAgo = new Date('2026-06-01T00:00:00Z').toISOString() // 61日前
    const recent = new Date('2026-07-31T00:00:00Z').toISOString() // 1日前
    const history: HistoryEntry[] = [
      // 正答率90%だが61日間放置（忘却が進んでいる可能性が高い）
      { mode: 'word', level: 1, correct: 9, total: 10, timestamp: longAgo },
      { mode: 'word', level: 1, correct: 9, total: 10, timestamp: longAgo },
      // 正答率70%だが昨日挑戦したばかり
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 7, total: 10, timestamp: recent },
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 7, total: 10, timestamp: recent },
    ]
    const weakest = getWeakestAreas(history, 1, reference)
    expect(weakest[0]).toMatchObject({ mode: 'word', level: 1 })
  })

  it('breaks a tied score by preferring the area with more attempts', () => {
    const reference = new Date('2026-08-01T00:00:00Z')
    const ts = new Date('2026-07-31T00:00:00Z').toISOString() // 両者とも最終挑戦日時は同じ
    const history: HistoryEntry[] = [
      // word level1: 2回挑戦して正答率50%
      { mode: 'word', level: 1, correct: 1, total: 2, timestamp: ts },
      { mode: 'word', level: 1, correct: 1, total: 2, timestamp: ts },
      // digit(reverse) level1: 4回挑戦して同じく正答率50%（より確からしい）
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 1, total: 2, timestamp: ts },
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 1, total: 2, timestamp: ts },
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 1, total: 2, timestamp: ts },
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 1, total: 2, timestamp: ts },
    ]
    const weakest = getWeakestAreas(history, 2, reference)
    expect(weakest[0]).toMatchObject({ mode: 'digit', gameType: 'reverse', level: 1 })
  })
})

describe('clearHistory', () => {
  it('removes all stored history', () => {
    appendHistoryEntry({ mode: 'word', level: 1, correct: 1, total: 1 })
    expect(loadHistory()).toHaveLength(1)
    clearHistory()
    expect(loadHistory()).toEqual([])
  })
})

describe('getBestSetAccuracy', () => {
  it('returns the highest accuracy among matching entries', () => {
    const now = new Date().toISOString()
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: now },
      { mode: 'word', level: 1, correct: 3, total: 3, timestamp: now },
      { mode: 'word', level: 1, correct: 2, total: 3, timestamp: now },
      { mode: 'word', level: 2, correct: 3, total: 3, timestamp: now },
    ]
    expect(getBestSetAccuracy(history, 'word', 1)).toBe(100)
  })

  it('returns null when there are no matching entries', () => {
    expect(getBestSetAccuracy([], 'word', 1)).toBeNull()
  })

  it('distinguishes digit gameType when matching', () => {
    const now = new Date().toISOString()
    const history: HistoryEntry[] = [
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 1,
        correct: 3,
        total: 3,
        timestamp: now,
      },
      {
        mode: 'digit',
        gameType: 'sum',
        level: 1,
        correct: 0,
        total: 3,
        timestamp: now,
      },
    ]
    expect(getBestSetAccuracy(history, 'digit', 1, 'sum')).toBe(0)
    expect(getBestSetAccuracy(history, 'digit', 1, 'reverse')).toBe(100)
  })
})

describe('getTodayBestSetAccuracy (④-5: 本日の自己記録比較)', () => {
  it('returns the highest accuracy among only today\'s matching entries', () => {
    const now = new Date(2026, 2, 5, 12, 0, 0)
    const yesterday = new Date(2026, 2, 4, 12, 0, 0)
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 3, total: 3, timestamp: yesterday.toISOString() },
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: now.toISOString() },
      { mode: 'word', level: 1, correct: 2, total: 3, timestamp: now.toISOString() },
    ]
    expect(getTodayBestSetAccuracy(history, 'word', 1, undefined, now)).toBe(67)
  })

  it('returns null when there is no attempt today', () => {
    const now = new Date(2026, 2, 5, 12, 0, 0)
    const yesterday = new Date(2026, 2, 4, 12, 0, 0)
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 3, total: 3, timestamp: yesterday.toISOString() },
    ]
    expect(getTodayBestSetAccuracy(history, 'word', 1, undefined, now)).toBeNull()
  })
})

describe('getDailyAccuracyTrend', () => {
  it('returns the requested number of days, oldest first', () => {
    const trend = getDailyAccuracyTrend([], 7)
    expect(trend).toHaveLength(7)
    expect(trend[6].dateKey).toBe(
      (() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })(),
    )
  })

  it('returns null accuracy for days with no entries', () => {
    const trend = getDailyAccuracyTrend([], 3)
    expect(trend.every((d) => d.accuracy === null)).toBe(true)
  })

  it('aggregates accuracy for a day with entries', () => {
    const history = [
      entryOn(daysAgo(0)),
      { mode: 'word' as const, level: 1 as const, correct: 0, total: 1, timestamp: daysAgo(0) },
    ]
    const trend = getDailyAccuracyTrend(history, 1)
    expect(trend[0].accuracy).toBe(50)
  })
})

describe('getActivityCalendar', () => {
  it('returns exactly weeks*7 cells', () => {
    const calendar = getActivityCalendar([], 4)
    expect(calendar).toHaveLength(28)
  })

  it('starts each week on Sunday and ends on Saturday', () => {
    const calendar = getActivityCalendar([], 2)
    expect(calendar[0].weekday).toBe(0)
    expect(calendar[13].weekday).toBe(6)
  })

  it('marks days after today as -1 (no data yet)', () => {
    const calendar = getActivityCalendar([], 2)
    const todayKey = localKeyDaysAgo(0)
    const todayEntry = calendar.find((d) => d.dateKey === todayKey)
    expect(todayEntry?.count).toBeGreaterThanOrEqual(0)
    for (const day of calendar) {
      if (day.dateKey > todayKey) expect(day.count).toBe(-1)
    }
  })

  it('counts the number of completed sets per day', () => {
    // weeks:1のグリッドは「今週（日曜始まり）」のみを含むため、実時刻(daysAgo)
    // では日曜日に実行されると前日が前週側に落ちてテストが不安定になる。
    // 週の途中（水曜）を固定のnowとして検証する
    const now = new Date(2026, 7, 5, 12) // 2026-08-05（水曜）
    const history = [
      entryOnLocalDate(2026, 8, 5),
      entryOnLocalDate(2026, 8, 5),
      entryOnLocalDate(2026, 8, 4),
    ]
    const calendar = getActivityCalendar(history, 1, now)
    expect(calendar.find((d) => d.dateKey === '2026-08-05')?.count).toBe(2)
    expect(calendar.find((d) => d.dateKey === '2026-08-04')?.count).toBe(1)
  })

  it('returns 0 for days with no activity', () => {
    const calendar = getActivityCalendar([], 1)
    expect(calendar.every((d) => d.count === 0 || d.count === -1)).toBe(true)
  })
})
