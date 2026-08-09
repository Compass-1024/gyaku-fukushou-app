import { describe, expect, it } from 'vitest'
import {
  generateDualNBackSequence,
  scoreDualNBackTrials,
  getDualNValue,
  DEFAULT_TRIAL_COUNT,
  GRID_SIZE,
  SOUND_COUNT,
  createAdaptiveDualNState,
  generateNextAdaptiveDualTrial,
  advanceAdaptiveDualState,
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

describe('adaptive dual N-back staircase (④-1)', () => {
  it('generateNextAdaptiveDualTrial grows both position and sound history by one each call', () => {
    let state = createAdaptiveDualNState(1)
    for (let i = 0; i < 5; i++) {
      const result = generateNextAdaptiveDualTrial(state)
      expect(result.state.positions).toHaveLength(i + 1)
      expect(result.state.sounds).toHaveLength(i + 1)
      state = result.state
    }
  })

  it('never marks a match before the history reaches n', () => {
    let state = createAdaptiveDualNState(3)
    for (let i = 0; i < 3; i++) {
      const { trial, state: next } = generateNextAdaptiveDualTrial(state)
      expect(trial.positionMatch).toBe(false)
      expect(trial.soundMatch).toBe(false)
      state = next
    }
  })

  it('increases n by one after 3 consecutive correct answers', () => {
    let state = createAdaptiveDualNState(1)
    state = advanceAdaptiveDualState(state, true)
    state = advanceAdaptiveDualState(state, true)
    expect(state.n).toBe(1)
    state = advanceAdaptiveDualState(state, true)
    expect(state.n).toBe(2)
    expect(state.recentResults).toEqual([])
  })

  it('decreases n after 2 or more wrong answers within the window', () => {
    let state = createAdaptiveDualNState(2)
    state = advanceAdaptiveDualState(state, false)
    state = advanceAdaptiveDualState(state, true)
    state = advanceAdaptiveDualState(state, false)
    expect(state.n).toBe(1)
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
