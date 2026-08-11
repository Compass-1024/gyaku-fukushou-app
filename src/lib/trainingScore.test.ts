import { describe, expect, it } from 'vitest'
import { getTrainingScores } from './trainingScore'
import type { HistoryEntry } from '../types'

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    mode: 'spatial',
    level: 2,
    correct: 2,
    total: 3,
    timestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getTrainingScores', () => {
  it('returns null scores for every category when history is empty', () => {
    const scores = getTrainingScores([], 'ja')
    expect(scores.overall.score).toBeNull()
    expect(scores.numeric.score).toBeNull()
    expect(scores.spatial.score).toBeNull()
    expect(scores.attention.score).toBeNull()
  })

  it('groups modes into the expected categories', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'word', correct: 3, total: 3, timestamp: '2026-01-01T00:00:00.000Z' }),
      entry({
        mode: 'digit',
        gameType: 'reverse',
        correct: 3,
        total: 3,
        timestamp: '2026-01-02T00:00:00.000Z',
      }),
      entry({ mode: 'spatial', correct: 3, total: 3, timestamp: '2026-01-03T00:00:00.000Z' }),
      entry({ mode: 'pattern', correct: 3, total: 3, timestamp: '2026-01-04T00:00:00.000Z' }),
      entry({ mode: 'tone', correct: 3, total: 3, timestamp: '2026-01-05T00:00:00.000Z' }),
      entry({
        mode: 'dual-nback',
        correct: 3,
        total: 3,
        timestamp: '2026-01-06T00:00:00.000Z',
      }),
    ]
    const scores = getTrainingScores(history, 'ja')
    // 数字記憶: word+digit-reverseの2件で前半/後半に十分な件数が無いため、
    // 全体の正答率（100%）がそのままscoreになりpreviousScoreはnull
    expect(scores.numeric.score).toBe(100)
    expect(scores.numeric.previousScore).toBeNull()
    // 空間記憶: spatial+patternの2件も同様
    expect(scores.spatial.score).toBe(100)
    // 注意制御: tone+dual-nbackの2件も同様
    expect(scores.attention.score).toBe(100)
    // 総合: 全6件の正答率
    expect(scores.overall.score).toBe(100)
  })

  it('splits into earlier/later halves and computes a delta once enough attempts exist', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'spatial', correct: 0, total: 3, timestamp: '2026-01-01T00:00:00.000Z' }),
      entry({ mode: 'spatial', correct: 0, total: 3, timestamp: '2026-01-02T00:00:00.000Z' }),
      entry({ mode: 'spatial', correct: 3, total: 3, timestamp: '2026-01-03T00:00:00.000Z' }),
      entry({ mode: 'spatial', correct: 3, total: 3, timestamp: '2026-01-04T00:00:00.000Z' }),
    ]
    const scores = getTrainingScores(history, 'ja')
    expect(scores.spatial.previousScore).toBe(0)
    expect(scores.spatial.score).toBe(100)
    expect(scores.spatial.delta).toBe(100)
  })

  it('excludes word mode from the numeric category for the English UI', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'word', correct: 0, total: 3, timestamp: '2026-01-01T00:00:00.000Z' }),
    ]
    const scores = getTrainingScores(history, 'en')
    expect(scores.numeric.score).toBeNull()
  })

  it('random mode counts toward the attention category and the overall score', () => {
    const history: HistoryEntry[] = [
      entry({ mode: 'random', correct: 4, total: 5, timestamp: '2026-01-01T00:00:00.000Z' }),
    ]
    const scores = getTrainingScores(history, 'ja')
    expect(scores.attention.score).toBe(80)
    expect(scores.overall.score).toBe(80)
  })
})
