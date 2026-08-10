import { describe, expect, it, vi, beforeEach } from 'vitest'
import { playCorrectHaptic, playIncorrectHaptic, playAchievementHaptic } from './haptics'

describe('haptics', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { vibrate: vi.fn() })
  })

  it('vibrates with a single short pulse on correct', () => {
    playCorrectHaptic()
    expect(navigator.vibrate).toHaveBeenCalledWith(30)
  })

  it('vibrates with a distinguishable pattern on incorrect', () => {
    playIncorrectHaptic()
    expect(navigator.vibrate).toHaveBeenCalledWith([30, 60, 30])
  })

  it('vibrates with a longer pattern on achievement', () => {
    playAchievementHaptic()
    expect(navigator.vibrate).toHaveBeenCalledWith([20, 40, 20, 40, 60])
  })

  it('does nothing when navigator.vibrate is unavailable', () => {
    vi.stubGlobal('navigator', {})
    expect(() => playCorrectHaptic()).not.toThrow()
  })

  it('swallows exceptions thrown by navigator.vibrate', () => {
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(() => {
        throw new Error('not allowed')
      }),
    })
    expect(() => playCorrectHaptic()).not.toThrow()
  })
})
