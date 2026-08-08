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
import {
  getTodayMission,
  isTodayMissionComplete,
  loadMissionCompletions,
} from '../lib/missions'
import { computeTotalXp, getXpProgress, XP_PER_MISSION } from '../lib/xp'
import { getAllBenchmarks } from '../lib/benchmarks'
import type { Benchmark } from '../lib/benchmarks'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry, Mode } from '../types'

// ホームの3×3グリッド用の選択キー。すうじモードは「逆から入力」「合計を入力」を
// 独立したカードとして扱うため、Mode型の'digit'ではなくこの拡張キーを使う
export type TopModeSelection = Exclude<Mode, 'digit'> | 'digit-reverse' | 'digit-sum'

// ベンチマークのモードキーとホームカードの選択キーの対応
// （すうじの逆から入力のみキーが異なる: 'digit' → 'digit-reverse'）
const BENCHMARK_MODE_TO_CARD_MODE: Record<Benchmark['mode'], TopModeSelection> = {
  digit: 'digit-reverse',
  'digit-sum': 'digit-sum',
  spatial: 'spatial',
  nback: 'nback',
  pattern: 'pattern',
  'dual-nback': 'dual-nback',
  random: 'random',
  word: 'word',
  tone: 'tone',
}

interface TopScreenProps {
  history: HistoryEntry[]
  onSelect: (mode: TopModeSelection) => void
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

  // ホーム画面の3×3グリッドに表示するモードカードのメタデータ。
  // ことばモードのみ英語版では選択できないため対象外にする
  const allModeCards: Array<{
    mode: TopModeSelection
    icon: string
    gradient: string
    title: string
    description: string
  }> = [
    {
      mode: 'word',
      icon: '🗣️',
      gradient: 'from-emerald-500 to-teal-500',
      title: t.top.modes.word.title,
      description: t.top.modes.word.description,
    },
    {
      mode: 'digit-reverse',
      icon: '🔢',
      gradient: 'from-indigo-500 to-fuchsia-500',
      title: t.top.modes.digitReverse.title,
      description: t.top.modes.digitReverse.description,
    },
    {
      mode: 'digit-sum',
      icon: '➕',
      gradient: 'from-teal-500 to-sky-500',
      title: t.top.modes.digitSum.title,
      description: t.top.modes.digitSum.description,
    },
    {
      mode: 'nback',
      icon: '🧠',
      gradient: 'from-rose-500 to-orange-500',
      title: t.top.modes.nback.title,
      description: t.top.modes.nback.description,
    },
    {
      mode: 'dual-nback',
      icon: '🧠🧠',
      gradient: 'from-purple-500 to-rose-500',
      title: t.top.modes.dualNback.title,
      description: t.top.modes.dualNback.description,
    },
    {
      mode: 'spatial',
      icon: '🧩',
      gradient: 'from-cyan-500 to-blue-500',
      title: t.top.modes.spatial.title,
      description: t.top.modes.spatial.description,
    },
    {
      mode: 'pattern',
      icon: '👀',
      gradient: 'from-amber-500 to-yellow-500',
      title: t.top.modes.pattern.title,
      description: t.top.modes.pattern.description,
    },
    {
      mode: 'tone',
      icon: '🎵',
      gradient: 'from-violet-500 to-pink-500',
      title: t.top.modes.tone.title,
      description: t.top.modes.tone.description,
    },
    {
      mode: 'random',
      icon: '🎲',
      gradient: 'from-fuchsia-500 to-orange-400',
      title: t.top.modes.random.title,
      description: t.top.modes.random.description,
    },
  ]
  const modeCards = allModeCards.filter(
    (card) => card.mode !== 'word' || language === 'ja',
  )

  // 「ワーキングメモリの伸び」で正答率が向上中（band: 'above'）のモードには、
  // 統計画面を開かなくても気づけるようホームカードに🌱バッジを表示する
  const growingCardModes = new Set(
    getAllBenchmarks(history)
      .filter((b) => b.band === 'above')
      .map((b) => BENCHMARK_MODE_TO_CARD_MODE[b.mode]),
  )

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

