import type { HistoryEntry } from '../types'

// 全モード共通の経験値付与ルール。実績・自己ベストと同様、履歴から動的に
// 計算する方式にし、XP専用の可変ストアは持たない（二重管理によるズレを防ぐため）
export const XP_PER_CORRECT = 10
export const XP_PERFECT_SET_BONUS = 50
export const XP_PER_MISSION = 100

export function computeHistoryXp(history: HistoryEntry[]): number {
  let xp = 0
  for (const e of history) {
    xp += e.correct * XP_PER_CORRECT
    if (e.total > 0 && e.correct === e.total) xp += XP_PERFECT_SET_BONUS
  }
  return xp
}

// 「今日のミッション」達成ボーナスだけは履歴に現れない情報のため、
// 達成回数（missionCompletions.length相当）を別途受け取って合算する
export function computeTotalXp(
  history: HistoryEntry[],
  missionCompletionCount: number,
): number {
  return computeHistoryXp(history) + missionCompletionCount * XP_PER_MISSION
}

// レベルLからL+1へ上げるのに必要な増分XP: 100, 150, 200, 250, ...（徐々に増加）
function xpNeededToLevelUp(currentLevel: number): number {
  return 100 + (currentLevel - 1) * 50
}

export interface XpProgress {
  level: number
  currentLevelXp: number
  xpToNextLevel: number
  xpForCurrentLevel: number
}

// プレイヤーは常にレベル1から開始し、累積XPに応じてレベルアップする
export function getXpProgress(totalXp: number): XpProgress {
  let level = 1
  let remaining = totalXp
  while (remaining >= xpNeededToLevelUp(level)) {
    remaining -= xpNeededToLevelUp(level)
    level += 1
  }
  const xpForCurrentLevel = xpNeededToLevelUp(level)
  return {
    level,
    currentLevelXp: remaining,
    xpToNextLevel: xpForCurrentLevel - remaining,
    xpForCurrentLevel,
  }
}
