import { describe, expect, it, vi, afterEach } from 'vitest'
import { PHRASES, pickQuestionSet, findPhraseById } from './phrases'
import type { PhraseStats } from './phraseStats'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pickQuestionSet', () => {
  it('phraseStats省略時はレベル内から重複なく3問選ぶ', () => {
    const picked = pickQuestionSet(1)
    expect(picked).toHaveLength(3)
    expect(new Set(picked.map((p) => p.id)).size).toBe(3)
    for (const p of picked) {
      expect(PHRASES[1].some((phrase) => phrase.id === p.id)).toBe(true)
    }
  })

  it('誤答が多いフレーズは、乱数値が同じでもより選ばれやすい', () => {
    const weakId = PHRASES[1][0].id
    const stats: PhraseStats = { [weakId]: { correct: 0, total: 5 } }
    // weakIdのウェイトは4、他は全て1。乱数値を十分小さく固定し、
    // 重み付き抽選のロジック上、必ずweakId（プール先頭・最大ウェイト）が
    // 選ばれる値であることを確認する。
    vi.spyOn(Math, 'random').mockReturnValue(0.01)
    const [first] = pickQuestionSet(1, stats)
    expect(first.id).toBe(weakId)
  })
})

describe('findPhraseById', () => {
  it('存在するIDならフレーズを返す', () => {
    const target = PHRASES[2][3]
    expect(findPhraseById(target.id)).toEqual(target)
  })

  it('存在しないIDならundefinedを返す', () => {
    expect(findPhraseById('not-an-id')).toBeUndefined()
  })
})
