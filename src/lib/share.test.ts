import { describe, expect, it } from 'vitest'
import { buildResultShareText } from './share'

describe('buildResultShareText', () => {
  it('includes the score and app URL', () => {
    const text = buildResultShareText({
      correctCount: 2,
      total: 3,
      streakDays: 0,
      achievementLabels: [],
    })
    expect(text).toContain('2/3問正解')
    expect(text).toContain('https://oboetore.vercel.app/')
    expect(text).not.toContain('連続')
    expect(text).not.toContain('実績')
  })

  it('includes the streak only when 2 days or more', () => {
    expect(buildResultShareText({ correctCount: 1, total: 1, streakDays: 1, achievementLabels: [] })).not.toContain('連続')
    expect(buildResultShareText({ correctCount: 1, total: 1, streakDays: 2, achievementLabels: [] })).toContain('2日連続')
  })

  it('includes the personal-best line only when isNewBest is true', () => {
    const withoutBest = buildResultShareText({
      correctCount: 1,
      total: 1,
      streakDays: 0,
      achievementLabels: [],
    })
    expect(withoutBest).not.toContain('自己ベスト')
    const withBest = buildResultShareText({
      correctCount: 1,
      total: 1,
      streakDays: 0,
      achievementLabels: [],
      isNewBest: true,
    })
    expect(withBest).toContain('自己ベストを更新しました')
  })

  it('includes newly unlocked achievement labels', () => {
    const text = buildResultShareText({
      correctCount: 3,
      total: 3,
      streakDays: 0,
      achievementLabels: ['💯 パーフェクト', '🎉 はじめの一歩'],
    })
    expect(text).toContain('💯 パーフェクト、🎉 はじめの一歩')
  })
})
