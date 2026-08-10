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
import { computeTotalXp, getXpProgress } from '../lib/xp'
import { getRollingProgramProgress } from '../lib/program'
import {
  hasCompletedTodayChallenge,
  loadDailyChallengeCompletions,
} from '../lib/dailyChallenge'
import { getAllBenchmarks } from '../lib/benchmarks'
import type { Benchmark } from '../lib/benchmarks'
import { getModeCards } from '../lib/modeCardsConfig'
import type { TopModeSelection } from '../lib/modeCardsConfig'
import { TopEngagementChips } from './TopEngagementChips'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry } from '../types'

export type { TopModeSelection } from '../lib/modeCardsConfig'

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
  const isOnline = useOnlineStatus()

  // ホーム画面の3×3グリッドに表示するモードカード。ことばモードのみ
  // 英語版では選択できないため対象外にする
  const modeCards = getModeCards(t).filter(
    (card) => card.mode !== 'word' || language === 'ja',
  )

  // 「ワーキングメモリの伸び」で正答率が向上中（band: 'above'）のモードには、
  // 統計画面を開かなくても気づけるようホームカードに🌱バッジを表示する
  const growingCardModes = new Set(
    getAllBenchmarks(history)
      .filter((b) => b.band === 'above')
      .map((b) => BENCHMARK_MODE_TO_CARD_MODE[b.mode]),
  )

  // fix③-5: デイリーチャレンジはhistoryに記録しない（4桁固定という出題
  // 特性上、既存モードの正答率統計に混ぜると数値が歪むため）が、その分
  // 「プレイした日」としてはストリーク・7日間チャレンジに反映されるべき
  // なので、日付キーの集合として別経路で連携する
  const dailyChallengeDateKeys = new Set(
    loadDailyChallengeCompletions().map((c) => c.dateKey),
  )
  const streakDays = getStreakDays(history, new Date(), dailyChallengeDateKeys)
  const todayCount = getTodayCount(history)
  const challengeCompletedToday = hasCompletedTodayChallenge()
  const dailyGoal = loadSettings().dailyGoal
  const goalProgress =
    dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0
  // 英語版ではことばモードは選択できないため、過去（日本語版利用時）の
  // ことばモード履歴がおすすめ候補に出てこないよう除外する
  const recommended = getWeakestAreas(history, language === 'en' ? 8 : 1).find(
    (area) => language === 'ja' || area.mode !== 'word',
  )
  const streakAtRisk =
    streakDays > 0 && todayCount === 0 && !challengeCompletedToday

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

  // ④-4: 「今日のミッション」（単日完結）を補う、複数日にまたがる目標。
  // データが無い新規ユーザーにいきなり「0/7」を見せないよう、履歴が
  // あるユーザーにのみ表示する
  const programProgress = getRollingProgramProgress(
    history,
    new Date(),
    dailyChallengeDateKeys,
  )
  const showProgramCard = history.length > 0 || dailyChallengeDateKeys.size > 0

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

        {/* ③: プレイヤーLv・今日の目標を縦積みの2ブロックから横並び2カラムの
            1行にまとめ、高さを圧縮する。詳細（あと何XP等）はtitle属性に retain */}
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

      {/* モード選択はアプリの主目的の操作なので、ゲーミフィケーション要素
          （ミッション・週間振り返り・おすすめ）より先にファーストビューへ入るよう
          このグリッドを上に配置する（③-10: 旧レイアウトはこの下に4つのカードが
          積み上がりモード選択がスクロールしないと見えなかった） */}
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
            <span className="line-clamp-1 w-full text-[9px] leading-snug opacity-90 sm:text-[10px]">
              {card.description}
            </span>
          </button>
        ))}
      </div>

      <TopEngagementChips
        missionLabel={missionLabel}
        missionCompleted={missionCompleted}
        missionClickable={missionClickable}
        onMissionClick={handleMissionClick}
        challengeCompletedToday={challengeCompletedToday}
        showProgramCard={showProgramCard}
        programProgress={programProgress}
      />

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
