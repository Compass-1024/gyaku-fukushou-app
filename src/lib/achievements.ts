import { getStreakDays } from './history'
import { getAllBenchmarks } from './benchmarks'
import { getTrainingScores } from './trainingScore'
import { computeTotalXp, getXpProgress } from './xp'
import type { HistoryEntry, Mode } from '../types'

// 実績の判定はhistory配列のみから導出する（missionCompletionsのような
// localStorageの直接参照は、セット完了直後の新規解除演出（before/after比較、
// useSetCompletionRecorder参照）で常に「解除済み」と誤判定されるため使えない）。
// trainingScore.tsのoverallスコアはカテゴリ分類にlanguageを使わないため、
// 実績判定用に'ja'固定で呼び出しても結果は変わらない
const ACHIEVEMENT_SCORE_LANGUAGE = 'ja'

// 「成長中」実績の判定に使う、正答率が向上中(band: 'above')と判定される
// モード数のしきい値
const GROWTH_ACHIEVEMENT_MODE_THRESHOLD = 2

export type AchievementId =
  | 'first-session'
  | 'perfect-score'
  | 'streak-3'
  | 'streak-7'
  | 'streak-30'
  | 'level-3-word'
  | 'level-3-digit'
  | 'level-3-nback'
  | 'level-3-spatial'
  | 'level-3-pattern'
  | 'level-3-tone'
  | 'level-3-dual-nback'
  | 'total-10'
  | 'total-50'
  | 'growing-strong'
  | 'all-modes'
  | 'all-six-modes'
  | 'all-eight-modes'
  | 'all-modes-mastered'
  | 'player-level-5'
  | 'player-level-10'
  | 'player-level-20'
  | 'score-80'
  | 'all-categories'

export interface Achievement {
  id: AchievementId
  icon: string
  // ラベル・説明文はi18n辞書（achievements: Record<AchievementId, ...>）が持つ
  // 英語版ではことばモードが選択できないため、これらの実績は実績グリッドに表示しない
  requiresWordMode?: boolean
  // missionCompletionCountはプレイヤーLv系実績のみが使う（XP計算に必要なため）。
  // 省略時は0として扱う
  isUnlocked: (history: HistoryEntry[], missionCompletionCount?: number) => boolean
}

function hasMode(history: HistoryEntry[], mode: Mode): boolean {
  return history.some((e) => e.mode === mode)
}

function hasLevel3(history: HistoryEntry[], mode: Mode): boolean {
  return history.some((e) => e.mode === mode && e.level === 3)
}

