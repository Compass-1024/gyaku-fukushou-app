import { describe, expect, it, beforeEach } from 'vitest'
import { saveRecentQuestions, consumeRecentQuestions } from './recentQuestions'

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

describe('saveRecentQuestions / consumeRecentQuestions', () => {
  it('returns an empty array when nothing was saved', () => {
    expect(consumeRecentQuestions('digit:1')).toEqual([])
  })

  it('round-trips saved items', () => {
    saveRecentQuestions('digit:1', [[1, 2, 3]])
    expect(consumeRecentQuestions('digit:1')).toEqual([[1, 2, 3]])
  })

  it('consumes (deletes) the entry so a second read returns empty', () => {
    saveRecentQuestions('digit:1', [[1, 2, 3]])
    consumeRecentQuestions('digit:1')
    expect(consumeRecentQuestions('digit:1')).toEqual([])
  })

  it('keeps entries separate per key', () => {
    saveRecentQuestions('digit:1', [[1, 2, 3]])
    saveRecentQuestions('digit:2', [[4, 5, 6, 7, 8]])
    expect(consumeRecentQuestions('digit:1')).toEqual([[1, 2, 3]])
    expect(consumeRecentQuestions('digit:2')).toEqual([[4, 5, 6, 7, 8]])
  })

  it('does not write anything for an empty item list', () => {
    saveRecentQuestions('digit:1', [])
    expect(consumeRecentQuestions('digit:1')).toEqual([])
  })
})
