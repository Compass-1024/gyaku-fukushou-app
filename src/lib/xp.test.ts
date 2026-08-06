import { describe, expect, it } from 'vitest'
import { computeHistoryXp, computeTotalXp, getXpProgress } from './xp'
import type { HistoryEntry } from '../types'

function entry(correct: number, total: number): HistoryEntry {
  return { mode: 'digit', level: 1, correct, total, timestamp: new Date().toISOString() }
}

describe('computeHistoryXp', () => {
  it('awards 10xp per correct answer', () => {
    expect(computeHistoryXp([entry(2, 3)])).toBe(20)
  })

  it('adds a 50xp bonus for a perfect set', () => {
    expect(computeHistoryXp([entry(3, 3)])).toBe(3 * 10 + 50)
  })

  it('does not award a bonus for total=0 (no perfect set possible)', () => {
    expect(computeHistoryXp([entry(0, 0)])).toBe(0)
  })

  it('sums across multiple entries', () => {
    expect(computeHistoryXp([entry(3, 3), entry(1, 3)])).toBe(3 * 10 + 50 + 1 * 10)
  })
})

describe('computeTotalXp', () => {
  it('adds mission bonus xp on top of history xp', () => {
    expect(computeTotalXp([entry(2, 3)], 2)).toBe(20 + 2 * 100)
  })
})

describe('getXpProgress', () => {
  it('starts at level 1 with 0 xp', () => {
    expect(getXpProgress(0)).toEqual({
      level: 1,
      currentLevelXp: 0,
      xpToNextLevel: 100,
      xpForCurrentLevel: 100,
    })
  })

  it('reaches level 2 at exactly 100xp', () => {
    expect(getXpProgress(100).level).toBe(2)
  })

  it('reaches level 3 at exactly 250xp (100+150)', () => {
    expect(getXpProgress(250).level).toBe(3)
  })

  it('reaches level 4 at exactly 450xp (250+200)', () => {
    expect(getXpProgress(450).level).toBe(4)
  })

  it('reaches level 5 at exactly 700xp (450+250)', () => {
    expect(getXpProgress(700).level).toBe(5)
  })

  it('tracks progress within the current level', () => {
    const progress = getXpProgress(120)
    expect(progress.level).toBe(2)
    expect(progress.currentLevelXp).toBe(20)
    expect(progress.xpToNextLevel).toBe(130)
  })
})
