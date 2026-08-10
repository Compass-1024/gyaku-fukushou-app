import { describe, expect, it, beforeEach, vi } from 'vitest'
import { saveGameSession, loadGameSession, clearGameSession } from './gameSessionPersistence'

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
  globalThis.sessionStorage = createMemoryStorage()
})

describe('saveGameSession / loadGameSession', () => {
  it('round-trips a saved session', () => {
    saveGameSession('digit-reverse', {
      questions: [{ id: 'a', digits: [1, 2, 3] }],
      results: [{ correct: true }],
      currentIndex: 1,
    })
    const loaded = loadGameSession<{ id: string; digits: number[] }, { correct: boolean }>(
      'digit-reverse',
    )
    expect(loaded?.questions).toEqual([{ id: 'a', digits: [1, 2, 3] }])
    expect(loaded?.results).toEqual([{ correct: true }])
    expect(loaded?.currentIndex).toBe(1)
  })

  it('returns null when nothing is saved', () => {
    expect(loadGameSession('unknown-key')).toBeNull()
  })

  it('returns null for a session older than 30 minutes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    saveGameSession('digit-reverse', { questions: [], results: [], currentIndex: 0 })
    vi.setSystemTime(new Date('2026-01-01T00:31:00Z'))
    expect(loadGameSession('digit-reverse')).toBeNull()
    vi.useRealTimers()
  })

  it('returns null for malformed stored data', () => {
    sessionStorage.setItem('digit-reverse', 'not json')
    expect(loadGameSession('digit-reverse')).toBeNull()
    sessionStorage.setItem('digit-reverse', JSON.stringify({ foo: 'bar' }))
    expect(loadGameSession('digit-reverse')).toBeNull()
  })
})

describe('clearGameSession', () => {
  it('removes the stored session', () => {
    saveGameSession('digit-reverse', { questions: [], results: [], currentIndex: 0 })
    clearGameSession('digit-reverse')
    expect(loadGameSession('digit-reverse')).toBeNull()
  })
})
