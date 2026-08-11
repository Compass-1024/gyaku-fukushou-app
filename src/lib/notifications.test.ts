import { describe, expect, it, beforeEach } from 'vitest'
import { getAchievementUnlockLog, getCombinedNotificationLog, findMissionDefinition } from './notifications'
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

describe('getAchievementUnlockLog', () => {
  it('records first-session as unlocked at the very first entry', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: '2026-01-01T00:00:00.000Z' },
      { mode: 'word', level: 1, correct: 2, total: 3, timestamp: '2026-01-02T00:00:00.000Z' },
    ]
    const log = getAchievementUnlockLog(history, 0)
    const firstSession = log.find((e) => e.achievementId === 'first-session')
    expect(firstSession?.timestamp).toBe('2026-01-01T00:00:00.000Z')
  })

  it('records perfect-score at the entry with a full-correct set', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: '2026-01-01T00:00:00.000Z' },
      { mode: 'word', level: 1, correct: 3, total: 3, timestamp: '2026-01-02T00:00:00.000Z' },
    ]
    const log = getAchievementUnlockLog(history, 0)
    const perfect = log.find((e) => e.achievementId === 'perfect-score')
    expect(perfect?.timestamp).toBe('2026-01-02T00:00:00.000Z')
  })

  it('does not include achievements that are never unlocked', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: '2026-01-01T00:00:00.000Z' },
    ]
    const log = getAchievementUnlockLog(history, 0)
    expect(log.find((e) => e.achievementId === 'level-3-digit')).toBeUndefined()
  })
})

describe('findMissionDefinition', () => {
  it('finds a mission by id', () => {
    expect(findMissionDefinition('digit-2')?.spec).toEqual({
      kind: 'playCount',
      mode: 'digit',
      count: 2,
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(findMissionDefinition('unknown-id')).toBeUndefined()
  })
})

describe('getCombinedNotificationLog', () => {
  it('merges achievement and mission entries sorted newest first', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: '2026-01-05T00:00:00.000Z' },
    ]
    localStorage.setItem(
      'gyaku-fukushou:missionCompletions',
      JSON.stringify([{ dateKey: '2026-01-05', missionId: 'digit-2' }]),
    )
    const log = getCombinedNotificationLog(history, 1, new Date('2026-01-06T00:00:00.000Z'))
    expect(log[0]).toEqual({ kind: 'mission', missionId: 'digit-2', dateKey: '2026-01-05' })
    expect(log.some((e) => e.kind === 'achievement' && e.achievementId === 'first-session')).toBe(
      true,
    )
  })

  it('excludes entries older than 3 days from now（統計画面のシンプル化）', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 1, total: 3, timestamp: '2026-01-01T00:00:00.000Z' },
    ]
    localStorage.setItem(
      'gyaku-fukushou:missionCompletions',
      JSON.stringify([{ dateKey: '2026-01-01', missionId: 'digit-2' }]),
    )
    // 5日後（3日超過）を「今」として判定すると両方とも除外される
    const log = getCombinedNotificationLog(history, 1, new Date('2026-01-06T00:00:00.000Z'))
    expect(log).toEqual([])
  })
})
