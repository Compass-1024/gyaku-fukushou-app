import { useMemo, useState } from 'react'
import {
  getAllAreaStats,
  getWeakestAreas,
  getDailyAccuracyTrend,
  getActivityCalendar,
  localDateKey,
} from '../lib/history'
import { ACHIEVEMENTS, getUnlockedCount } from '../lib/achievements'
import type { AchievementId } from '../lib/achievements'
import { loadMissionCompletions } from '../lib/missions'
import { loadPhraseStats, getWeakestPhrases } from '../lib/phraseStats'
import { findPhraseById } from '../lib/phrases'
import { getAllBenchmarks } from '../lib/benchmarks'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { AreaStats, ActivityDay, DailyAccuracy } from '../lib/history'
import type { Translations } from '../lib/i18n'
import type { Benchmark } from '../lib/benchmarks'
import type { DigitGameType, HistoryEntry, Mode } from '../types'

interface StatsScreenProps {
  history: HistoryEntry[]
  onBack: () => void
}

const TREND_DAYS = 14
const ACTIVITY_WEEKS = 18

function activityLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

const ACTIVITY_LEVEL_CLASSES: Record<0 | 1 | 2 | 3, string> = {
  0: 'fill-gray-100 dark:fill-gray-700',
  1: 'fill-indigo-200 dark:fill-indigo-900',
  2: 'fill-indigo-400 dark:fill-indigo-600',
  3: 'fill-indigo-600 dark:fill-indigo-400',
}

// 行ラベルは全曜日を表示すると詰まって読みにくいため、GitHubの草生やしと
// 同様に隔週（月・水・金）だけ表示する
const WEEKDAY_LABEL_ROWS = [1, 3, 5]

function ActivityHeatmap({
  calendar,
  t,
}: {
  calendar: ActivityDay[]
  t: Translations
}) {
  const weeks = calendar.length / 7
  const gap = 2
  const cellSize = 12
  const weekdayLabelWidth = 16
  const monthLabelHeight = 12
  const gridWidth = weeks * cellSize + (weeks - 1) * gap
  const gridHeight = 7 * cellSize + 6 * gap
  const width = gridWidth + weekdayLabelWidth
  const height = gridHeight + monthLabelHeight
  const activeDays = calendar.filter((d) => d.count > 0).length
  const todayKey = localDateKey(new Date())

  // 月が切り替わる列にだけ月ラベルを表示する（全列に出すと詰まって読みにくいため）
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  for (let col = 0; col < weeks; col++) {
    const day = calendar[col * 7]
    if (!day) continue
    const month = Number(day.dateKey.slice(5, 7)) - 1
    if (month !== lastMonth) {
      monthLabels.push({ col, label: t.stats.monthLabels[month] })
      lastMonth = month
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.stats.calendarCaption}
      </p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={t.stats.calendarAriaLabel(weeks, activeDays)}
        >
          {monthLabels.map(({ col, label }) => (
            <text
              key={col}
              x={weekdayLabelWidth + col * (cellSize + gap)}
              y={monthLabelHeight - 3}
              fontSize={8}
              className="fill-gray-500 dark:fill-gray-400"
            >
              {label}
            </text>
          ))}
          {WEEKDAY_LABEL_ROWS.map((row) => (
            <text
              key={row}
              x={0}
              y={monthLabelHeight + row * (cellSize + gap) + cellSize - 2}
              fontSize={8}
              className="fill-gray-500 dark:fill-gray-400"
            >
              {t.stats.weekdayLabels[row]}
            </text>
          ))}
          {calendar.map((day, i) => {
            if (day.count < 0) return null
            const col = Math.floor(i / 7)
            const row = day.weekday
            const x = weekdayLabelWidth + col * (cellSize + gap)
            const y = monthLabelHeight + row * (cellSize + gap)
            return (
              <rect
                key={day.dateKey}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                className={`${ACTIVITY_LEVEL_CLASSES[activityLevel(day.count)]} ${
                  day.dateKey === todayKey
                    ? 'stroke-indigo-500 dark:stroke-indigo-300'
                    : ''
                }`}
                strokeWidth={day.dateKey === todayKey ? 1.5 : 0}
              >
                <title>{t.stats.dayCellTooltip(day.dateKey, day.count)}</title>
              </rect>
            )
          })}
        </svg>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{t.stats.calendarSummary(weeks, activeDays)}</span>
        <span className="flex items-center gap-1">
          {t.stats.calendarLegendLow}
          {([0, 1, 2, 3] as const).map((level) => (
            <span key={level} className="flex flex-col items-center gap-0.5">
              <svg width={10} height={10} aria-hidden="true">
                <rect
                  width={10}
                  height={10}
                  rx={2}
                  className={ACTIVITY_LEVEL_CLASSES[level]}
                />
              </svg>
              <span aria-hidden="true" className="text-[8px] leading-none">
                {t.stats.calendarLegendCount(level)}
              </span>
            </span>
          ))}
          {t.stats.calendarLegendHigh}
        </span>
      </div>
    </div>
  )
}

