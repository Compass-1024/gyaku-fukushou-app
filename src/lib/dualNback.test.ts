import { describe, expect, it } from 'vitest'
import {
  generateDualNBackSequence,
  scoreDualNBackTrials,
  getDualNValue,
  DEFAULT_TRIAL_COUNT,
  GRID_SIZE,
  SOUND_COUNT,
} from './dualNback'

describe('generateDualNBackSequence', () => {
  it('defaults to DEFAULT_TRIAL_COUNT when no count is given', () => {
    expect(generateDualNBackSequence(1)).toHaveLength(DEFAULT_TRIAL_COUNT)
  })

  it('generates the requested number of trials', () => {
    expect(generateDualNBackSequence(1, 10)).toHaveLength(10)
  })

  it('keeps positions and sounds within range', () => {
    const trials = generateDualNBackSequence(2, 10)
    for (const trial of trials) {
      expect(trial.position).toBeGreaterThanOrEqual(0)
      expect(trial.position).toBeLessThan(GRID_SIZE * GRID_SIZE)
      expect(trial.sound).toBeGreaterThanOrEqual(0)
      expect(trial.sound).toBeLessThan(SOUND_COUNT)
    }
  })

  it('flags positionMatch/soundMatch correctly against N steps back', () => {
    const n = getDualNValue(3)
    const trials = generateDualNBackSequence(3, 10)
    trials.forEach((trial, i) => {
      if (i < n) {
        expect(trial.positionMatch).toBe(false)
        expect(trial.soundMatch).toBe(false)
        return
      }
      expect(trial.positionMatch).toBe(trial.position === trials[i - n].position)
      expect(trial.soundMatch).toBe(trial.sound === trials[i - n].sound)
    })
  })
})

describe('getDualNValue', () => {
  it('increases with level', () => {
    expect(getDualNValue(1)).toBe(1)
    expect(getDualNValue(2)).toBe(2)
    expect(getDualNValue(3)).toBe(3)
  })
})

describe('scoreDualNBackTrials', () => {
  it('scores position and sound channels independently', () => {
    const trials = [
      { position: 0, sound: 0, positionMatch: true, soundMatch: false },
      { position: 1, sound: 1, positionMatch: false, soundMatch: true },
    ]
    const result = scoreDualNBackTrials(trials, [true, false], [false, true])
    expect(result.position.hits).toBe(1)
    expect(result.position.correctRejections).toBe(1)
    expect(result.position.accuracy).toBe(100)
    expect(result.sound.hits).toBe(1)
    expect(result.sound.correctRejections).toBe(1)
    expect(result.sound.accuracy).toBe(100)
  })
})
