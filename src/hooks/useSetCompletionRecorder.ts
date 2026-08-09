import { useEffect, useState } from 'react'
import {
  appendHistoryEntry,
  getBestSetAccuracy,
  getTodayBestSetAccuracy,
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
import {
  checkAndRecordMissionCompletion,
  loadMissionCompletions,
} from '../lib/missions'
import { computeTotalXp, getXpProgress } from '../lib/xp'
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
  // ④-5: 全期間の自己ベスト(isNewBest)とは別に、同日内での複数回挑戦を
  // 動機づける短期的な比較。今日すでに挑戦済みかつ今回がその中で最高の
  // 場合のみtrue（今日の初挑戦では比較対象が無いためfalse）
  isNewTodayBest: boolean
  xpGained: number
  leveledUp: boolean
  newLevel: number
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
  const [isNewTodayBest, setIsNewTodayBest] = useState(false)
  const [xpGained, setXpGained] = useState(0)
  const [leveledUp, setLeveledUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)

  useEffect(() => {
    if (!trigger) return
    const before = loadHistory()
    const previousBest = getBestSetAccuracy(before, mode, level, gameType)
    const previousTodayBest = getTodayBestSetAccuracy(before, mode, level, gameType)
    const completionsBefore = loadMissionCompletions()
    const language = loadSettings().language
    const xpBefore = computeTotalXp(before, completionsBefore.length)

    appendHistoryEntry({ mode, gameType, level, correct: correctCount, total })
    syncPushState()
    const after = loadHistory()

    // 今日のミッションがこのセット完了により初めて達成されたかを判定し、
    // 達成していればXP付与用のミッション完了ログに記録する
    const newMissionCompletions = checkAndRecordMissionCompletion(after, language)
    const completionsAfter = loadMissionCompletions()
    const newly = getNewlyUnlockedAchievements(
      before,
      after,
      completionsBefore.length,
      completionsAfter.length,
    )
    setNewAchievements(newly)
    const xpAfter = computeTotalXp(after, completionsAfter.length)
    const gained = xpAfter - xpBefore
    setXpGained(gained)
    const levelBefore = getXpProgress(xpBefore).level
    const levelAfter = getXpProgress(xpAfter).level
    setLeveledUp(levelAfter > levelBefore)
    setNewLevel(levelAfter)

    const accuracyPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
    setIsNewBest(previousBest !== null && accuracyPercent > previousBest)
    setIsNewTodayBest(previousTodayBest !== null && accuracyPercent > previousTodayBest)

    if (loadSettings().soundEnabled) {
      if (playAccuracySound) {
        if (accuracyPercent >= 70) playCorrectSound()
        else playIncorrectSound()
      }
      if (newly.length > 0) playAchievementUnlock()
      if (newMissionCompletions > 0) playAchievementUnlock()
      const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
      if ((suggestedLevel && suggestedLevel > level) || levelAfter > levelBefore) {
        playLevelUp()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, mode, level, gameType, correctCount, total, playAccuracySound])

  return { newAchievements, isNewBest, isNewTodayBest, xpGained, leveledUp, newLevel }
}
