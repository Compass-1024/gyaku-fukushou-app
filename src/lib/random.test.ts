import { describe, expect, it } from 'vitest'
import { buildRandomRounds, RANDOM_ROUNDS_PER_SET, ROUND_COUNT_OPTIONS } from './random'
import type { HistoryEntry } from '../types'

describe('buildRandomRounds', () => {
  it('defaults to 5 rounds', () => {
    expect(buildRandomRounds(1)).toHaveLength(RANDOM_ROUNDS_PER_SET)
  })

  it('includes exactly one round of each of the 5 sources at the default count (digit×2 game types + spatial/pattern/tone, no duplicates)', () => {
    const rounds = buildRandomRounds(2, 5)
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
    const rounds = buildRandomRounds(3, 5, { history })
    const digitReverse = rounds.find((r) => r.mode === 'digit' && r.gameType === 'reverse')
    expect(digitReverse?.mode).toBe('digit')
    if (digitReverse?.mode === 'digit') {
      expect(digitReverse.question.digits).toHaveLength(3) // レベル1の桁数
    }
  })

  it('④-2: falls back to the selected level when there is no history for a mode', () => {
    const rounds = buildRandomRounds(3, 5, { history: [] })
    const digitReverse = rounds.find((r) => r.mode === 'digit' && r.gameType === 'reverse')
    if (digitReverse?.mode === 'digit') {
      expect(digitReverse.question.digits).toHaveLength(7) // レベル3の桁数
    }
  })

  it('excludeに渡した問題を避けて出題する（モードを途中でやめて再挑戦した際、同じ問題が出ないようにする）', () => {
    for (let i = 0; i < 50; i++) {
      const rounds = buildRandomRounds(1, 5, undefined, {
        digit: [[1, 2, 3]],
        spatial: [[0, 1, 2]],
        pattern: [[0, 1, 4, 5]],
        tone: [[0, 0, 1]],
      })
      for (const round of rounds) {
        switch (round.mode) {
          case 'digit':
            expect(round.question.digits).not.toEqual([1, 2, 3])
            break
          case 'spatial':
            expect(round.question.sequence).not.toEqual([0, 1, 2])
            break
          case 'pattern':
            expect([...round.question.filledCells].sort((a, b) => a - b)).not.toEqual([
              0, 1, 4, 5,
            ])
            break
          case 'tone':
            expect(round.question.sequence).not.toEqual([0, 0, 1])
            break
        }
      }
    }
  })

  describe('enabledTypes（出題するモードを選ぶ機能）', () => {
    it('選んだ種類のみが出題される', () => {
      const rounds = buildRandomRounds(1, 5, undefined, undefined, ['spatial', 'tone'])
      for (const round of rounds) {
        expect(['spatial', 'tone']).toContain(round.mode)
      }
    })

    it('選択した種類の数がroundCountより少ない場合は超過分だけ重複する', () => {
      const rounds = buildRandomRounds(1, 5, undefined, undefined, ['spatial'])
      expect(rounds).toHaveLength(5)
      for (const round of rounds) {
        expect(round.mode).toBe('spatial')
      }
    })

    it('選択した種類の数がroundCount以上なら重複しない', () => {
      const rounds = buildRandomRounds(1, 3, undefined, undefined, ['spatial', 'tone', 'pattern'])
      const modes = rounds.map((r) => r.mode)
      expect(new Set(modes).size).toBe(3)
    })

    it('空配列（すべて選択解除）が渡された場合は全種類にフォールバックする', () => {
      const rounds = buildRandomRounds(1, 5, undefined, undefined, [])
      const modes = new Set(rounds.map((r) => r.mode))
      expect(modes.size).toBeGreaterThan(1)
    })

    it('未指定時は従来どおり全5種類が候補になる', () => {
      const rounds = buildRandomRounds(1, 7)
      const keys = new Set(
        rounds.map((r) => (r.mode === 'digit' ? `${r.mode}-${r.gameType}` : r.mode)),
      )
      expect(keys.size).toBe(5)
    })
  })

  describe('roundCount', () => {
    for (const count of ROUND_COUNT_OPTIONS) {
      it(`generates exactly ${count} rounds`, () => {
        expect(buildRandomRounds(1, count)).toHaveLength(count)
      })
    }

    it('3問では5種類の候補から重複無く3種類を選ぶ', () => {
      const rounds = buildRandomRounds(1, 3)
      const keys = rounds.map((r) => (r.mode === 'digit' ? `${r.mode}-${r.gameType}` : r.mode))
      expect(new Set(keys).size).toBe(3)
    })

    it('7問では5種類全てを含み、超過分だけ重複しうる', () => {
      const rounds = buildRandomRounds(1, 7)
      const keys = rounds.map((r) => (r.mode === 'digit' ? `${r.mode}-${r.gameType}` : r.mode))
      const uniqueKeys = new Set(keys)
      // 候補は5種類しかないため、7問なら最低5種類は含まれ、7種類にはなり得ない
      expect(uniqueKeys.size).toBeGreaterThanOrEqual(5)
      expect(uniqueKeys.size).toBeLessThanOrEqual(5)
      for (const source of ['digit-reverse', 'digit-sum', 'spatial', 'pattern', 'tone']) {
        expect(uniqueKeys.has(source)).toBe(true)
      }
    })
  })
})
