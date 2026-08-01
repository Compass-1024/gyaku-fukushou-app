import type { Level } from '../types'

// 全問正解ならレベルアップ、正答率が低ければレベルダウンを提案する
const LEVEL_UP_THRESHOLD = 100
const LEVEL_DOWN_THRESHOLD = 50

export function getSuggestedLevel(
  currentLevel: Level,
  accuracyPercent: number,
): Level | null {
  if (accuracyPercent >= LEVEL_UP_THRESHOLD && currentLevel < 3) {
    return (currentLevel + 1) as Level
  }
  if (accuracyPercent < LEVEL_DOWN_THRESHOLD && currentLevel > 1) {
    return (currentLevel - 1) as Level
  }
  return null
}
