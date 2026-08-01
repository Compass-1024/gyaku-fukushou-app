import { describe, expect, it, vi, afterEach } from 'vitest'
import { rollLuckyBonus } from './luckyBonus'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('rollLuckyBonus', () => {
  it('returns true when Math.random() is below the probability threshold', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    expect(rollLuckyBonus()).toBe(true)
  })

  it('returns false when Math.random() is above the probability threshold', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(rollLuckyBonus()).toBe(false)
  })
})
