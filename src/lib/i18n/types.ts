// 翻訳キーの型定義。ja.ts/en.tsの両方がこの型を満たすことを
// TypeScriptの型チェック（tsc -b、npm run build/verifyに含まれる）で
// 保証する。値は固定文字列のほか、埋め込みが必要なものは関数にする。
import type { ShareTemplates } from '../share'
import type { ParseBackupError } from '../backup'
import type { AchievementId } from '../achievements'

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
    seeResults: string
    next: string
    backToModeSelect: string
    backToLevelSelect: string
    suggestionUp: (levelLabel: string) => string
    suggestionDown: (levelLabel: string) => string
    rememberPrompt: string
    correctAnswerLabel: string
    correctOrderLabel: string
    yourAnswerLabel: string
    noAnswer: string
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
  settings: {
    heading: string
    theme: {
      title: string
      system: string
      light: string
      dark: string
    }
    language: {
      title: string
      ja: string
      en: string
    }
    dailyGoalTitle: string
    soundTitle: string
    on: string
    off: string
    notifications: {
      title: string
      unsupported: string
      supportedDescription: string
      permissionDenied: string
      genericError: string
      unsupportedResult: string
    }
    data: {
      title: string
      description: string
      exportButton: string
      importButton: string
      clearHistoryButton: string
      clearHistoryConfirm: string
      clearedMessage: string
      importConfirm: (historyCount: number) => string
      importSuccess: string
      importErrors: Record<ParseBackupError, string>
    }
  }
  stats: {
    heading: string
    noRecordsYet: string
    calendarTitle: string
    calendarSummary: (weeks: number, activeDays: number) => string
    calendarAriaLabel: (weeks: number, activeDays: number) => string
    calendarLegendLow: string
    calendarLegendHigh: string
    weekdayLabels: string[]
    dayCellTooltip: (dateKey: string, count: number) => string
    trendTitle: (days: number) => string
    trendAriaLabel: (days: number) => string
    trendNoRecord: (dateKey: string) => string
    trendDaysAgo: (days: number) => string
    trendToday: string
    achievementsTitle: string
    achievementUnlocked: string
    achievementLocked: string
    areaAccuracyTitle: string
    areaLabel: (label: string, level: number) => string
    needsReview: string
    accuracySummary: (accuracyPercent: number, attempts: number) => string
    notAttempted: string
    weakPhrasesTitle: string
    weakPhraseStat: (
      accuracyPercent: number,
      total: number,
      correct: number,
    ) => string
  }
  privacy: {
    heading: string
    dataLocationTitle: string
    dataLocationBody: string
    notificationsTitle: string
    notificationsBody: string
    micTitle: string
    micBody: string
    cookieTitle: string
    cookieBody: string
    deletionTitle: string
    deletionBody: string
    backupBody: string
    contactTitle: string
    contactBody: string
    summaryNotice: string
    fullPolicyLink: string
    fullPolicyLinkSuffix: string
  }
  achievements: Record<AchievementId, { label: string; description: string }>
  digit: {
    title: string
    subtitle: string
    gameTypes: {
      reverse: ModeCopy
      sum: ModeCopy
    }
    backToTypeSelect: string
    levelSelectTitle: (gameTypeTitle: string) => string
    levelLabel: (level: 1 | 2 | 3) => string
    answerPrompt: {
      reverse: string
      sum: string
    }
    noInput: string
    questionLabel: string
  }
  nback: {
    title: string
    subtitle: string
    levelLabel: (level: 1 | 2 | 3) => string
    matchPrompt: (n: number) => string
    matchButton: string
    matchButtonPressed: string
    resultLabel: (digit: number, isMatch: boolean) => string
  }
  spatial: {
    title: string
    subtitle: string
    levelLabel: (level: 1 | 2 | 3) => string
    answerPrompt: string
    litSquaresAriaLabel: string
    cellAriaLabel: (index: number, tapOrder: number | null) => string
    resultLabel: (cellCount: number) => string
  }
  pattern: {
    title: string
    subtitle: string
    levelLabel: (level: 1 | 2 | 3) => string
    answerPrompt: string
    changed: string
    unchanged: string
  }
  tone: {
    title: string
    subtitle: string
    levelLabel: (level: 1 | 2 | 3) => string
    answerPrompt: string
    padColors: readonly [string, string, string, string]
    padAriaLabel: (color: string) => string
    resultLabel: (padCount: number) => string
  }
}
