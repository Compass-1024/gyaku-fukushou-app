import { describe, expect, it, beforeEach } from 'vitest'
import { hasSeenOnboarding, markOnboardingSeen } from './onboarding'

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

describe('onboarding seen flag', () => {
  it('has not been seen by default', () => {
    expect(hasSeenOnboarding()).toBe(false)
  })

  it('is seen after marking', () => {
    markOnboardingSeen()
    expect(hasSeenOnboarding()).toBe(true)
  })

  it('treats localStorage failures as already seen (fail open, never nags)', () => {
    // @ts-expect-error 意図的に壊れたStorageをシミュレートする
    globalThis.localStorage = {
      getItem: () => {
        throw new Error('unavailable')
      },
    }
    expect(hasSeenOnboarding()).toBe(true)
  })
})
