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
    questionProgress: (current, total) => `Question ${current} / ${total}`,
    attemptStats: (accuracyPercent, attempts) =>
      `Accuracy so far: ${accuracyPercent}% (${attempts} attempt${attempts === 1 ? '' : 's'})`,
    areaLabels: {
      word: 'Word',
      'digit-reverse': 'Digits (reverse)',
      'digit-sum': 'Digits (sum)',
      nback: 'N-Back',
      spatial: 'Spatial',
      pattern: 'Change Detection',
      tone: 'Tone & Color',
    },
  },
  top: {
    heading: 'Working Memory Training',
    subtitle:
      'Train your brain by recalling what you heard or saw — in reverse.',
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
        description:
          'Listen to a word, then say it back in reverse — a working memory challenge.',
      },
      digit: {
        title: 'Digit Mode',
        description:
          'Enter the digits you saw in reverse order — a working memory challenge.',
      },
      nback: {
        title: 'N-Back Mode',
        description:
          'React when the current digit matches the one N steps back — a scientifically validated working memory task.',
      },
      spatial: {
        title: 'Spatial Mode',
        description:
          'Remember the order in which squares light up, then tap them back in reverse — a visuospatial working memory challenge.',
      },
      pattern: {
        title: 'Change Detection Mode',
        description:
          'Remember a briefly shown pattern and spot whether it changed — a working memory challenge.',
      },
      tone: {
        title: 'Tone & Color Mode',
        description:
          'Remember the order in which colored pads light up with sound, then tap them back in the same order — a non-verbal working memory challenge.',
      },
    },
  },
  share: {
    resultLine: (correct, total) =>
      `I scored ${correct}/${total} on Reverse Recall Training!`,
    streakLine: (days) => `🔥 On a ${days}-day streak`,
    achievementsLine: (labels) =>
      `🎉 New achievement${labels.length === 1 ? '' : 's'}: ${labels.join(', ')}`,
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
  },
}
