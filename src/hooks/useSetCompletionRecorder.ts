import { useEffect, useState } from 'react'
import {
  appendHistoryEntry,
  getBestSetAccuracy,
  loadHistory,
} from '../lib/history'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { syncPushState } from '../lib/push'
import {
  playCorrectSound,
  playIncorrectSound,
  playLevelUp,
  playAchievementUnlock,
} from '../lib/sound'
import { getNewlyUnlockedAchievements } from '../lib/achievements'
import type { Achievement } from '../lib/achievements'
import type { DigitGameType, Level, Mode } from '../types'

interface UseSetCompletionRecorderOptions {
  trigger: boolean
  mode: Mode
  level: Level
  gameType?: DigitGameType
  correctCount: number
  total: number
  // Nバックモードのみ、正答率に応じて正解/不正解音を再生する
  // （他モードは問題ごとに再生済みのため、セット完了時には鳴らさない）
  playAccuracySound?: boolean
}

interface SetCompletionRecorderResult {
  newAchievements: Achievement[]
  isNewBest: boolean
}

// セット（3問など)完了のたびに、履歴記録・新規実績の判定・自己ベスト更新の
// 判定・レベルアップ等の効果音再生を行う。6つのゲーム画面で共通の処理。
export function useSetCompletionRecorder({
  trigger,
  mode,
  level,
  gameType,
  correctCount,
  total,
  playAccuracySound = false,
}: UseSetCompletionRecorderOptions): SetCompletionRecorderResult {
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [isNewBest, setIsNewBest] = useState(false)

  useEffect(() => {
    if (!trigger) return
    const before = loadHistory()
    const previousBest = getBestSetAccuracy(before, mode, level, gameType)
    appendHistoryEntry({ mode, gameType, level, correct: correctCount, total })
    syncPushState()
    const after = loadHistory()
    const newly = getNewlyUnlockedAchievements(before, after)
    setNewAchievements(newly)

    const accuracyPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
    setIsNewBest(previousBest !== null && accuracyPercent > previousBest)

    if (loadSettings().soundEnabled) {
      if (playAccuracySound) {
        if (accuracyPercent >= 70) playCorrectSound()
        else playIncorrectSound()
      }
      if (newly.length > 0) playAchievementUnlock()
      const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
      if (suggestedLevel && suggestedLevel > level) playLevelUp()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, mode, level, gameType, correctCount, total, playAccuracySound])

  return { newAchievements, isNewBest }
}
