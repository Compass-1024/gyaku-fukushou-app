import { describe, expect, it } from 'vitest'
import { buildRandomRounds, RANDOM_ROUNDS_PER_SET } from './random'

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
})
