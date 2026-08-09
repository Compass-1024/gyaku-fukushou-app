import type { Translations } from './types'

export const en: Translations = {
  common: {
    back: '← Back',
    loading: 'Loading…',
    stats: 'Stats',
    settings: 'Settings',
    privacyPolicy: 'Privacy Policy',
    correct: 'Correct',
    incorrect: 'Incorrect',
    confirm: 'OK',
    deleteChar: 'Delete last digit',
    seeResults: 'See results',
    next: 'Next',
    backToModeSelect: '← Mode select',
    backToLevelSelect: '← Level select',
    suggestionUp: (levelLabel) => `🎉 Try ${levelLabel}`,
    suggestionDown: (levelLabel) => `Practice at ${levelLabel} again`,
    rememberPrompt: 'Memorize it',
    correctAnswerLabel: 'Correct answer: ',
    correctOrderLabel: 'Correct order: ',
    yourAnswerLabel: 'Your answer: ',
    noAnswer: '(no answer)',
    confirmExitMessage:
      "This set's answers will be discarded. Are you sure?",
    questionProgress: (current, total) => `Question ${current} / ${total}`,
    attemptStats: (accuracyPercent, attempts) =>
      `Accuracy so far: ${accuracyPercent}% (${attempts} attempt${attempts === 1 ? '' : 's'})`,
    pauseButton: '⏸ Pause',
    pausedMessage: 'Paused. Resume when you’re ready.',
    resumeButton: '▶ Resume',
    areaLabels: {
      word: 'Word',
      'digit-reverse': 'Digits (reverse)',
      'digit-sum': 'Digits (sum)',
      nback: 'N-Back',
      'dual-nback': 'Dual N-Back',
      spatial: 'Spatial',
      pattern: 'Change Detection',
      tone: 'Tone & Color',
      random: 'Random',
    },
  },
  top: {
    heading: 'Working Memory Training',
    subtitle: 'Train your working memory with 9 brain-training modes.',
    streakDays: (days) => `🔥 ${days}-day streak`,
    todayCount: (count) => `${count} session${count === 1 ? '' : 's'} today`,
    dailyGoal: (today, goal) => `Today's goal: ${today} / ${goal} sets`,
    streakAtRisk: (days) =>
      `🔥 ${days}-day streak! Play today to keep it going.`,
    dismissRecap: 'Dismiss recap',
    recapTitle: '📅 Last week in review',
    recapSummary: (sets, accuracyPercent) =>
      `You completed ${sets} set${sets === 1 ? '' : 's'}${accuracyPercent !== null ? ` with ${accuracyPercent}% accuracy` : ''}.`,
    recapIncrease: (previousWeekSets) =>
      `📈 Up from ${previousWeekSets} the week before!`,
    recapDecrease: (previousWeekSets) =>
      `You did ${previousWeekSets} the week before. Keep a pace that works for you.`,
    recapSame: 'Same pace as the week before.',
    recommendedTitle: "🎯 Today's recommendation",
    recommendedSummary: (areaLabel, accuracyPercent) =>
      `Review ${areaLabel} (${accuracyPercent}% accuracy)`,
    modes: {
      word: {
        title: 'Word Mode',
        description: 'Words in reverse',
      },
      digitReverse: {
        title: 'Digit Mode (Reverse)',
        description: 'Digits in reverse',
      },
      digitSum: {
        title: 'Digit Mode (Sum)',
        description: 'Sum the digits',
      },
      nback: {
        title: 'N-Back Mode',
        description: 'Spot the match',
      },
      spatial: {
        title: 'Spatial Mode',
        description: 'Tap squares in reverse',
      },
      pattern: {
        title: 'Change Detection Mode',
        description: 'Find the pattern',
      },
      tone: {
        title: 'Tone & Color Mode',
        description: 'Repeat the tones',
      },
      dualNback: {
        title: 'Dual N-Back Mode',
        description: 'Match position & sound',
      },
      random: {
        title: 'Random Mode',
        description: '5-mode mixed workout',
      },
    },
    playerLevel: (level) => `Player Lv.${level}`,
    xpToNextLevel: (xp) => `${xp} XP to next level`,
    growingBadgeLabel: 'Accuracy improving',
  },
  missions: {
    cardTitle: "🎯 Today's Mission",
    completedBadge: '✅ Completed!',
    xpReward: (xp) => `+${xp} XP on completion`,
    playCountLabel: (areaLabel, count) => `Play ${areaLabel} ${count} times`,
    accuracyLabel: (percent) => `Reach ${percent}%+ accuracy`,
    chipLabel: 'Mission',
  },
  share: {
    resultLine: (correct, total) =>
      `I scored ${correct}/${total} on Reverse Recall Training!`,
    streakLine: (days) => `🔥 On a ${days}-day streak`,
    achievementsLine: (labels) =>
      `🎉 New achievement${labels.length === 1 ? '' : 's'}: ${labels.join(', ')}`,
    newBestLine: '🏅 New personal best!',
  },
  setSummary: {
    resultLabel: 'Result',
    scoreLabel: (correct, total) => `${correct} / ${total} correct`,
    shareButton: '📤 Share result',
    shareStatusShared: 'Shared',
    shareStatusCopied: 'Copied to clipboard',
    shareStatusError:
      'Sharing is not supported here. Please select and copy the text instead.',
    luckyBonus: "🍀 Lucky day! Looks like today's your lucky day",
    newBest: '🏅 New personal best!',
    newAchievementsTitle: '🎉 New achievement unlocked!',
    questionLabel: (index) => `Question ${index}: `,
    dailyGoal: (today, goal) => `Today's goal: ${today} / ${goal} sets`,
    dailyGoalReached: "🎉 You've reached today's goal!",
    retry: 'Try again at this level',
    changeLevel: 'Back to level select',
    xpGained: (xp) => `XP gained: +${xp}`,
    xpGainedZero: 'No XP this time — aim for at least one correct next time',
    levelUp: (level) => `🎉 Level Up! Player Lv.${level}`,
  },
  settings: {
    heading: 'Settings',
    theme: {
      title: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    language: {
      title: 'Language',
      ja: '日本語',
      en: 'English',
    },
    dailyGoalTitle: "Daily goal (sets)",
    soundTitle: 'Sound effects',
    on: 'On',
    off: 'Off',
    sfxVolumeTitle: 'Sound effects volume',
    sfxTestButton: '🔊 Test sound',
    bgmTitle: 'Background music',
    bgmVolumeTitle: 'Background music volume',
    notifications: {
      title: 'Reminder notifications',
      unsupported:
        'Notifications are not supported on this device/browser (on iOS, only apps added to the Home Screen support this).',
      supportedDescription:
        "If you haven't played at all that day, we'll send a reminder around 9 PM JST (the exact time may vary).",
      permissionDenied:
        'Notification permission was denied. Please enable notifications for this site in your browser settings.',
      genericError:
        "Couldn't set up notifications. Please try again later. If the problem persists, check that this browser is allowed to send notifications in your device's OS settings.",
      unsupportedResult:
        'Notifications are not supported on this device/browser.',
    },
    data: {
      title: 'Data',
      description:
        'Your training history, achievements, and settings are stored only on this device/browser. We recommend backing up regularly in case you switch devices or clear browser data.',
      exportButton: '⬇️ Export backup',
      csvExportButton: '📊 Export history as CSV',
      importButton: '⬆️ Restore from backup',
      clearHistoryButton: 'Delete all training history',
      clearHistoryConfirm:
        'This will delete all training history, stats, and achievements. This cannot be undone. Continue?',
      clearedMessage: 'Deleted. This will take effect when you return to the top screen.',
      importConfirm: (historyCount) =>
        `This will overwrite your current history and settings with the backup file's contents (${historyCount} history record${historyCount === 1 ? '' : 's'}). This cannot be undone. Continue?`,
      importSuccess:
        'Imported. This will take effect when you return to the top screen.',
      importErrors: {
        'invalid-json': "This file isn't valid (couldn't be read as JSON).",
        'invalid-content': "This file's contents aren't valid.",
        'invalid-history':
          "This file's training history is not in a valid format. Please try a different file.",
        'invalid-settings':
          "This file's settings are not in a valid format. Please try a different file.",
      },
    },
  },
  stats: {
    heading: 'Stats',
    noRecordsYet: 'No records yet. Stats will appear once you start playing.',
    calendarTitle: 'Activity calendar',
    calendarCaption: 'Darker squares mean more sets completed that day',
    calendarSummary: (weeks, activeDays) =>
      `${activeDays} active day${activeDays === 1 ? '' : 's'} in the last ${weeks} weeks`,
    calendarAriaLabel: (weeks, activeDays) =>
      `Activity calendar for the last ${weeks} weeks. You practiced on ${activeDays} day${activeDays === 1 ? '' : 's'}.`,
    calendarLegendLow: 'Less',
    calendarLegendHigh: 'More',
    calendarLegendCount: (count) => (count >= 3 ? '3+' : `${count}`),
    weekdayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    monthLabels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ],
    dayCellTooltip: (dateKey, count) => `${dateKey}: ${count} set${count === 1 ? '' : 's'}`,
    trendTitle: (days) => `Accuracy trend (last ${days} days)`,
    trendAriaLabel: (days) => `Accuracy trend over the last ${days} days`,
    trendNoRecord: (dateKey) => `${dateKey}: no record`,
    trendDaysAgo: (days) => `${days}d ago`,
    trendToday: 'Today',
    achievementsTitle: 'Achievements',
    achievementsCountLabel: (unlocked, total) => `${unlocked} / ${total} unlocked`,
    achievementUnlocked: 'Unlocked',
    achievementLocked: 'Locked',
    achievementCloseDetail: 'Close',
    areaAccuracyTitle: 'Accuracy by mode',
    areaLabel: (label, level) => `${label} Level ${level}`,
    needsReview: '⚠️ Needs review',
    accuracySummary: (accuracyPercent, attempts) =>
      `${accuracyPercent}% (${attempts} attempt${attempts === 1 ? '' : 's'})`,
    notAttempted: 'Not attempted',
    weakPhrasesTitle: 'Word Mode: Phrases to review',
    weakPhraseStat: (accuracyPercent, total, correct) =>
      `${accuracyPercent}% (${correct}/${total} correct)`,
    bucketWeaknessLabels: {
      'digit:repeat': 'questions with repeated digits',
      'digit:unique': 'questions with all-unique digits',
      'spatial:adjacent': 'sequences that move to adjacent cells',
      'spatial:scattered': 'sequences that jump to distant cells',
      'pattern:clustered': 'patterns with clustered cells',
      'pattern:scattered': 'patterns with scattered cells',
      'tone:repeat': 'sequences with repeated pads',
      'tone:unique': 'sequences with all-unique pads',
    },
    bucketWeaknessSummary: (label, accuracyPercent) =>
      `You struggle with ${label} (${accuracyPercent}% correct)`,
    modeTrendTitle: 'Accuracy trend by mode',
    modeTrendNotEnoughData: 'Shown once you have more attempts',
  },
  dailyChallenge: {
    title: "🎯 Today's Challenge",
    description: "A number unique to today. Can you reverse it? (once per day)",
    difficultyLabel: (level) =>
      ({ 1: 'Level 1 (3 digits)', 2: 'Level 2 (4 digits)', 3: 'Level 3 (5 digits)' })[level],
    startButton: 'Start',
    rememberPrompt: 'Try to remember it',
    inputPrompt: 'Enter it in reverse',
    completedBadge: (correct) => (correct ? '✅ Solved today' : '📝 Attempted today'),
    chipLabel: 'Challenge',
  },
  program: {
    title: '🗓️ 7-Day Challenge',
    progressLabel: (daysPlayed, totalDays) =>
      `Played ${daysPlayed} / ${totalDays} days in the last week`,
    completeMessage: "🎉 You've played every day this week! Keep it up",
    chipLabel: '7-Day',
    chipProgress: (daysPlayed, totalDays) => `${daysPlayed}/${totalDays}d`,
  },
  onboarding: {
    steps: [
      {
        title: 'Welcome!',
        body: 'Working Memory Training is a set of 9 mini-games designed to train your working memory.',
      },
      {
        title: 'How it works',
        body: 'Pick a level, watch (or listen to) the question, then answer the way you memorized it. Each set takes just a few minutes.',
      },
      {
        title: 'Keep going, grow stronger',
        body: 'Correct answers earn XP and level up your player level, and achievements and streaks are tracked too. Try one mode to get started!',
      },
    ],
    next: 'Next',
    skip: 'Skip',
    start: 'Get started',
    stepProgress: (current, total) => `${current} / ${total}`,
  },
  installBanner: {
    title: '📲 Add to your home screen?',
    body: 'Launch it like an app, and reminder notifications reach you more reliably',
    installButton: 'Add to home screen',
    iosBody:
      '📲 Tap the Share button, then "Add to Home Screen" to launch this like an app',
    dismiss: 'Dismiss',
  },
  privacy: {
    heading: 'Privacy Policy',
    dataLocationTitle: 'Where your data is stored',
    dataLocationBody:
      'Most of this app has no backend server — your training history and settings are stored only in your browser (localStorage) on this device. No data is sent to any third party, including us, unless you turn on Reminder Notifications (see below).',
    notificationsTitle: 'About reminder notifications',
    notificationsBody:
      "Reminder Notifications in Settings is an opt-in feature that's off by default. When enabled, whether you practiced that day, your UI language setting (used only to pick the notification's language), and your push subscription info are sent to this app's server (Vercel Serverless Functions). The content of your training history is never sent. Turning it back off deletes the server-side data too.",
    micTitle: 'About microphone (voice) use',
    micBody:
      "Word Mode uses your browser's speech recognition (the Web Speech API) to check your spoken answers. This app itself never collects or stores voice data, but depending on your browser, voice data may be processed on the browser vendor's servers — this is a property of the browser, not something this app controls.",
    cookieTitle: 'Cookies & analytics',
    cookieBody: 'This app uses no cookies, analytics tools, or ad tracking.',
    deletionTitle: 'Deleting your data',
    deletionBody:
      "You can delete everything at once from Settings → \"Delete all training history\". You can also clear it by removing this site's data (localStorage) from your browser settings.",
    backupBody:
      'From Settings → "Export backup", you can download all your stored data (training history and settings) as a JSON file. "Restore from backup" on the same screen lets you load that file on another device or browser (this overwrites whatever is currently stored).',
    contactTitle: 'Contact',
    contactBody: 'A contact channel is not yet available.',
    summaryNotice: 'This page is a summary. For full details, see the ',
    fullPolicyLink: 'full privacy policy',
    fullPolicyLinkSuffix: '.',
  },
  achievements: {
    'first-session': {
      label: 'First Step',
      description: 'Completed your first set',
    },
    'perfect-score': {
      label: 'Perfect',
      description: 'Got every question right in a set',
    },
    'streak-3': { label: 'Past the 3-Day Wall', description: 'A 3-day streak' },
    'streak-7': { label: 'Consistency Pays Off', description: 'A 7-day streak' },
    'streak-30': { label: 'Unstoppable', description: 'A 30-day streak' },
    'level-3-word': {
      label: 'Word Expert',
      description: 'Reached Level 3 in Word Mode',
    },
    'level-3-digit': {
      label: 'Digit Expert',
      description: 'Reached Level 3 in Digit Mode',
    },
    'level-3-nback': {
      label: 'N-Back Expert',
      description: 'Reached Level 3 in N-Back Mode',
    },
    'level-3-spatial': {
      label: 'Spatial Memory Expert',
      description: 'Reached Level 3 in Spatial Mode',
    },
    'level-3-pattern': {
      label: 'Sharp Eye',
      description: 'Reached Level 3 in Change Detection Mode',
    },
    'level-3-tone': {
      label: 'Golden Ear',
      description: 'Reached Level 3 in Tone & Color Mode',
    },
    'level-3-dual-nback': {
      label: 'Dual N-Back Expert',
      description: 'Reached Level 3 in Dual N-Back Mode',
    },
    'total-10': { label: 'Building a Habit', description: 'Completed 10 sets total' },
    'total-50': {
      label: 'Building a Habit (Advanced)',
      description: 'Completed 50 sets total',
    },
    'growing-strong': {
      label: 'Growing Strong',
      description:
        'Accuracy is improving in 2 or more modes, per "Working Memory Progress"',
    },
    'all-modes': {
      label: 'All-Rounder',
      description: 'Tried every mode',
    },
    'all-six-modes': {
      label: 'Full House',
      description:
        'Tried all six modes: Word, Digit, N-Back, Spatial, Change Detection, and Tone',
    },
    'all-eight-modes': {
      label: 'Completionist',
      description:
        'Tried all eight modes, including Dual N-Back and Random',
    },
    'all-modes-mastered': {
      label: 'Master of All',
      description: 'Reached Level 3 in all eight modes',
    },
    'player-level-5': {
      label: 'Rookie Trainer',
      description: 'Reached Player Lv.5',
    },
    'player-level-10': {
      label: 'Skilled Trainer',
      description: 'Reached Player Lv.10',
    },
    'player-level-20': {
      label: 'Master Trainer',
      description: 'Reached Player Lv.20',
    },
  },
  digit: {
    title: 'Digit Mode',
    subtitle: 'Remember the digits shown and answer — a working memory challenge.',
    gameTypes: {
      reverse: {
        title: 'Reverse',
        description: 'Enter the digits shown in reverse order',
      },
      sum: {
        title: 'Sum',
        description: 'Enter the sum of all the digits shown',
      },
    },
    levelSelectTitle: (gameTypeTitle) => `Digit Mode (${gameTypeTitle})`,
    levelLabel: (level) =>
      (
        {
          1: 'Level 1 (3 digits)',
          2: 'Level 2 (5 digits)',
          3: 'Level 3 (7 digits)',
        } as const
      )[level],
    answerPrompt: {
      reverse: 'Enter it in reverse order',
      sum: "What's the total?",
    },
    noInput: '(no input)',
    questionLabel: 'Shown: ',
  },
  nback: {
    title: 'N-Back Mode',
    subtitle:
      'A square in a 3×3 grid lights up one at a time. Press "Match" whenever the current position matches the one N steps back.',
    levelLabel: (level) =>
      (
        {
          1: 'Level 1 (compare to 1 back)',
          2: 'Level 2 (compare to 2 back)',
          3: 'Level 3 (compare to 3 back)',
        } as const
      )[level],
    trialCountTitle: 'Number of trials',
    trialCountLabel: (count) => `${count}`,
    matchPrompt: (n) => `Press "Match" if it's the same position as ${n} step${n === 1 ? '' : 's'} back`,
    matchButton: 'Match',
    matchButtonPressed: '✓ Match',
    resultLabel: (position, isMatch) =>
      isMatch ? `Position ${position + 1} (match)` : `Position ${position + 1}`,
    adaptiveLabel: 'Adaptive (recommended)',
    adaptiveDescription:
      "N automatically increases after a run of correct answers and decreases after mistakes, matching the challenge to your current skill.",
    currentNLabel: (n) => `Now: ${n} step${n === 1 ? '' : 's'} back`,
    maxNReachedLabel: (n) => `Highest N reached: ${n} step${n === 1 ? '' : 's'} back`,
  },
  dualNback: {
    title: 'Dual N-Back Mode',
    subtitle:
      'A position and a sound are shown at the same time. Press "Position Match" if the position matches N steps back, and "Sound Match" if the sound does.',
    levelLabel: (level) =>
      (
        {
          1: 'Level 1 (compare to 1 back)',
          2: 'Level 2 (compare to 2 back)',
          3: 'Level 3 (compare to 3 back)',
        } as const
      )[level],
    trialCountTitle: 'Number of trials',
    trialCountLabel: (count) => `${count}`,
    matchPrompt: (n) => `Press the matching button if it's the same as ${n} step${n === 1 ? '' : 's'} back`,
    positionMatchButton: 'Position Match',
    positionMatchButtonPressed: '✓ Position Match',
    soundMatchButton: 'Sound Match',
    soundMatchButtonPressed: '✓ Sound Match',
    resultLabel: (channel, isMatch) =>
      `${channel === 'position' ? 'Position' : 'Sound'}${isMatch ? ' (match)' : ''}`,
    adaptiveLabel: 'Adaptive (recommended)',
    adaptiveDescription:
      'N automatically increases when both position and sound stay correct, and decreases after mistakes.',
    currentNLabel: (n) => `Now: ${n} step${n === 1 ? '' : 's'} back`,
    maxNReachedLabel: (n) => `Highest N reached: ${n} step${n === 1 ? '' : 's'} back`,
  },
  spatial: {
    title: 'Spatial Mode',
    subtitle:
      'Remember the order in which squares light up, then tap them back in reverse — a working memory challenge.',
    levelLabel: (level) =>
      (
        {
          1: 'Level 1 (3×3, 3 squares)',
          2: 'Level 2 (3×3, 4 squares)',
          3: 'Level 3 (4×4, 5 squares)',
        } as const
      )[level],
    answerPrompt: 'Tap the squares back in reverse order',
    litSquaresAriaLabel: 'Remember the order they light up',
    cellAriaLabel: (index, tapOrder) =>
      `Square ${index}${tapOrder !== null ? ` (tapped ${tapOrder}${tapOrder === 1 ? 'st' : tapOrder === 2 ? 'nd' : tapOrder === 3 ? 'rd' : 'th'})` : ''}`,
    resultLabel: (cellCount) => `${cellCount} square${cellCount === 1 ? '' : 's'}`,
  },
  pattern: {
    title: 'Change Detection Mode',
    subtitle:
      'Remember a briefly shown pattern, then spot whether it changed when shown again — a working memory challenge.',
    levelLabel: (level) =>
      (
        {
          1: 'Level 1 (4×4, 4 squares)',
          2: 'Level 2 (4×4, 6 squares)',
          3: 'Level 3 (5×5, 8 squares)',
        } as const
      )[level],
    selectPrompt: 'Select every square that was blue before',
    submitButton: 'Submit',
    cellAriaLabel: (index, selected) =>
      `Square ${index}${selected ? ' (selected)' : ''}`,
  },
  random: {
    title: 'Random Mode',
    subtitle:
      'One question each from Digit (reverse/sum), Spatial, Change Detection, and Tone & Color — 5 rounds in a random order.',
    levelLabel: (level) =>
      ({ 1: 'Level 1', 2: 'Level 2', 3: 'Level 3' })[level],
    roundProgress: (current, total) => `Round ${current} / ${total}`,
    resultLabel: (correct, total) => `${correct} / ${total} correct`,
    weakPointFocusLabel: 'Focus on weak points',
    weakPointFocusDescription:
      "When on, each round's level is set automatically to whichever level has your lowest accuracy for that mode, instead of the level you picked.",
  },
  tone: {
    title: 'Tone & Color Mode',
    subtitle:
      'Remember the order in which colored pads light up with sound, then tap them back in the same order — a working memory challenge.',
    levelLabel: (level) =>
      ({ 1: 'Level 1 (3 tones)', 2: 'Level 2 (4 tones)', 3: 'Level 3 (5 tones)' })[
        level
      ],
    answerPrompt: 'Tap the pads back in the same order',
    padColors: ['Red', 'Blue', 'Green', 'Yellow'],
    padAriaLabel: (color) => `${color} pad`,
    resultLabel: (padCount) => `${padCount} tone${padCount === 1 ? '' : 's'}`,
  },
  benchmarks: {
    title: 'Working Memory Progress',
    disclaimer:
      "Instead of comparing you to general population norms, this compares your own accuracy from earlier attempts to your more recent attempts (split into two halves chronologically). It updates as you play more. This is not a medical diagnosis or a formal cognitive assessment — take it as a rough reference only.",
    bandLabels: {
      below: 'Trending down',
      average: 'About the same',
      above: 'Improving',
    },
    recentLabel: (accuracyPercent) => `Recent accuracy: ${accuracyPercent}%`,
    previousLabel: (accuracyPercent) => `Earlier accuracy: ${accuracyPercent}%`,
    digit: { label: 'Digit Mode (Reverse)' },
    'digit-sum': { label: 'Digit Mode (Sum)' },
    spatial: { label: 'Spatial Mode' },
    nback: { label: 'N-Back Mode' },
    pattern: { label: 'Change Detection Mode' },
    'dual-nback': { label: 'Dual N-Back Mode' },
    random: { label: 'Random Mode' },
    word: { label: 'Word Mode' },
    tone: { label: 'Tone & Color Mode' },
  },
}
