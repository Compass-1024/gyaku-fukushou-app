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
})

describe('getAllAreaStats', () => {
  it('enumerates all 21 mode/gameType/level combinations', () => {
    const areas = getAllAreaStats([])
    expect(areas).toHaveLength(21)
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
    const history = [entryOn(daysAgo(0)), entryOn(daysAgo(0)), entryOn(daysAgo(1))]
    const calendar = getActivityCalendar(history, 1)
    const todayKey = localKeyDaysAgo(0)
    const yesterdayKey = localKeyDaysAgo(1)
    expect(calendar.find((d) => d.dateKey === todayKey)?.count).toBe(2)
    expect(calendar.find((d) => d.dateKey === yesterdayKey)?.count).toBe(1)
  })

  it('returns 0 for days with no activity', () => {
    const calendar = getActivityCalendar([], 1)
    expect(calendar.every((d) => d.count === 0 || d.count === -1)).toBe(true)
  })
})
