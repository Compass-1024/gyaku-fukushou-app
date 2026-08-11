import { describe, expect, it, beforeEach } from 'vitest'
import {
  DAILY_MISSION_REQUIRED_SETS,
  getDailyMissionTarget,
  getDailyMissionProgress,
  isDailyMissionComplete,
  checkAndRecordDailyMissionCompletion,
} from './dailyMission'
import { loadMissionCompletions } from './missions'
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

const NOW = new Date('2026-08-11T10:00:00+09:00')

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    mode: 'spatial',
    level: 2,
    correct: 1,
    total: 3,
    timestamp: '2026-08-11T01:00:00.000Z', // 2026-08-11 10:00 JST
    ...overrides,
  }
}

describe('getDailyMissionTarget', () => {
  it('falls back to a default target when there is no history', () => {
    const target = getDailyMissionTarget([], 'ja', NOW)
    expect(target).toEqual({ mode: 'digit', level: 1, gameType: 'reverse' })
  })

  it('picks the weakest area from history', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'spatial', level: 2, correct: 0, total: 3 }),
      entry({ mode: 'spatial', level: 2, correct: 0, total: 3 }),
      entry({ mode: 'tone', level: 1, correct: 3, total: 3 }),
      entry({ mode: 'tone', level: 1, correct: 3, total: 3 }),
    ]
    const target = getDailyMissionTarget(history, 'ja', NOW)
    expect(target).toEqual({ mode: 'spatial', level: 2, gameType: undefined })
  })

  it('stays the same for the rest of the day even if history changes', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'spatial', level: 2, correct: 0, total: 3 }),
      entry({ mode: 'spatial', level: 2, correct: 0, total: 3 }),
    ]
    const first = getDailyMissionTarget(history, 'ja', NOW)
    // 履歴が変わってspatialの正答率が改善しても、同じ日のうちはターゲットが動かない
    const improved: HistoryEntry[] = [
      ...history,
      entry({ mode: 'spatial', level: 2, correct: 3, total: 3 }),
      entry({ mode: 'spatial', level: 2, correct: 3, total: 3 }),
      entry({ mode: 'tone', level: 1, correct: 0, total: 3 }),
      entry({ mode: 'tone', level: 1, correct: 0, total: 3 }),
    ]
    const second = getDailyMissionTarget(improved, 'ja', NOW)
    expect(second).toEqual(first)
  })

  it('excludes word mode for the English UI', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'word', level: 1, correct: 0, total: 3 }),
      entry({ mode: 'word', level: 1, correct: 0, total: 3 }),
      entry({ mode: 'tone', level: 1, correct: 1, total: 3 }),
      entry({ mode: 'tone', level: 1, correct: 1, total: 3 }),
    ]
    const target = getDailyMissionTarget(history, 'en', NOW)
    expect(target.mode).not.toBe('word')
  })
})

describe('getDailyMissionProgress / isDailyMissionComplete', () => {
  const target = { mode: 'spatial' as const, level: 2 as const }

  it('counts only sets that match the target mode/level and were played today', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'spatial', level: 2 }),
      entry({ mode: 'spatial', level: 2 }),
      entry({ mode: 'spatial', level: 1 }), // 違うレベルなのでカウントしない
      entry({ mode: 'tone', level: 2 }), // 違うモード
      entry({ mode: 'spatial', level: 2, timestamp: '2026-08-01T01:00:00.000Z' }), // 別日
    ]
    expect(getDailyMissionProgress(history, target, NOW)).toBe(2)
    expect(isDailyMissionComplete(history, target, NOW)).toBe(false)
  })

  it('is complete once the required number of sets is reached', () => {
    const history: HistoryEntry[] = Array.from({ length: DAILY_MISSION_REQUIRED_SETS }, () =>
      entry({ mode: 'spatial', level: 2 }),
    )
    expect(isDailyMissionComplete(history, target, NOW)).toBe(true)
  })
})

describe('checkAndRecordDailyMissionCompletion', () => {
  const target = { mode: 'spatial' as const, level: 2 as const }

  it('returns true and records completion exactly when the required set is first reached', () => {
    const before = Array.from({ length: DAILY_MISSION_REQUIRED_SETS - 1 }, () =>
      entry({ mode: 'spatial', level: 2 }),
    )
    const after = [...before, entry({ mode: 'spatial', level: 2 })]
    const result = checkAndRecordDailyMissionCompletion(before, after, target, NOW)
    expect(result).toBe(true)
    expect(loadMissionCompletions()).toHaveLength(1)
  })

  it('returns false and does not double-record on a later set the same day', () => {
    const completeHistory = Array.from({ length: DAILY_MISSION_REQUIRED_SETS }, () =>
      entry({ mode: 'spatial', level: 2 }),
    )
    checkAndRecordDailyMissionCompletion(
      completeHistory.slice(0, -1),
      completeHistory,
      target,
      NOW,
    )
    const again = checkAndRecordDailyMissionCompletion(
      completeHistory,
      [...completeHistory, entry({ mode: 'spatial', level: 2 })],
      target,
      NOW,
    )
    expect(again).toBe(false)
    expect(loadMissionCompletions()).toHaveLength(1)
  })

  it('returns false when the required count has not yet been reached', () => {
    const before = Array.from({ length: DAILY_MISSION_REQUIRED_SETS - 2 }, () =>
      entry({ mode: 'spatial', level: 2 }),
    )
    const after = [...before, entry({ mode: 'spatial', level: 2 })]
    expect(checkAndRecordDailyMissionCompletion(before, after, target, NOW)).toBe(false)
    expect(loadMissionCompletions()).toHaveLength(0)
  })
})
