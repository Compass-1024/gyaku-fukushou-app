import { describe, expect, it, beforeEach } from 'vitest'
import {
  getWeeklyRecap,
  getLastShownRecapWeekKey,
  markRecapShown,
} from './recap'
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

function entry(timestamp: string, correct = 2, total = 3): HistoryEntry {
  return { mode: 'word', level: 1, correct, total, timestamp }
}

// 基準日: 2026-08-05（水）。先週 = 2026-07-27（月）〜2026-08-02（日）
const REFERENCE = new Date('2026-08-05T12:00:00+09:00')

describe('getWeeklyRecap', () => {
  it('returns null when there is no data for last week', () => {
    expect(getWeeklyRecap([], REFERENCE)).toBeNull()
  })

  it('aggregates sets and accuracy for the most recently completed week', () => {
    const history: HistoryEntry[] = [
      entry('2026-07-28T10:00:00+09:00', 3, 3), // 先週火曜
      entry('2026-07-30T10:00:00+09:00', 1, 3), // 先週木曜
    ]
    const recap = getWeeklyRecap(history, REFERENCE)
    expect(recap).not.toBeNull()
    expect(recap?.totalSets).toBe(2)
    expect(recap?.accuracyPercent).toBe(67) // (3+1)/(3+3) = 66.6...% → 67%
  })

  it('excludes entries from this week and from two weeks ago', () => {
    const history: HistoryEntry[] = [
      entry('2026-08-04T10:00:00+09:00', 3, 3), // 今週（対象外）
      entry('2026-07-29T10:00:00+09:00', 3, 3), // 先週（対象）
      entry('2026-07-20T10:00:00+09:00', 3, 3), // 先々週（対象外、比較用カウントのみ）
    ]
    const recap = getWeeklyRecap(history, REFERENCE)
    expect(recap?.totalSets).toBe(1)
    expect(recap?.previousWeekSets).toBe(1)
  })

  it('computes the previous week set count for comparison', () => {
    const history: HistoryEntry[] = [
      entry('2026-07-29T10:00:00+09:00'), // 先週
      entry('2026-07-20T10:00:00+09:00'), // 先々週
      entry('2026-07-21T10:00:00+09:00'), // 先々週
    ]
    const recap = getWeeklyRecap(history, REFERENCE)
    expect(recap?.previousWeekSets).toBe(2)
  })
})

describe('getLastShownRecapWeekKey / markRecapShown', () => {
  it('returns null before anything has been marked', () => {
    expect(getLastShownRecapWeekKey()).toBeNull()
  })

  it('persists the marked week key', () => {
    markRecapShown('2026-07-27')
    expect(getLastShownRecapWeekKey()).toBe('2026-07-27')
  })
})
