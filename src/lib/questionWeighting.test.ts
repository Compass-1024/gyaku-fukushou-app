import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadBucketStats,
  recordBucketAttempt,
  getBucketWeight,
  pickWeightedCandidate,
} from './questionWeighting'

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

describe('recordBucketAttempt / loadBucketStats', () => {
  it('starts empty', () => {
    expect(loadBucketStats('digit')).toEqual({})
  })

  it('accumulates correct/total per bucket', () => {
    recordBucketAttempt('digit', '1:unique', true)
    recordBucketAttempt('digit', '1:unique', false)
    expect(loadBucketStats('digit')).toEqual({ '1:unique': { correct: 1, total: 2 } })
  })

  it('keeps stats separate per mode', () => {
    recordBucketAttempt('digit', 'a', true)
    recordBucketAttempt('spatial', 'a', false)
    expect(loadBucketStats('digit')).toEqual({ a: { correct: 1, total: 1 } })
    expect(loadBucketStats('spatial')).toEqual({ a: { correct: 0, total: 1 } })
  })
})

describe('getBucketWeight', () => {
  it('returns the standard weight (1) for an unseen bucket', () => {
    expect(getBucketWeight({}, 'unseen')).toBe(1)
  })

  it('increases the weight as the error rate rises', () => {
    const stats = { weak: { correct: 0, total: 4 } }
    expect(getBucketWeight(stats, 'weak')).toBe(4) // 1 + 1*3
  })

  it('returns the standard weight for a perfect bucket', () => {
    const stats = { strong: { correct: 4, total: 4 } }
    expect(getBucketWeight(stats, 'strong')).toBe(1)
  })
})

describe('pickWeightedCandidate', () => {
  it('always returns one of the generated candidates', () => {
    let n = 0
    const result = pickWeightedCandidate(
      () => n++,
      (v) => String(v % 2),
      {},
      5,
    )
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(5)
  })

  it('heavily favors the weak bucket when candidates are forced into two buckets', () => {
    const stats = {
      weak: { correct: 0, total: 10 },
      strong: { correct: 10, total: 10 },
    }
    let n = 0
    let weakCount = 0
    for (let i = 0; i < 200; i++) {
      n = 0
      const result = pickWeightedCandidate(
        () => n++ % 2,
        (v) => (v === 0 ? 'weak' : 'strong'),
        stats,
        2,
      )
      if (result === 0) weakCount += 1
    }
    // weak(weight=4) vs strong(weight=1) -> weak should be picked ~80% of the time
    expect(weakCount).toBeGreaterThan(120)
  })
})
