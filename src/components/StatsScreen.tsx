import { useMemo } from 'react'
import {
  getAllAreaStats,
  getWeakestAreas,
  getDailyAccuracyTrend,
  getActivityCalendar,
} from '../lib/history'
import { ACHIEVEMENTS, getUnlockedCount } from '../lib/achievements'
import { loadMissionCompletions } from '../lib/missions'
import { loadPhraseStats, getWeakestPhrases } from '../lib/phraseStats'
import { getAllBenchmarks } from '../lib/benchmarks'
import { StatsCalendarSection } from './StatsCalendarSection'
import { StatsTrendSection } from './StatsTrendSection'
import { StatsAchievementsSection } from './StatsAchievementsSection'
import { StatsAreaAccuracySection } from './StatsAreaAccuracySection'
import { StatsModeTrendSection } from './StatsModeTrendSection'
import { StatsBenchmarkSection } from './StatsBenchmarkSection'
import { StatsWeakPhrasesSection } from './StatsWeakPhrasesSection'
import { StatsSummaryImageSection } from './StatsSummaryImageSection'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { AreaStats } from '../lib/history'
import type { DigitGameType, HistoryEntry, Mode } from '../types'

interface StatsScreenProps {
  history: HistoryEntry[]
  onBack: () => void
}

const TREND_DAYS = 14
const ACTIVITY_WEEKS = 18

function areaKey(area: { mode: Mode; gameType?: DigitGameType }): string {
  return area.gameType ? `${area.mode}-${area.gameType}` : area.mode
}

export function StatsScreen({ history, onBack }: StatsScreenProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const allAreas = useMemo(() => getAllAreaStats(history), [history])
  // 英語版ではことばモードは選択できないため、統計にも出さない
  const areas = useMemo(
    () => allAreas.filter((a) => language === 'ja' || a.mode !== 'word'),
    [allAreas, language],
  )
  const achievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => language === 'ja' || !a.requiresWordMode),
    [language],
  )
  // プレイヤーLv系実績の判定にはXP計算に使うミッション達成ログ件数が必要
  const missionCompletionCount = useMemo(
    () => loadMissionCompletions().length,
    // historyの更新に連動してlocalStorageを読み直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history],
  )
  const unlockedAchievementCount = useMemo(
    () => getUnlockedCount(history, missionCompletionCount),
    [history, missionCompletionCount],
  )
  const weakest = useMemo(() => getWeakestAreas(history, 2), [history])
  const weakestKeys = useMemo(
    () => new Set(weakest.map((a) => `${areaKey(a)}-${a.level}`)),
    [weakest],
  )
  // レベルごとに縦積みで表示すると項目数(モード×3レベル)が多く縦に長くなるため、
  // モードごとに1行へまとめ、3レベル分のミニバッジを横並びにして表示する
  const areaGroups = useMemo(() => {
    const groups = new Map<string, AreaStats[]>()
    for (const area of areas) {
      const key = areaKey(area)
      const list = groups.get(key) ?? []
      list.push(area)
      groups.set(key, list)
    }
    return Array.from(groups.entries())
  }, [areas])
  const hasAnyAttempts = areas.some((a) => a.stats.attempts > 0)
  const benchmarks = useMemo(() => getAllBenchmarks(history), [history])
  const trend = useMemo(() => getDailyAccuracyTrend(history, TREND_DAYS), [history])
  const weakPhrases = useMemo(
    () => (language === 'ja' ? getWeakestPhrases(loadPhraseStats(), 5) : []),
    // historyの更新に連動してlocalStorageを読み直す
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, language],
  )
  const activityCalendar = useMemo(
    () => getActivityCalendar(history, ACTIVITY_WEEKS),
    [history],
  )

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        {t.common.back}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t.stats.heading}
      </h1>

      {!hasAnyAttempts ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t.stats.noRecordsYet}
        </p>
      ) : (
        <>
          <StatsCalendarSection calendar={activityCalendar} />
          <StatsTrendSection trend={trend} days={TREND_DAYS} />
          <StatsAchievementsSection
            history={history}
            achievements={achievements}
            unlockedCount={unlockedAchievementCount}
            missionCompletionCount={missionCompletionCount}
          />
          <StatsAreaAccuracySection areaGroups={areaGroups} weakestKeys={weakestKeys} />
          <StatsModeTrendSection history={history} days={TREND_DAYS} />
          <StatsBenchmarkSection benchmarks={benchmarks} />
          <StatsWeakPhrasesSection weakPhrases={weakPhrases} />
          <StatsSummaryImageSection history={history} />
        </>
      )}
    </div>
  )
}
