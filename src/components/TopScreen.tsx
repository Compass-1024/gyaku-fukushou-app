import { useEffect, useState } from 'react'
import { getStreakDays, getTodayCount, getWeakestAreas } from '../lib/history'
import type { AreaStats } from '../lib/history'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import {
  getWeeklyRecap,
  getLastShownRecapWeekKey,
  markRecapShown,
} from '../lib/recap'
import type { WeeklyRecap } from '../lib/recap'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry, Mode } from '../types'

interface TopScreenProps {
  history: HistoryEntry[]
  onSelect: (mode: Mode) => void
  onOpenSettings: () => void
  onOpenStats: () => void
  onStartRecommended: (area: AreaStats) => void
}

export function TopScreen({
  history,
  onSelect,
  onOpenSettings,
  onOpenStats,
  onStartRecommended,
}: TopScreenProps) {
  const t = useTranslation()
  const { language } = useLanguage()

  function areaLabel(area: AreaStats): string {
    const key = area.gameType ? `${area.mode}-${area.gameType}` : area.mode
    const label = t.common.areaLabels[key as keyof typeof t.common.areaLabels]
    return t.stats.areaLabel(label, area.level)
  }

  const streakDays = getStreakDays(history)
  const todayCount = getTodayCount(history)
  const dailyGoal = loadSettings().dailyGoal
  const goalProgress =
    dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0
  // 英語版ではことばモードは選択できないため、過去（日本語版利用時）の
  // ことばモード履歴がおすすめ候補に出てこないよう除外する
  const recommended = getWeakestAreas(history, language === 'en' ? 8 : 1).find(
    (area) => language === 'ja' || area.mode !== 'word',
  )
  const streakAtRisk = streakDays > 0 && todayCount === 0

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

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onOpenStats}
          aria-label={t.common.stats}
          className="touch-manipulation rounded-full p-2 text-xl text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
        >
          📊
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t.common.settings}
          className="touch-manipulation rounded-full p-2 text-xl text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
        >
          ⚙️
        </button>
      </div>

      <div className="-mt-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.top.heading}
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t.top.subtitle}
        </p>
        {history.length > 0 && (
          <div className="mt-3 flex justify-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            {streakDays > 0 && <span>{t.top.streakDays(streakDays)}</span>}
            {todayCount > 0 && <span>{t.top.todayCount(todayCount)}</span>}
          </div>
        )}

        {dailyGoal > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.top.dailyGoal(todayCount, dailyGoal)}
            </p>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}
        {streakAtRisk && (
          <p
            role="status"
            className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400"
          >
            {t.top.streakAtRisk(streakDays)}
          </p>
        )}
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

      {recommended && (
        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onStartRecommended(recommended)
          }}
          className="touch-manipulation rounded-xl border border-dashed border-indigo-300 bg-indigo-50/60 px-4 py-3 text-left transition hover:bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30"
        >
          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">
            {t.top.recommendedTitle}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
            {t.top.recommendedSummary(
              areaLabel(recommended),
              recommended.stats.accuracy ?? 0,
            )}
          </p>
        </button>
      )}

      <div className="flex flex-col gap-5">
        {language === 'ja' && (
          <button
            type="button"
            onClick={() => {
              if (loadSettings().soundEnabled) playButtonTap()
              onSelect('word')
            }}
            className="touch-manipulation rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-6 py-6 text-left text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            <span className="text-4xl">🗣️</span>
            <p className="mt-2 text-xl font-bold">{t.top.modes.word.title}</p>
            <p className="mt-1 text-sm opacity-90">
              {t.top.modes.word.description}
            </p>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('digit')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-6 text-left text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <span className="text-4xl">🔢</span>
          <p className="mt-2 text-xl font-bold">{t.top.modes.digit.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {t.top.modes.digit.description}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('sequence')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 px-6 py-6 text-left text-white shadow-lg shadow-teal-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          <span className="text-4xl">📝</span>
          <p className="mt-2 text-xl font-bold">{t.top.modes.sequence.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {t.top.modes.sequence.description}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('nback')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 px-6 py-6 text-left text-white shadow-lg shadow-rose-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          <span className="text-4xl">🧠</span>
          <p className="mt-2 text-xl font-bold">{t.top.modes.nback.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {t.top.modes.nback.description}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('spatial')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 px-6 py-6 text-left text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
        >
          <span className="text-4xl">🧩</span>
          <p className="mt-2 text-xl font-bold">{t.top.modes.spatial.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {t.top.modes.spatial.description}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('pattern')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 px-6 py-6 text-left text-white shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          <span className="text-4xl">👀</span>
          <p className="mt-2 text-xl font-bold">{t.top.modes.pattern.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {t.top.modes.pattern.description}
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('tone')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 px-6 py-6 text-left text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <span className="text-4xl">🎵</span>
          <p className="mt-2 text-xl font-bold">{t.top.modes.tone.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {t.top.modes.tone.description}
          </p>
        </button>
      </div>
    </div>
  )
}
