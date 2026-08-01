import { getStreakDays } from './history'
import type { HistoryEntry, Mode } from '../types'

export interface Achievement {
  id: string
  icon: string
  label: string
  description: string
  isUnlocked: (history: HistoryEntry[]) => boolean
}

function hasMode(history: HistoryEntry[], mode: Mode): boolean {
  return history.some((e) => e.mode === mode)
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    icon: '🎉',
    label: 'はじめの一歩',
    description: '初めて1セットを完了した',
    isUnlocked: (h) => h.length >= 1,
  },
  {
    id: 'perfect-score',
    icon: '💯',
    label: 'パーフェクト',
    description: '1セットで全問正解した',
    isUnlocked: (h) => h.some((e) => e.total > 0 && e.correct === e.total),
  },
  {
    id: 'streak-3',
    icon: '🔥',
    label: '3日坊主卒業',
    description: '3日連続で挑戦した',
    isUnlocked: (h) => getStreakDays(h) >= 3,
  },
  {
    id: 'streak-7',
    icon: '🔥🔥',
    label: '継続は力なり',
    description: '7日連続で挑戦した',
    isUnlocked: (h) => getStreakDays(h) >= 7,
  },
  {
    id: 'streak-30',
    icon: '🔥🔥🔥',
    label: '猛者',
    description: '30日連続で挑戦した',
    isUnlocked: (h) => getStreakDays(h) >= 30,
  },
  {
    id: 'level-3-word',
    icon: '🗣️',
    label: 'ことば上級者',
    description: 'ことばモードのレベル3に挑戦した',
    isUnlocked: (h) => h.some((e) => e.mode === 'word' && e.level === 3),
  },
  {
    id: 'level-3-digit',
    icon: '🔢',
    label: 'すうじ上級者',
    description: 'すうじモードのレベル3に挑戦した',
    isUnlocked: (h) => h.some((e) => e.mode === 'digit' && e.level === 3),
  },
  {
    id: 'level-3-nback',
    icon: '🧠',
    label: 'Nバック上級者',
    description: 'Nバックモードのレベル3に挑戦した',
    isUnlocked: (h) => h.some((e) => e.mode === 'nback' && e.level === 3),
  },
  {
    id: 'level-3-spatial',
    icon: '🧩',
    label: '空間記憶上級者',
    description: '空間モードのレベル3に挑戦した',
    isUnlocked: (h) => h.some((e) => e.mode === 'spatial' && e.level === 3),
  },
  {
    id: 'level-3-pattern',
    icon: '👀',
    label: '観察力上級者',
    description: '変化検出モードのレベル3に挑戦した',
    isUnlocked: (h) => h.some((e) => e.mode === 'pattern' && e.level === 3),
  },
  {
    id: 'level-3-tone',
    icon: '🎵',
    label: '音感上級者',
    description: '音・色モードのレベル3に挑戦した',
    isUnlocked: (h) => h.some((e) => e.mode === 'tone' && e.level === 3),
  },
  {
    id: 'total-10',
    icon: '📈',
    label: '継続力',
    description: '累計10セットを完了した',
    isUnlocked: (h) => h.length >= 10,
  },
  {
    id: 'total-50',
    icon: '🏆',
    label: '継続力（上級）',
    description: '累計50セットを完了した',
    isUnlocked: (h) => h.length >= 50,
  },
  {
    id: 'all-modes',
    icon: '🌟',
    label: 'オールラウンダー',
    description: '全モードに挑戦した',
    isUnlocked: (h) =>
      hasMode(h, 'word') && hasMode(h, 'digit') && hasMode(h, 'nback'),
  },
  {
    id: 'all-six-modes',
    icon: '🌈',
    label: '全モード制覇',
    description: 'ことば・すうじ・Nバック・空間・変化検出・音の全6モードに挑戦した',
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
