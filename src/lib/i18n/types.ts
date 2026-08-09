// 翻訳キーの型定義。ja.ts/en.tsの両方がこの型を満たすことを
// TypeScriptの型チェック（tsc -b、npm run build/verifyに含まれる）で
// 保証する。値は固定文字列のほか、埋め込みが必要なものは関数にする。
import type { ShareTemplates } from '../share'
import type { ParseBackupError } from '../backup'
import type { AchievementId } from '../achievements'
import type { BenchmarkBand } from '../benchmarks'

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
    confirmExitMessage: string
    questionProgress: (current: number, total: number) => string
    attemptStats: (accuracyPercent: number, attempts: number) => string
    // ④-7: 回答中の一時停止機能
    pauseButton: string
    pausedMessage: string
    resumeButton: string
    // モード×レベルの表示ラベル（TopScreen/StatsScreenで共有）
    areaLabels: {
      word: string
      'digit-reverse': string
      'digit-sum': string
      nback: string
      'dual-nback': string
      spatial: string
      pattern: string
      tone: string
      random: string
    }
    // gameTypeを区別しないモード単位のラベル（④-4のサマリー画像で使用）
    modeLabels: Record<
      'word' | 'digit' | 'nback' | 'dual-nback' | 'spatial' | 'pattern' | 'tone' | 'random',
      string
    >
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
    // ④-5: 全期間の自己ベストとは別の、同日内での自己記録更新演出
    newTodayBest: string
    newAchievementsTitle: string
    questionLabel: (index: number) => string
    dailyGoal: (today: number, goal: number) => string
    dailyGoalReached: string
    retry: string
    changeLevel: string
    xpGained: (xp: number) => string
    xpGainedZero: string
    levelUp: (level: number) => string
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
      digitReverse: ModeCopy
      digitSum: ModeCopy
      nback: ModeCopy
      dualNback: ModeCopy
      spatial: ModeCopy
      pattern: ModeCopy
      tone: ModeCopy
      random: ModeCopy
    }
    playerLevel: (level: number) => string
    xpToNextLevel: (xp: number) => string
    growingBadgeLabel: string
  }
  missions: {
    cardTitle: string
    completedBadge: string
    xpReward: (xp: number) => string
    playCountLabel: (areaLabel: string, count: number) => string
    accuracyLabel: (percent: number) => string
    // ホーム画面のコンパクトチップ表示用の短いラベル
    chipLabel: string
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
    sfxVolumeTitle: string
    sfxTestButton: string
    bgmTitle: string
    bgmVolumeTitle: string
    // ④-6: 集中モード（没入UIテーマ）
    focusModeTitle: string
    focusModeDescription: string
    // ④-7: ホーム画面のチップ自動展開設定
    autoExpandChipTitle: string
    autoExpandChipDescription: string
    autoExpandChipNone: string
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
      csvExportButton: string
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
    calendarCaption: string
    calendarSummary: (weeks: number, activeDays: number) => string
    calendarAriaLabel: (weeks: number, activeDays: number) => string
    calendarLegendLow: string
    calendarLegendHigh: string
    calendarLegendCount: (count: number) => string
    weekdayLabels: string[]
    monthLabels: string[]
    dayCellTooltip: (dateKey: string, count: number) => string
    // ④-8: 学習カレンダーの日別ドリルダウン（マスをタップしてその日の内訳を表示）
    dayDetailTitle: (dateKey: string) => string
    dayDetailNoRecords: string
    dayDetailEntry: (
      label: string,
      level: number,
      correct: number,
      total: number,
      accuracyPercent: number,
    ) => string
    dayDetailCloseButton: string
    trendTitle: (days: number) => string
    trendAriaLabel: (days: number) => string
    trendNoRecord: (dateKey: string) => string
    trendDaysAgo: (days: number) => string
    trendToday: string
    achievementsTitle: string
    achievementsCountLabel: (unlocked: number, total: number) => string
    achievementUnlocked: string
    achievementLocked: string
    achievementCloseDetail: string
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
    // ④-3: 出題重み付け統計(バケット)から見える誤答パターンの質的フィードバック
    bucketWeaknessLabels: Record<string, string>
    bucketWeaknessSummary: (label: string, accuracyPercent: number) => string
    // ④-6: モード別正答率の時系列グラフ
    modeTrendTitle: string
    modeTrendNotEnoughData: string
    // ④-10: 実績・達成の通知センター
    notificationCenterTitle: string
    notificationCenterEmpty: string
    notificationAchievementLabel: (icon: string, label: string) => string
    notificationMissionLabel: (missionLabel: string) => string
    notificationShowMoreButton: string
    // ④-4: 週間/月間の学習サマリー画像エクスポート
    summaryImage: {
      title: string
      periodWeek: string
      periodMonth: string
      downloadButton: string
      noDataMessage: string
      appTitle: string
      dateRangeLabel: (rangeLabel: string) => string
      setsLabel: (sets: number) => string
      accuracyLabel: (accuracyPercent: number) => string
      accuracyNoDataLabel: string
      streakLabel: (days: number) => string
      topModeLabel: (modeLabel: string, sets: number) => string
    }
  }
  // ④-9: 日付シードの「デイリーチャレンジ」
  dailyChallenge: {
    title: string
    description: string
    difficultyLabel: (level: 1 | 2 | 3) => string
    startButton: string
    rememberPrompt: string
    inputPrompt: string
    completedBadge: (correct: boolean) => string
    chipLabel: string
  }
  // ④-4: 複数日にまたがる「7日間チャレンジ」プログラム
  program: {
    title: string
    progressLabel: (daysPlayed: number, totalDays: number) => string
    completeMessage: string
    chipLabel: string
    chipProgress: (daysPlayed: number, totalDays: number) => string
  }
  // ④-10(代替): 初回オンボーディングガイド
  onboarding: {
    steps: { title: string; body: string }[]
    next: string
    skip: string
    start: string
    stepProgress: (current: number, total: number) => string
  }
  // ④-5: PWAインストール促進バナー(SetSummaryに表示)
  installBanner: {
    title: string
    body: string
    installButton: string
    iosBody: string
    dismiss: string
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
    resultLabel: (position: number, isMatch: boolean) => string
    trialCountTitle: string
    trialCountLabel: (count: number) => string
    // ④-1: アダプティブ難易度モード
    adaptiveLabel: string
    adaptiveDescription: string
    currentNLabel: (n: number) => string
    maxNReachedLabel: (n: number) => string
  }
  dualNback: {
    title: string
    subtitle: string
    levelLabel: (level: 1 | 2 | 3) => string
    trialCountTitle: string
    trialCountLabel: (count: number) => string
    matchPrompt: (n: number) => string
    positionMatchButton: string
    positionMatchButtonPressed: string
    soundMatchButton: string
    soundMatchButtonPressed: string
    resultLabel: (channel: 'position' | 'sound', isMatch: boolean) => string
    // ④-1: アダプティブ難易度モード
    adaptiveLabel: string
    adaptiveDescription: string
    currentNLabel: (n: number) => string
    maxNReachedLabel: (n: number) => string
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
    selectPrompt: string
    submitButton: string
    cellAriaLabel: (index: number, selected: boolean) => string
  }
  random: {
    title: string
    subtitle: string
    levelLabel: (level: 1 | 2 | 3) => string
    roundProgress: (current: number, total: number) => string
    resultLabel: (correct: number, total: number) => string
    weakPointFocusLabel: string
    weakPointFocusDescription: string
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
  benchmarks: {
    title: string
    disclaimer: string
    bandLabels: Record<BenchmarkBand, string>
    recentLabel: (accuracyPercent: number) => string
    previousLabel: (accuracyPercent: number) => string
    digit: { label: string }
    'digit-sum': { label: string }
    spatial: { label: string }
    nback: { label: string }
    pattern: { label: string }
    'dual-nback': { label: string }
    random: { label: string }
    word: { label: string }
    tone: { label: string }
  }
}
