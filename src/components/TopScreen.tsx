import { useEffect, useState } from 'react'
import { getStreakDays, getTodayCount } from '../lib/history'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import {
  getWeeklyRecap,
  getLastShownRecapWeekKey,
  markRecapShown,
} from '../lib/recap'
import type { WeeklyRecap } from '../lib/recap'
import { computeTotalXp, getXpProgress } from '../lib/xp'
import { loadMissionCompletions } from '../lib/missions'
import { getDailyMissionTarget, isDailyMissionComplete } from '../lib/dailyMission'
import { loadDailyChallengeCompletions } from '../lib/dailyChallenge'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry } from '../types'

interface TopScreenProps {
  history: HistoryEntry[]
  onSelectRandom: () => void
  onSelectModeSelect: () => void
  onSelectDailyMission: () => void
  onOpenSettings: () => void
  onOpenStats: () => void
}

// ホーム画面。③: ランダムモード/個別選択モード/今日のミッションの3ボタンに
// シンプル化した（旧版の3×3・9モードグリッドはModeSelectScreen.tsxへ、
// 今日のミッション/本日のお題/7日間チャレンジの3チップ行は撤去し、
// 今日のミッションはDailyMissionScreen.tsxとして独立した画面にした）
export function TopScreen({
  history,
  onSelectRandom,
  onSelectModeSelect,
  onSelectDailyMission,
  onOpenSettings,
  onOpenStats,
}: TopScreenProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const isOnline = useOnlineStatus()

  // fix③-5: デイリーチャレンジはhistoryに記録しない（4桁固定という出題
  // 特性上、既存モードの正答率統計に混ぜると数値が歪むため）が、その分
  // 「プレイした日」としてはストリークに反映されるべきなので、日付キーの
  // 集合として別経路で連携する
  const dailyChallengeDateKeys = new Set(
    loadDailyChallengeCompletions().map((c) => c.dateKey),
  )
  const streakDays = getStreakDays(history, new Date(), dailyChallengeDateKeys)
  const todayCount = getTodayCount(history)
  const dailyGoal = loadSettings().dailyGoal
  const goalProgress =
    dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0
  const dailyMissionCompleted = isDailyMissionComplete(
    history,
    getDailyMissionTarget(history, language),
  )
  const streakAtRisk = streakDays > 0 && todayCount === 0 && !dailyMissionCompleted

  // プレイヤーレベル/経験値は履歴＋ミッション達成ログから都度計算する
  // （実績と同じ哲学。専用の可変ストアは持たない）
  const missionCompletions = loadMissionCompletions()
  const totalXp = computeTotalXp(history, missionCompletions.length)
  const xpProgress = getXpProgress(totalXp)
  const xpBarPercent = Math.round(
    (xpProgress.currentLevelXp / xpProgress.xpForCurrentLevel) * 100,
  )

  // 週が変わるたびに、直近に完了した週の振り返りを1回だけ表示する
  const [recap, setRecap] = useState<WeeklyRecap | null>(null)
  useEffect(() => {
    const latest = getWeeklyRecap(history)
    if (latest && latest.weekKey !== getLastShownRecapWeekKey()) {
      setRecap(latest)
    } else {
      setRecap(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history])

  function handleDismissRecap() {
    if (recap) markRecapShown(recap.weekKey)
    setRecap(null)
  }

  function withTap(fn: () => void) {
    if (loadSettings().soundEnabled) playButtonTap()
    fn()
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      {!isOnline && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        >
          {t.top.offlineBanner}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onOpenStats}
          aria-label={t.common.stats}
          className="touch-manipulation flex min-h-12 min-w-12 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
        >
          📊
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t.common.settings}
          className="touch-manipulation flex min-h-12 min-w-12 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
        >
          ⚙️
        </button>
      </div>

      <div className="-mt-2 rounded-3xl border border-white/60 bg-white/70 px-5 py-6 text-center shadow-sm backdrop-blur-sm sm:px-8 sm:py-8 dark:border-gray-700/60 dark:bg-gray-800/60">
        <h1 className="text-2xl leading-tight font-extrabold text-gray-900 sm:text-3xl dark:text-gray-100">
          {t.top.heading}
        </h1>
        <p className="mt-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
          {t.top.subtitle}
        </p>
        {history.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-medium text-gray-600 sm:text-sm dark:text-gray-300">
            {streakDays > 0 && <span>{t.top.streakDays(streakDays)}</span>}
            {todayCount > 0 && <span>{t.top.todayCount(todayCount)}</span>}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <div
            className="min-w-0 flex-1"
            title={t.top.xpToNextLevel(xpProgress.xpToNextLevel)}
          >
            <p className="truncate text-xs font-semibold text-indigo-500 dark:text-indigo-300">
              {t.top.playerLevel(xpProgress.level)}
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
                style={{ width: `${xpBarPercent}%` }}
              />
            </div>
          </div>

          {dailyGoal > 0 && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {t.top.dailyGoal(todayCount, dailyGoal)}
              </p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {streakAtRisk && (
          <p
            role="status"
            className="mt-3 text-xs font-medium text-amber-600 sm:text-sm dark:text-amber-400"
          >
            {t.top.streakAtRisk(streakDays)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => withTap(onSelectRandom)}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-fuchsia-500 to-orange-400 px-5 py-5 text-left text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
        >
          <p className="text-lg font-bold">{t.top.buttons.random.title}</p>
          <p className="mt-1 text-sm opacity-90">{t.top.buttons.random.description}</p>
        </button>

        <button
          type="button"
          onClick={() => withTap(onSelectModeSelect)}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 px-5 py-5 text-left text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
        >
          <p className="text-lg font-bold">{t.top.buttons.modeSelect.title}</p>
          <p className="mt-1 text-sm opacity-90">{t.top.buttons.modeSelect.description}</p>
        </button>

        <button
          type="button"
          onClick={() => withTap(onSelectDailyMission)}
          className={`touch-manipulation rounded-2xl px-5 py-5 text-left shadow-md transition hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] ${
            dailyMissionCompleted
              ? 'bg-gray-100 text-gray-500 grayscale dark:bg-gray-800 dark:text-gray-400'
              : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
          }`}
        >
          <p className="text-lg font-bold">
            {dailyMissionCompleted ? '✅' : t.top.buttons.dailyMission.title}
          </p>
          <p className="mt-1 text-sm opacity-90">
            {dailyMissionCompleted
              ? t.missions.completedBadge
              : t.top.buttons.dailyMission.description}
          </p>
        </button>
      </div>

      {recap && (
        <div className="animate-pop relative rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800 dark:bg-sky-900/20">
          <button
            type="button"
            onClick={handleDismissRecap}
            aria-label={t.top.dismissRecap}
            className="absolute top-2 right-2 touch-manipulation rounded-full p-1 text-sky-400 hover:bg-sky-100 dark:text-sky-500 dark:hover:bg-sky-900/40"
          >
            ✕
          </button>
          <p className="text-xs font-semibold text-sky-600 dark:text-sky-300">
            {t.top.recapTitle}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
            {t.top.recapSummary(recap.totalSets, recap.accuracyPercent)}
          </p>
          {recap.previousWeekSets > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {recap.totalSets > recap.previousWeekSets &&
                t.top.recapIncrease(recap.previousWeekSets)}
              {recap.totalSets < recap.previousWeekSets &&
                t.top.recapDecrease(recap.previousWeekSets)}
              {recap.totalSets === recap.previousWeekSets && t.top.recapSame}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
