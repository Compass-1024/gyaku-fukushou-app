import { describe, expect, it } from 'vitest'
import { buildRandomRounds, RANDOM_ROUNDS_PER_SET } from './random'
import type { HistoryEntry } from '../types'

describe('buildRandomRounds', () => {
  it('generates 5 rounds', () => {
    expect(buildRandomRounds(1)).toHaveLength(RANDOM_ROUNDS_PER_SET)
  })

  it('includes exactly one round of each of the 5 sources (digit×2 game types + spatial/pattern/tone, no duplicates)', () => {
    const rounds = buildRandomRounds(2)
    const modes = rounds.map((r) => r.mode).sort()
    expect(modes).toEqual(['digit', 'digit', 'pattern', 'spatial', 'tone'])
    const digitGameTypes = rounds
      .filter((r) => r.mode === 'digit')
      .map((r) => r.gameType)
      .sort()
    expect(digitGameTypes).toEqual(['reverse', 'sum'])
  })

  it('④-2: weakPointFocus overrides the selected level with the weakest per-mode level', () => {
    const history: HistoryEntry[] = [
      // digit-reverse: レベル1が0%、レベル3が100% -> 弱点重視ならレベル1(3桁)を選ぶはず
      { mode: 'digit', gameType: 'reverse', level: 1, correct: 0, total: 5, timestamp: '2026-01-01T00:00:00.000Z' },
      { mode: 'digit', gameType: 'reverse', level: 3, correct: 5, total: 5, timestamp: '2026-01-01T00:00:00.000Z' },
    ]
    const rounds = buildRandomRounds(3, { history })
    const digitReverse = rounds.find((r) => r.mode === 'digit' && r.gameType === 'reverse')
    expect(digitReverse?.mode).toBe('digit')
    if (digitReverse?.mode === 'digit') {
      expect(digitReverse.question.digits).toHaveLength(3) // レベル1の桁数
    }
  })

  it('④-2: falls back to the selected level when there is no history for a mode', () => {
    const rounds = buildRandomRounds(3, { history: [] })
    const digitReverse = rounds.find((r) => r.mode === 'digit' && r.gameType === 'reverse')
    if (digitReverse?.mode === 'digit') {
      expect(digitReverse.question.digits).toHaveLength(7) // レベル3の桁数
    }
  })
})
