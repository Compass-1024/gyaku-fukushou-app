import { describe, expect, it, beforeEach } from 'vitest'
import {
  MISSION_DEFINITIONS,
  getTodayMission,
  isTodayMissionComplete,
  hasRecordedTodayCompletion,
  checkAndRecordMissionCompletion,
  loadMissionCompletions,
} from './missions'
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

function entry(mode: HistoryEntry['mode'], timestamp: string): HistoryEntry {
  return { mode, level: 1, correct: 1, total: 1, timestamp }
}

describe('getTodayMission', () => {
  it('is deterministic for the same date', () => {
    const now = new Date('2026-08-06T12:00:00')
    expect(getTodayMission('ja', now).id).toBe(getTodayMission('ja', now).id)
  })

  it('excludes word-mode missions for the English locale', () => {
    for (let day = 1; day <= 31; day++) {
      const now = new Date(2026, 0, day)
      const mission = getTodayMission('en', now)
      expect(mission.requiresWordMode).toBeFalsy()
    }
  })

  it('always returns a mission from the defined pool', () => {
    const now = new Date('2026-08-06T12:00:00')
    const mission = getTodayMission('ja', now)
    expect(MISSION_DEFINITIONS.map((m) => m.id)).toContain(mission.id)
  })
})

describe('isTodayMissionComplete', () => {
  it('is false with no history today', () => {
    const now = new Date('2026-08-06T12:00:00')
    expect(isTodayMissionComplete([], 'ja', now)).toBe(false)
  })

  it('ignores entries from other days', () => {
    const now = new Date('2026-08-06T12:00:00')
    const spec = getTodayMission('ja', now).spec
    if (spec.kind !== 'playCount') return
    const history = Array.from({ length: spec.count }, () =>
      entry(spec.mode, '2026-08-01T12:00:00'),
    )
    expect(isTodayMissionComplete(history, 'ja', now)).toBe(false)
  })

  it('is true once the playCount threshold is met today', () => {
    const now = new Date('2026-08-06T12:00:00')
    const spec = getTodayMission('ja', now).spec
    if (spec.kind !== 'playCount') return
    const history = Array.from({ length: spec.count }, () =>
      entry(spec.mode, now.toISOString()),
    )
    expect(isTodayMissionComplete(history, 'ja', now)).toBe(true)
  })
})

describe('checkAndRecordMissionCompletion / hasRecordedTodayCompletion', () => {
  it('records a completion once and does not double-count on repeat calls', () => {
    const now = new Date('2026-08-06T12:00:00')
    const spec = getTodayMission('ja', now).spec
    if (spec.kind !== 'playCount') return
    const history = Array.from({ length: spec.count }, () =>
      entry(spec.mode, now.toISOString()),
    )

    expect(hasRecordedTodayCompletion(loadMissionCompletions(), 'ja', now)).toBe(false)
    expect(checkAndRecordMissionCompletion(history, 'ja', now)).toBe(1)
    expect(hasRecordedTodayCompletion(loadMissionCompletions(), 'ja', now)).toBe(true)
    // 既に記録済みなので2回目は0
    expect(checkAndRecordMissionCompletion(history, 'ja', now)).toBe(0)
  })
})