// 「全モードマスター」実績が対象とする全8モード（Mode型の全種類）
const ALL_MODES_FOR_MASTERY: readonly Mode[] = [
  'word',
  'digit',
  'nback',
  'dual-nback',
  'spatial',
  'pattern',
  'tone',
  'random',
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    icon: '🎉',
    isUnlocked: (h) => h.length >= 1,
  },
  {
    id: 'perfect-score',
    icon: '💯',
    isUnlocked: (h) => h.some((e) => e.total > 0 && e.correct === e.total),
  },
  {
    id: 'streak-3',
    icon: '🔥',
    isUnlocked: (h) => getStreakDays(h) >= 3,
  },
  {
    id: 'streak-7',
    icon: '🔥🔥',
    isUnlocked: (h) => getStreakDays(h) >= 7,
  },
  {
    id: 'streak-30',
    icon: '🔥🔥🔥',
    isUnlocked: (h) => getStreakDays(h) >= 30,
  },
  {
    id: 'level-3-word',
    icon: '🗣️',
    requiresWordMode: true,
    isUnlocked: (h) => h.some((e) => e.mode === 'word' && e.level === 3),
  },
  {
    id: 'level-3-digit',
    icon: '🔢',
    isUnlocked: (h) => h.some((e) => e.mode === 'digit' && e.level === 3),
  },
  {
    id: 'level-3-nback',
    icon: '🧠',
    isUnlocked: (h) => h.some((e) => e.mode === 'nback' && e.level === 3),
  },
  {
    id: 'level-3-spatial',
    icon: '🧩',
    isUnlocked: (h) => h.some((e) => e.mode === 'spatial' && e.level === 3),
  },
  {
    id: 'level-3-pattern',
    icon: '👀',
    isUnlocked: (h) => h.some((e) => e.mode === 'pattern' && e.level === 3),
  },
  {
    id: 'level-3-tone',
    icon: '🎵',
    isUnlocked: (h) => h.some((e) => e.mode === 'tone' && e.level === 3),
  },
  {
    id: 'level-3-dual-nback',
    icon: '🧠🧠',
    isUnlocked: (h) => h.some((e) => e.mode === 'dual-nback' && e.level === 3),
  },
  {
    id: 'total-10',
    icon: '📈',
    isUnlocked: (h) => h.length >= 10,
  },
  {
    id: 'total-50',
    icon: '🏆',
    isUnlocked: (h) => h.length >= 50,
  },
  {
    id: 'growing-strong',
    icon: '🌱',
    // 「ワーキングメモリの伸び」（自己比較ベンチマーク）で、正答率が向上中の
    // モードが2つ以上あれば解除する。実績・自己ベストと同じく履歴から都度
    // 動的計算し、専用の可変ストアは持たない
    isUnlocked: (h) =>
      getAllBenchmarks(h).filter((b) => b.band === 'above').length >=
      GROWTH_ACHIEVEMENT_MODE_THRESHOLD,
  },
  {
    id: 'all-modes',
    icon: '🌟',
    requiresWordMode: true,
    isUnlocked: (h) =>
      hasMode(h, 'word') && hasMode(h, 'digit') && hasMode(h, 'nback'),
  },
  {
    id: 'all-six-modes',
    icon: '🌈',
    requiresWordMode: true,
    isUnlocked: (h) =>
      hasMode(h, 'word') &&
      hasMode(h, 'digit') &&
      hasMode(h, 'nback') &&
      hasMode(h, 'spatial') &&
      hasMode(h, 'pattern') &&
      hasMode(h, 'tone'),
  },
  {
    id: 'all-eight-modes',
    icon: '🌠',
    requiresWordMode: true,
    isUnlocked: (h) =>
      hasMode(h, 'word') &&
      hasMode(h, 'digit') &&
      hasMode(h, 'nback') &&
      hasMode(h, 'dual-nback') &&
      hasMode(h, 'spatial') &&
      hasMode(h, 'pattern') &&
      hasMode(h, 'tone') &&
      hasMode(h, 'random'),
  },
  {
    id: 'all-modes-mastered',
    icon: '👑',
    requiresWordMode: true,
    // 個々のlevel-3-*実績を横断し、全8モードでレベル3に挑戦履歴があれば解除する
    isUnlocked: (h) => ALL_MODES_FOR_MASTERY.every((mode) => hasLevel3(h, mode)),
  },
  {
    id: 'player-level-5',
    icon: '🥉',
    // プレイヤーLv（XPシステム）が指定値に到達したら解除する。実績・自己ベストと
    // 同じく履歴（＋ミッション達成ログ件数）から都度動的計算する
    isUnlocked: (h, missionCompletionCount = 0) =>
      getXpProgress(computeTotalXp(h, missionCompletionCount)).level >= 5,
  },
  {
    id: 'player-level-10',
    icon: '🥈',
    isUnlocked: (h, missionCompletionCount = 0) =>
      getXpProgress(computeTotalXp(h, missionCompletionCount)).level >= 10,
  },
  {
    id: 'player-level-20',
    icon: '🥇',
    isUnlocked: (h, missionCompletionCount = 0) =>
      getXpProgress(computeTotalXp(h, missionCompletionCount)).level >= 20,
  },
  {
    id: 'score-80',
    icon: '🎖️',
    // 統計画面の「総合トレーニングスコア」（trainingScore.ts）が80%に到達したら
    // 解除する。overallスコアはlanguageに依存しないため、固定値で呼び出せる
    isUnlocked: (h) => {
      const score = getTrainingScores(h, ACHIEVEMENT_SCORE_LANGUAGE).overall.score
      return score !== null && score >= 80
    },
  },
  {
    id: 'all-categories',
    icon: '🧭',
    // 統計画面の3カテゴリ（数字記憶/空間記憶/注意制御）それぞれに含まれる
    // モードを最低1つずつ挑戦していれば解除する。languageに依存しないよう
    // trainingScore.tsのカテゴリ分けそのものではなく、hasModeの論理和で判定する
    isUnlocked: (h) =>
      (hasMode(h, 'word') || hasMode(h, 'digit')) &&
      (hasMode(h, 'spatial') || hasMode(h, 'pattern') || hasMode(h, 'nback')) &&
      (hasMode(h, 'dual-nback') || hasMode(h, 'tone') || hasMode(h, 'random')),
  },
]

export function getUnlockedCount(
  history: HistoryEntry[],
  missionCompletionCount = 0,
): number {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(history, missionCompletionCount))
    .length
}

// beforeでは未解除だったがafterで新たに解除された実績を返す（1セット完了直後の演出用）
export function getNewlyUnlockedAchievements(
  before: HistoryEntry[],
  after: HistoryEntry[],
  missionCompletionCountBefore = 0,
  missionCompletionCountAfter = 0,
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) =>
      !a.isUnlocked(before, missionCompletionCountBefore) &&
      a.isUnlocked(after, missionCompletionCountAfter),
  )
}
