import { getStreakDays } from './history'
import type { HistoryEntry, Mode } from '../types'

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
  | 'total-10'
  | 'total-50'
  | 'all-modes'
  | 'all-six-modes'

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
