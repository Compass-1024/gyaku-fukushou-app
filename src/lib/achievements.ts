import { getStreakDays } from './history'
import { getAllBenchmarks } from './benchmarks'
import type { HistoryEntry, Mode } from '../types'

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

export interface Achievement {
  id: AchievementId
  icon: string
  // ラベル・説明文はi18n辞書（achievements: Record<AchievementId, ...>）が持つ
  // 英語版ではことばモードが選択できないため、これらの実績は実績グリッドに表示しない
  requiresWordMode?: boolean
  isUnlocked: (history: HistoryEntry[]) => boolean
}

function hasMode(history: HistoryEntry[], mode: Mode): boolean {
  return history.some((e) => e.mode === mode)
}

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
]

export function getUnlockedCount(history: HistoryEntry[]): number {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(history)).length
}

// beforeでは未解除だったがafterで新たに解除された実績を返す（1セット完了直後の演出用）
export function getNewlyUnlockedAchievements(
  before: HistoryEntry[],
  after: HistoryEntry[],
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => !a.isUnlocked(before) && a.isUnlocked(after),
  )
}
