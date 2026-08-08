import { describe, expect, it } from 'vitest'
import {
  generateNBackSequence,
  scoreNBackTrials,
  getNValue,
  GRID_SIZE,
  DEFAULT_TRIAL_COUNT,
} from './nback'
import type { NBackTrial } from '../types'

describe('getNValue', () => {
  it('maps level to the correct N-back distance', () => {
    expect(getNValue(1)).toBe(1)
    expect(getNValue(2)).toBe(2)
    expect(getNValue(3)).toBe(3)
  })
})

describe('generateNBackSequence', () => {
  it('generates a sequence of the requested length with valid grid positions', () => {
    for (const level of [1, 2, 3] as const) {
      const trials = generateNBackSequence(level, 10)
      expect(trials).toHaveLength(10)
      for (const t of trials) {
        expect(t.position).toBeGreaterThanOrEqual(0)
        expect(t.position).toBeLessThan(GRID_SIZE * GRID_SIZE)
      }
    }
  })

  it('defaults to DEFAULT_TRIAL_COUNT when no count is given', () => {
    expect(generateNBackSequence(1)).toHaveLength(DEFAULT_TRIAL_COUNT)
  })

  it('never marks a match within the first N positions', () => {
    const trials = generateNBackSequence(3, 10)
    for (let i = 0; i < 3; i++) {
      expect(trials[i].isMatch).toBe(false)
    }
  })

  it('correctly labels isMatch against the true N-back distance', () => {
    const level = 2
    const n = getNValue(level)
    const trials = generateNBackSequence(level, 10)
    trials.forEach((trial, i) => {
      if (i < n) {
        expect(trial.isMatch).toBe(false)
      } else {
        expect(trial.isMatch).toBe(trial.position === trials[i - n].position)
      }
    })
  })
})

describe('scoreNBackTrials', () => {
  it('scores hits, misses, false alarms, and correct rejections', () => {
    const trials: NBackTrial[] = [
      { position: 1, isMatch: false },
      { position: 2, isMatch: true },
      { position: 3, isMatch: true },
      { position: 4, isMatch: false },
    ]
    // trial0: no match, no press -> correct rejection
    // trial1: match, pressed -> hit
    // trial2: match, not pressed -> miss
    // trial3: no match, pressed -> false alarm
    const pressed = [false, true, false, true]
    const score = scoreNBackTrials(trials, pressed)
    expect(score).toEqual({
      hits: 1,
      misses: 1,
      falseAlarms: 1,
      correctRejections: 1,
      accuracy: 50,
    })
  })

  it('gives 100% accuracy for a perfect run', () => {
    const trials: NBackTrial[] = [
      { position: 1, isMatch: false },
      { position: 2, isMatch: true },
    ]
    const score = scoreNBackTrials(trials, [false, true])
    expect(score.accuracy).toBe(100)
  })

  it('handles an empty trial list', () => {
    expect(scoreNBackTrials([], [])).toEqual({
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejections: 0,
      accuracy: 0,
    })
  })
})
