import { describe, expect, it, beforeEach } from 'vitest'
import { isInstallBannerDismissed, markInstallBannerDismissed } from './installPrompt'

function createMemoryStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  }
}

beforeEach(() => {
  globalThis.localStorage = createMemoryStorage()
})

describe('install banner dismissal', () => {
  it('is not dismissed by default', () => {
    expect(isInstallBannerDismissed()).toBe(false)
  })

  it('is dismissed immediately after marking', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    markInstallBannerDismissed(now)
    expect(isInstallBannerDismissed(now)).toBe(true)
  })

  it('is no longer dismissed after the cooldown period elapses', () => {
    const dismissedAt = new Date('2026-01-01T00:00:00.000Z')
    markInstallBannerDismissed(dismissedAt)
    const fifteenDaysLater = new Date('2026-01-16T00:00:00.000Z')
    expect(isInstallBannerDismissed(fifteenDaysLater)).toBe(false)
  })
})
