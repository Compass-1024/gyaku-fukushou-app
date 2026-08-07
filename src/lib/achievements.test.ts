import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENTS,
  getUnlockedCount,
  getNewlyUnlockedAchievements,
} from './achievements'
import type { HistoryEntry } from '../types'

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    mode: 'word',
    level: 1,
    correct: 1,
    total: 3,
    timestamp: new Date().toISOString(),
    ...overrides,
  }
}

function findAchievement(id: string) {
  const a = ACHIEVEMENTS.find((x) => x.id === id)
  if (!a) throw new Error(`achievement ${id} not found`)
  return a
}

describe('achievements', () => {
  it('nothing is unlocked with empty history', () => {
    expect(getUnlockedCount([])).toBe(0)
  })

  it('first-session unlocks after one entry', () => {
    expect(findAchievement('first-session').isUnlocked([entry()])).toBe(true)
  })

  it('perfect-score requires a fully correct set', () => {
    const perfect = findAchievement('perfect-score')
    expect(perfect.isUnlocked([entry({ correct: 2, total: 3 })])).toBe(false)
    expect(perfect.isUnlocked([entry({ correct: 3, total: 3 })])).toBe(true)
  })

  it('level-3 achievements require the matching mode and level', () => {
    const wordLv3 = findAchievement('level-3-word')
    expect(wordLv3.isUnlocked([entry({ mode: 'word', level: 2 })])).toBe(false)
    expect(wordLv3.isUnlocked([entry({ mode: 'word', level: 3 })])).toBe(true)
    expect(wordLv3.isUnlocked([entry({ mode: 'digit', level: 3 })])).toBe(
      false,
    )
  })

  it('all-modes requires word, digit, and nback entries', () => {
    const allModes = findAchievement('all-modes')
    expect(
      allModes.isUnlocked([entry({ mode: 'word' }), entry({ mode: 'digit' })]),
    ).toBe(false)
    expect(
      allModes.isUnlocked([
        entry({ mode: 'word' }),
        entry({ mode: 'digit' }),
        entry({ mode: 'nback' }),
      ]),
    ).toBe(true)
  })

  it('level-3 achievements exist for the three new modes', () => {
    expect(
      findAchievement('level-3-spatial').isUnlocked([
        entry({ mode: 'spatial', level: 3 }),
      ]),
    ).toBe(true)
    expect(
      findAchievement('level-3-pattern').isUnlocked([
        entry({ mode: 'pattern', level: 3 }),
      ]),
    ).toBe(true)
    expect(
      findAchievement('level-3-tone').isUnlocked([
        entry({ mode: 'tone', level: 3 }),
      ]),
    ).toBe(true)
  })

  it('all-six-modes requires all six modes to have been attempted', () => {
    const allSix = findAchievement('all-six-modes')
    expect(
      allSix.isUnlocked([
        entry({ mode: 'word' }),
        entry({ mode: 'digit' }),
        entry({ mode: 'nback' }),
        entry({ mode: 'spatial' }),
        entry({ mode: 'pattern' }),
      ]),
    ).toBe(false)
    expect(
      allSix.isUnlocked([
        entry({ mode: 'word' }),
        entry({ mode: 'digit' }),
        entry({ mode: 'nback' }),
        entry({ mode: 'spatial' }),
        entry({ mode: 'pattern' }),
        entry({ mode: 'tone' }),
      ]),
    ).toBe(true)
  })

  it('total-10 requires at least 10 sessions', () => {
    const total10 = findAchievement('total-10')
    const nine = Array.from({ length: 9 }, () => entry())
    expect(total10.isUnlocked(nine)).toBe(false)
    expect(total10.isUnlocked([...nine, entry()])).toBe(true)
  })

  it('growing-strong requires 2+ modes improving in "ワーキングメモリの伸び"', () => {
    const growing = findAchievement('growing-strong')
    const now = Date.now()
    function improvingModeEntries(mode: HistoryEntry['mode']): HistoryEntry[] {
      return [
        // 古い方: 正答率33%
        ...Array.from({ length: 2 }, (_, i) =>
          entry({
            mode,
            correct: 1,
            total: 3,
            timestamp: new Date(now - (20 - i) * 3600_000).toISOString(),
          }),
        ),
        // 新しい方: 正答率100%
        ...Array.from({ length: 2 }, (_, i) =>
          entry({
            mode,
            correct: 3,
            total: 3,
            timestamp: new Date(now - (5 - i) * 3600_000).toISOString(),
          }),
        ),
      ]
    }
    // 1モードのみ向上中では解除されない
    expect(growing.isUnlocked(improvingModeEntries('spatial'))).toBe(false)
    // 2モード向上中なら解除される
    expect(
      growing.isUnlocked([
        ...improvingModeEntries('spatial'),
        ...improvingModeEntries('nback'),
      ]),
    ).toBe(true)
  })

  it('all-modes-mastered requires level 3 in all eight modes', () => {
    const mastered = findAchievement('all-modes-mastered')
    const sevenModes = (
      ['word', 'digit', 'nback', 'dual-nback', 'spatial', 'pattern', 'tone'] as const
    ).map((mode) => entry({ mode, level: 3 }))
    expect(mastered.isUnlocked(sevenModes)).toBe(false)
    expect(
      mastered.isUnlocked([...sevenModes, entry({ mode: 'random', level: 3 })]),
    ).toBe(true)
  })
})

describe('getNewlyUnlockedAchievements', () => {
  it('returns nothing when no new achievement was unlocked', () => {
    const before = [entry()]
    const after = [entry(), entry()]
    // 両方とも first-session はすでに解除済みなので新規はない
    expect(getNewlyUnlockedAchievements(before, after)).toEqual([])
  })

  it('returns achievements unlocked only in the after state', () => {
    const before: HistoryEntry[] = []
    const after = [entry({ correct: 3, total: 3 })]
    const newly = getNewlyUnlockedAchievements(before, after)
    const ids = newly.map((a) => a.id)
    expect(ids).toContain('first-session')
    expect(ids).toContain('perfect-score')
  })

  it('does not re-report an achievement already unlocked before', () => {
    const before = [entry({ correct: 3, total: 3 })]
    const after = [...before, entry({ correct: 3, total: 3 })]
    expect(getNewlyUnlockedAchievements(before, after)).toEqual([])
  })
})