  // プレイヤーレベル/経験値は履歴＋ミッション達成ログから都度計算する
  // （実績と同じ哲学。専用の可変ストアは持たない）
  const missionCompletions = loadMissionCompletions()
  const totalXp = computeTotalXp(history, missionCompletions.length)
  const xpProgress = getXpProgress(totalXp)
  const xpBarPercent = Math.round(
    (xpProgress.currentLevelXp / xpProgress.xpForCurrentLevel) * 100,
  )

  const todayMission = getTodayMission(language)
  const missionLabel =
    todayMission.spec.kind === 'playCount'
      ? t.missions.playCountLabel(
          t.common.areaLabels[
            (todayMission.spec.mode === 'digit'
              ? 'digit-reverse'
              : todayMission.spec.mode) as keyof typeof t.common.areaLabels
          ],
          todayMission.spec.count,
        )
      : t.missions.accuracyLabel(todayMission.spec.percent)
  const missionCompleted = isTodayMissionComplete(history, language)

  // ミッションカードをクリックしたら該当モードへ直接遷移する。プレイ回数系
  // ミッションはモードが決まっているためそのモードの選択画面へ、正答率系
  // ミッションは対象モードを問わないため「今日のおすすめ」があればそちらへ飛ぶ
  function handleMissionClick() {
    if (loadSettings().soundEnabled) playButtonTap()
    if (todayMission.spec.kind === 'playCount') {
      const mode = todayMission.spec.mode
      onSelect(mode === 'digit' ? 'digit-reverse' : (mode as TopModeSelection))
    } else if (recommended) {
      onStartRecommended(recommended)
    }
  }
  const missionClickable =
    todayMission.spec.kind === 'playCount' || recommended !== undefined

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
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

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">
              {t.top.playerLevel(xpProgress.level)}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t.top.xpToNextLevel(xpProgress.xpToNextLevel)}
            </p>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
              style={{ width: `${xpBarPercent}%` }}
            />
          </div>
        </div>

        {dailyGoal > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
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
            className="mt-3 text-xs font-medium text-amber-600 sm:text-sm dark:text-amber-400"
          >
            {t.top.streakAtRisk(streakDays)}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={!missionClickable}
        onClick={handleMissionClick}
        className={`animate-pop touch-manipulation rounded-xl border px-4 py-3 text-left transition disabled:cursor-default ${
          missionCompleted
            ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
            : 'border-gray-200 bg-white hover:enabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:enabled:bg-gray-700/60'
        }`}
      >
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t.missions.cardTitle}
        </p>
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{missionLabel}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {missionCompleted
            ? t.missions.completedBadge
            : t.missions.xpReward(XP_PER_MISSION)}
        </p>
      </button>

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

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {modeCards.map((card) => (
          <button
            key={card.mode}
            type="button"
            onClick={() => {
              if (loadSettings().soundEnabled) playButtonTap()
              onSelect(card.mode)
            }}
            aria-label={
              growingCardModes.has(card.mode)
                ? `${card.title}: ${card.description} (${t.top.growingBadgeLabel})`
                : `${card.title}: ${card.description}`
            }
            className={`relative touch-manipulation flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br ${card.gradient} p-2 text-center text-white shadow-md ring-1 ring-white/10 transition hover:scale-[1.04] hover:shadow-lg active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-3`}
          >
            {growingCardModes.has(card.mode) && (
              <span
                aria-hidden="true"
                title={t.top.growingBadgeLabel}
                className="absolute top-1 right-1 text-xs drop-shadow"
              >
                🌱
              </span>
            )}
            <span className="text-2xl sm:text-3xl" aria-hidden="true">
              {card.icon}
            </span>
            <span className="text-[11px] leading-tight font-bold sm:text-xs">
              {card.title}
            </span>
            <span className="line-clamp-2 text-[9px] leading-snug opacity-90 sm:text-[10px]">
              {card.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
