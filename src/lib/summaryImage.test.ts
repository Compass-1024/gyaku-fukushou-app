import { describe, expect, it } from 'vitest'
import { summaryImageFileName } from './summaryImage'

describe('summaryImageFileName', () => {
  it('formats as gyaku-fukushou-summary-<period>-YYYYMMDD.png', () => {
    expect(summaryImageFileName('week', new Date(2026, 7, 1))).toBe(
      'gyaku-fukushou-summary-week-20260801.png',
    )
    expect(summaryImageFileName('month', new Date(2026, 7, 1))).toBe(
      'gyaku-fukushou-summary-month-20260801.png',
    )
  })
})
