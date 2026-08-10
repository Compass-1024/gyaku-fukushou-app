import { describe, expect, it } from 'vitest'
import { nextAdaptiveLevel } from './adaptiveDifficulty'

describe('nextAdaptiveLevel', () => {
  it('increases level by 1 on a correct answer', () => {
    expect(nextAdaptiveLevel(1, true)).toBe(2)
    expect(nextAdaptiveLevel(2, true)).toBe(3)
  })

  it('clamps at level 3 when already at the maximum', () => {
    expect(nextAdaptiveLevel(3, true)).toBe(3)
  })

  it('decreases level by 1 on an incorrect answer', () => {
    expect(nextAdaptiveLevel(3, false)).toBe(2)
    expect(nextAdaptiveLevel(2, false)).toBe(1)
  })

  it('clamps at level 1 when already at the minimum', () => {
    expect(nextAdaptiveLevel(1, false)).toBe(1)
  })
})
