import { describe, expect, it, beforeEach } from 'vitest'
import { loadPhraseStats, recordPhraseAttempt, getPhraseWeight } from './phraseStats'

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

describe('loadPhraseStats', () => {
  it('データが無ければ空オブジェクトを返す', () => {
    expect(loadPhraseStats()).toEqual({})
  })

  it('localStorageが壊れたJSONでも空オブジェクトにフォールバックする', () => {
    localStorage.setItem('gyaku-fukushou:phraseStats', '{invalid')
    expect(loadPhraseStats()).toEqual({})
  })
})

describe('recordPhraseAttempt', () => {
  it('正誤を累積記録する', () => {
    recordPhraseAttempt('1-0', true)
    recordPhraseAttempt('1-0', false)
    recordPhraseAttempt('1-0', true)
    expect(loadPhraseStats()['1-0']).toEqual({ correct: 2, total: 3 })
  })

  it('別々のフレーズIDは独立して記録される', () => {
    recordPhraseAttempt('1-0', true)
    recordPhraseAttempt('1-1', false)
    expect(loadPhraseStats()).toEqual({
      '1-0': { correct: 1, total: 1 },
      '1-1': { correct: 0, total: 1 },
    })
  })
})

describe('getPhraseWeight', () => {
  it('未挑戦のフレーズは標準ウェイト1', () => {
    expect(getPhraseWeight({}, '1-0')).toBe(1)
  })

  it('全問不正解のフレーズは最大ウェイト', () => {
    const stats = { '1-0': { correct: 0, total: 5 } }
    expect(getPhraseWeight(stats, '1-0')).toBe(4)
  })

  it('全問正解のフレーズは標準ウェイト1', () => {
    const stats = { '1-0': { correct: 5, total: 5 } }
    expect(getPhraseWeight(stats, '1-0')).toBe(1)
  })

  it('正答率50%のフレーズは中間のウェイト', () => {
    const stats = { '1-0': { correct: 2, total: 4 } }
    expect(getPhraseWeight(stats, '1-0')).toBe(2.5)
  })
})
