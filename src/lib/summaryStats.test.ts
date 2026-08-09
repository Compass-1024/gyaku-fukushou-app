import { describe, expect, it } from 'vitest'
import { computeLearningSummary, summaryDateRangeLabel } from './summaryStats'
import type { HistoryEntry } from '../types'

function entry(mode: HistoryEntry['mode'], daysAgo: number, correct = 4, total = 5): HistoryEntry {
  const now = new Date(2026, 2, 20, 12, 0, 0)
  const timestamp = new Date(now)
  timestamp.setDate(timestamp.getDate() - daysAgo)
  return { mode, level: 1, correct, total, timestamp: timestamp.toISOString() }
}

const NOW = new Date(2026, 2, 20, 12, 0, 0)

describe('computeLearningSummary', () => {
  it('counts only entries within the period window', () => {
    const history: HistoryEntry[] = [
      entry('digit', 1),
      entry('digit', 6),
      entry('digit', 8), // 週間(7日)には含まれない
      entry('digit', 29), // 月間(30日)には含まれる
      entry('digit', 31), // どちらにも含まれない
    ]
    const week = computeLearningSummary(history, 'week', NOW)
    const month = computeLearningSummary(history, 'month', NOW)
    expect(week.totalSets).toBe(2)
    expect(month.totalSets).toBe(4)
  })

  it('computes accuracy percent from correct/total sums', () => {
    const history: HistoryEntry[] = [entry('digit', 1, 3, 5), entry('digit', 2, 5, 5)]
    const summary = computeLearningSummary(history, 'week', NOW)
    expect(summary.accuracyPercent).toBe(80)
  })

  it('returns null accuracy when there are no attempts in range', () => {
    const summary = computeLearningSummary([], 'week', NOW)
    expect(summary.accuracyPercent).toBeNull()
    expect(summary.totalSets).toBe(0)
    expect(summary.topModes).toEqual([])
  })

  it('ranks top modes by sets played, descending', () => {
    const history: HistoryEntry[] = [
      entry('digit', 1),
      entry('digit', 2),
      entry('spatial', 3),
    ]
    const summary = computeLearningSummary(history, 'week', NOW)
    expect(summary.topModes).toEqual([
      { mode: 'digit', sets: 2 },
      { mode: 'spatial', sets: 1 },
    ])
  })
})

describe('summaryDateRangeLabel', () => {
  it('formats a YYYY/MM/DD - YYYY/MM/DD range', () => {
    expect(summaryDateRangeLabel(NOW, 7)).toBe('2026/03/14 - 2026/03/20')
  })
})
