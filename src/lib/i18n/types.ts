// 翻訳キーの型定義。ja.ts/en.tsの両方がこの型を満たすことを
// TypeScriptの型チェック（tsc -b、npm run build/verifyに含まれる）で
// 保証する。値は固定文字列のほか、埋め込みが必要なものは関数にする。
import type { ShareTemplates } from '../share'

export interface ModeCopy {
  title: string
  description: string
}

export interface Translations {
  common: {
    back: string
    loading: string
    stats: string
    settings: string
    privacyPolicy: string
    correct: string
    incorrect: string
    confirm: string
    deleteChar: string
    questionProgress: (current: number, total: number) => string
    attemptStats: (accuracyPercent: number, attempts: number) => string
    // モード×レベルの表示ラベル（TopScreen/StatsScreenで共有）
    areaLabels: {
      word: string
      'digit-reverse': string
      'digit-sum': string
      nback: string
      spatial: string
      pattern: string
      tone: string
    }
  }
  share: ShareTemplates
  setSummary: {
    resultLabel: string
    scoreLabel: (correct: number, total: number) => string
    shareButton: string
    shareStatusShared: string
    shareStatusCopied: string
    shareStatusError: string
    luckyBonus: string
    newBest: string
    newAchievementsTitle: string
    questionLabel: (index: number) => string
    dailyGoal: (today: number, goal: number) => string
    dailyGoalReached: string
    retry: string
    changeLevel: string
  }
  top: {
    heading: string
    subtitle: string
    streakDays: (days: number) => string
    todayCount: (count: number) => string
    dailyGoal: (today: number, goal: number) => string
    streakAtRisk: (days: number) => string
    dismissRecap: string
    recapTitle: string
    recapSummary: (sets: number, accuracyPercent: number | null) => string
    recapIncrease: (previousWeekSets: number) => string
    recapDecrease: (previousWeekSets: number) => string
    recapSame: string
    recommendedTitle: string
    recommendedSummary: (areaLabel: string, accuracyPercent: number) => string
    modes: {
      word: ModeCopy
      digit: ModeCopy
      nback: ModeCopy
      spatial: ModeCopy
      pattern: ModeCopy
      tone: ModeCopy
    }
  }
}
