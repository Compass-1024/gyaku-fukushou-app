import { describe, expect, it } from 'vitest'
import { getRollingProgramProgress, PROGRAM_LENGTH_DAYS } from './program'
import { localDateKey } from './history'
import type { HistoryEntry } from '../types'

function entryOnDay(daysAgo: number, now: Date): HistoryEntry {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return { mode: 'digit', gameType: 'reverse', level: 1, correct: 1, total: 1, timestamp: d.toISOString() }
}

function dateKeyDaysAgo(daysAgo: number, now: Date): string {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return localDateKey(d)
}

describe('getRollingProgramProgress', () => {
  const now = new Date('2026-01-15T12:00:00.000Z')

  it('counts 0 played days with empty history', () => {
    const progress = getRollingProgramProgress([], now)
    expect(progress).toEqual({ daysPlayed: 0, totalDays: PROGRAM_LENGTH_DAYS, isComplete: false })
  })

  it('counts distinct days within the last 7 days, ignoring older entries and duplicate days', () => {
    const history = [
      entryOnDay(0, now),
      entryOnDay(0, now), // 同じ日に2セット -> 重複はカウントしない
      entryOnDay(1, now),
      entryOnDay(10, now), // ウィンドウ外
    ]
    const progress = getRollingProgramProgress(history, now)
    expect(progress.daysPlayed).toBe(2)
    expect(progress.isComplete).toBe(false)
  })

  it('is complete once all 7 days in the window have at least one set', () => {
    const history = Array.from({ length: 7 }, (_, i) => entryOnDay(i, now))
    const progress = getRollingProgramProgress(history, now)
    expect(progress).toEqual({ daysPlayed: 7, totalDays: 7, isComplete: true })
  })

  it('fix③-5: counts extraPlayedDateKeys (e.g. daily challenge) toward the window', () => {
    const extra = new Set([dateKeyDaysAgo(0, now)])
    const progress = getRollingProgramProgress([], now, extra)
    expect(progress.daysPlayed).toBe(1)
  })

  it('fix③-5: ignores extraPlayedDateKeys outside the rolling window', () => {
    const extra = new Set([dateKeyDaysAgo(10, now)])
    const progress = getRollingProgramProgress([], now, extra)
    expect(progress.daysPlayed).toBe(0)
  })

  it('fix③-5: merges history days and extraPlayedDateKeys without double-counting the same day', () => {
    const history = [entryOnDay(0, now)]
    const extra = new Set([dateKeyDaysAgo(0, now), dateKeyDaysAgo(1, now)])
    const progress = getRollingProgramProgress(history, now, extra)
    expect(progress.daysPlayed).toBe(2)
  })
})