function areaKey(area: { mode: Mode; gameType?: DigitGameType }): string {
  return area.gameType ? `${area.mode}-${area.gameType}` : area.mode
}

function benchmarkCopy(t: Translations, benchmark: Benchmark) {
  return t.benchmarks[benchmark.mode]
}

const BAND_CLASSES: Record<Benchmark['band'], string> = {
  below: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
  average:
    'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30',
  above:
    'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30',
}

const BAND_TEXT_CLASSES: Record<Benchmark['band'], string> = {
  below: 'text-gray-600 dark:text-gray-300',
  average: 'text-emerald-700 dark:text-emerald-300',
  above: 'text-indigo-700 dark:text-indigo-300',
}

const BAND_ARROWS: Record<Benchmark['band'], string> = {
  below: '↓',
  average: '→',
  above: '↑',
}

function AccuracyTrendChart({
  trend,
  t,
}: {
  trend: DailyAccuracy[]
  t: Translations
}) {
  const width = 320
  const chartHeight = 90
  const labelHeight = 16
  const barGap = 3
  const barWidth = (width - barGap * (trend.length - 1)) / trend.length

  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight + labelHeight}`}
      className="w-full"
      role="img"
      aria-label={t.stats.trendAriaLabel(TREND_DAYS)}
    >
      {[0, 50, 100].map((v) => {
        const y = chartHeight - (v / 100) * chartHeight
        return (
          <line
            key={v}
            x1={0}
            x2={width}
            y1={y}
            y2={y}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth={1}
          />
        )
      })}
      {trend.map((d, i) => {
        const x = i * (barWidth + barGap)
        const isToday = i === trend.length - 1
        if (d.accuracy === null) {
          return (
            <rect
              key={d.dateKey}
              x={x}
              y={chartHeight - 3}
              width={barWidth}
              height={3}
              rx={1.5}
              className="fill-gray-300 dark:fill-gray-600"
            >
              <title>{t.stats.trendNoRecord(d.dateKey)}</title>
            </rect>
          )
        }
        const barHeight = Math.max(2, (d.accuracy / 100) * chartHeight)
        return (
          <g key={d.dateKey}>
            <rect
              x={x}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={2}
              className="fill-indigo-500 dark:fill-indigo-400"
            >
              <title>{`${d.dateKey}: ${d.accuracy}%`}</title>
            </rect>
            {isToday && (
              <text
                x={x + barWidth / 2}
                y={Math.max(8, chartHeight - barHeight - 4)}
                textAnchor="middle"
                fontSize={8}
                className="fill-gray-600 dark:fill-gray-300"
              >
                {d.accuracy}%
              </text>
            )}
          </g>
        )
      })}
      <text
        x={0}
        y={chartHeight + labelHeight - 4}
        fontSize={8}
        className="fill-gray-500 dark:fill-gray-400"
      >
        {t.stats.trendDaysAgo(TREND_DAYS)}
      </text>
      <text
        x={width}
        y={chartHeight + labelHeight - 4}
        textAnchor="end"
        fontSize={8}
        className="fill-gray-500 dark:fill-gray-400"
      >
        {t.stats.trendToday}
      </text>
    </svg>
  )
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
  // スマホではホバーできないため、タップした実績の説明をインラインで表示する
  const [selectedAchievementId, setSelectedAchievementId] =
    useState<AchievementId | null>(null)
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
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t.stats.calendarTitle}
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
              <ActivityHeatmap calendar={activityCalendar} t={t} />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t.stats.trendTitle(TREND_DAYS)}
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
              <AccuracyTrendChart trend={trend} t={t} />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {t.stats.achievementsTitle}
              </h2>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t.stats.achievementsCountLabel(
                  unlockedAchievementCount,
                  achievements.length,
                )}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {achievements.map((achievement) => {
                const unlocked = achievement.isUnlocked(
                  history,
                  missionCompletionCount,
                )
                const copy = t.achievements[achievement.id]
                const isSelected = selectedAchievementId === achievement.id
                return (
                  <button
                    key={achievement.id}
                    type="button"
                    title={copy.description}
                    aria-expanded={isSelected}
                    onClick={() =>
                      setSelectedAchievementId(isSelected ? null : achievement.id)
                    }
                    className={`touch-manipulation flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition ${
                      unlocked
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                        : 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800/50'
                    } ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                  >
                    <span aria-hidden="true" className="text-xl">
                      {achievement.icon}
                    </span>
                    <span className="line-clamp-1 text-[9px] leading-tight font-medium text-gray-700 dark:text-gray-200">
                      {copy.label}
                    </span>
                    <span className="sr-only">
                      {unlocked
                        ? t.stats.achievementUnlocked
                        : t.stats.achievementLocked}
                      {copy.description}
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedAchievementId &&
              (() => {
                const selected = achievements.find(
                  (a) => a.id === selectedAchievementId,
                )
                if (!selected) return null
                const copy = t.achievements[selected.id]
                const unlocked = selected.isUnlocked(
                  history,
                  missionCompletionCount,
                )
                return (
                  <div
                    role="status"
                    className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                      unlocked
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        <span aria-hidden="true">{selected.icon} </span>
                        {copy.label}
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                          {unlocked
                            ? t.stats.achievementUnlocked
                            : t.stats.achievementLocked}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {copy.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAchievementId(null)}
                      aria-label={t.stats.achievementCloseDetail}
                      className="touch-manipulation rounded-full p-1 text-gray-400 hover:bg-gray-200/60 dark:text-gray-500 dark:hover:bg-gray-700/60"
                    >
                      ✕
                    </button>
                  </div>
                )
              })()}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {t.stats.areaAccuracyTitle}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {areaGroups.map(([groupKey, levels]) => {
                const label =
                  t.common.areaLabels[
                    groupKey as keyof typeof t.common.areaLabels
                  ]
                return (
                  <li
                    key={groupKey}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <span className="text-gray-700 dark:text-gray-200">
                      {label}
                    </span>
                    <span className="flex gap-1.5">
                      {levels.map((area) => {
                        const isWeak = weakestKeys.has(
                          `${areaKey(area)}-${area.level}`,
                        )
                        return (
                          <span
                            key={area.level}
                            title={t.stats.areaLabel(label, area.level)}
                            className={`min-w-12 rounded-md px-1.5 py-1 text-center text-xs font-medium ${
                              isWeak
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : area.stats.accuracy !== null
                                  ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                  : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                            }`}
                          >
                            <span className="block leading-tight">
                              Lv{area.level}
                            </span>
                            <span className="block leading-tight">
                              {area.stats.accuracy !== null
                                ? `${area.stats.accuracy}%`
                                : '−'}
                            </span>
                          </span>
                        )
                      })}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          {benchmarks.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {t.benchmarks.title}
              </h2>
              <ul className="grid grid-cols-2 gap-2">
                {benchmarks.map((benchmark) => {
                  const copy = benchmarkCopy(t, benchmark)
                  return (
                    <li
                      key={benchmark.mode}
                      title={`${t.benchmarks.previousLabel(benchmark.previousValue)} / ${t.benchmarks.recentLabel(benchmark.value)}`}
                      className={`rounded-lg border px-3 py-2 text-xs ${BAND_CLASSES[benchmark.band]}`}
                    >
                      <p className="truncate font-medium text-gray-700 dark:text-gray-200">
                        {copy.label}
                      </p>
                      <p
                        className={`mt-0.5 text-sm font-semibold ${BAND_TEXT_CLASSES[benchmark.band]}`}
                      >
                        {BAND_ARROWS[benchmark.band]} {benchmark.value}%
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {t.benchmarks.bandLabels[benchmark.band]}
                      </p>
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.benchmarks.disclaimer}
              </p>
            </section>
          )}

          {weakPhrases.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {t.stats.weakPhrasesTitle}
              </h2>
              <ul className="flex flex-col gap-2">
                {weakPhrases.map((wp) => {
                  const phrase = findPhraseById(wp.phraseId)
                  if (!phrase) return null
                  return (
                    <li
                      key={wp.phraseId}
                      className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-900/30"
                    >
                      <span className="text-gray-700 dark:text-gray-200">
                        {phrase.text}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {t.stats.weakPhraseStat(
                          wp.accuracyPercent,
                          wp.total,
                          wp.correct,
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
