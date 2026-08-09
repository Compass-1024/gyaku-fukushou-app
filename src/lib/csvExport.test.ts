import { describe, expect, it } from 'vitest'
import { buildHistoryCsv, historyCsvFileName } from './csvExport'
import type { HistoryEntry } from '../types'

describe('buildHistoryCsv', () => {
  it('includes a header row', () => {
    const csv = buildHistoryCsv([])
    expect(csv).toBe('timestamp,mode,gameType,level,correct,total,accuracyPercent')
  })

  it('formats each history entry as a CSV row with computed accuracy', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 2, total: 3, timestamp: '2026-08-01T00:00:00.000Z' },
      {
        mode: 'digit',
        gameType: 'reverse',
        level: 2,
        correct: 5,
        total: 5,
        timestamp: '2026-08-01T01:00:00.000Z',
      },
    ]
    const rows = buildHistoryCsv(history).split('\n')
    expect(rows).toHaveLength(3)
    expect(rows[1]).toBe('2026-08-01T00:00:00.000Z,word,,1,2,3,67')
    expect(rows[2]).toBe('2026-08-01T01:00:00.000Z,digit,reverse,2,5,5,100')
  })

  it('leaves accuracy blank when total is 0', () => {
    const history: HistoryEntry[] = [
      { mode: 'word', level: 1, correct: 0, total: 0, timestamp: '2026-08-01T00:00:00.000Z' },
    ]
    const rows = buildHistoryCsv(history).split('\n')
    expect(rows[1]).toBe('2026-08-01T00:00:00.000Z,word,,1,0,0,')
  })
})

describe('historyCsvFileName', () => {
  it('formats as gyaku-fukushou-history-YYYYMMDD.csv', () => {
    expect(historyCsvFileName(new Date(2026, 7, 1))).toBe(
      'gyaku-fukushou-history-20260801.csv',
    )
  })
})
