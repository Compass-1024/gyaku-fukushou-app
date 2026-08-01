import { describe, expect, it } from 'vitest'
import { getSuggestedLevel } from './difficulty'

describe('getSuggestedLevel', () => {
  it('suggests leveling up on a perfect score', () => {
    expect(getSuggestedLevel(1, 100)).toBe(2)
    expect(getSuggestedLevel(2, 100)).toBe(3)
  })

  it('does not suggest leveling up past the max level', () => {
    expect(getSuggestedLevel(3, 100)).toBeNull()
  })

  it('suggests leveling down on a low score', () => {
    expect(getSuggestedLevel(2, 0)).toBe(1)
    expect(getSuggestedLevel(3, 33)).toBe(2)
  })

  it('does not suggest leveling down past the min level', () => {
    expect(getSuggestedLevel(1, 0)).toBeNull()
  })

  it('makes no suggestion for a middling score', () => {
    expect(getSuggestedLevel(2, 67)).toBeNull()
  })
})
