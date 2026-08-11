import { useMemo, useState } from 'react'
import { localDateKey } from '../lib/history'
import { useTranslation } from '../contexts/LanguageContext'
import type { ActivityDay } from '../lib/history'
import type { Translations } from '../lib/i18n'
import type { HistoryEntry } from '../types'

interface StatsCalendarSectionProps {
  calendar: ActivityDay[]
  history: HistoryEntry[]
}

// t.common.areaLabelsのキーと一致させる（digitのみgameTypeで区別、他はmodeのみ）
function areaKeyForEntry(entry: HistoryEntry): string {
  return entry.gameType ? `${entry.mode}-${entry.gameType}` : entry.mode
}

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
  selectedDateKey,
  onSelectDay,
}: {
  calendar: ActivityDay[]
  t: Translations
  selectedDateKey: string | null
  onSelectDay: (dateKey: string) => void
}) {
  const weeks = calendar.length / 7
  const gap = 5
  const cellSize = 30
  const weekdayLabelWidth = 20
  const monthLabelHeight = 16
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
      <div className="flex justify-center overflow-x-auto">
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
              fontSize={10}
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
              fontSize={10}
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
            const isSelected = day.dateKey === selectedDateKey
            return (
              <rect
                key={day.dateKey}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onSelectDay(day.dateKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectDay(day.dateKey)
                  }
                }}
                className={`cursor-pointer ${ACTIVITY_LEVEL_CLASSES[activityLevel(day.count)]} ${
                  isSelected
                    ? 'stroke-fuchsia-500 dark:stroke-fuchsia-300'
                    : day.dateKey === todayKey
                      ? 'stroke-indigo-500 dark:stroke-indigo-300'
                      : ''
                }`}
                strokeWidth={isSelected || day.dateKey === todayKey ? 1.5 : 0}
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

export function StatsCalendarSection({ calendar, history }: StatsCalendarSectionProps) {
  const t = useTranslation()
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const selectedEntries = useMemo(() => {
    if (!selectedDateKey) return []
    return history
      .filter((e) => localDateKey(new Date(e.timestamp)) === selectedDateKey)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [history, selectedDateKey])

  function handleSelectDay(dateKey: string) {
    setSelectedDateKey((current) => (current === dateKey ? null : dateKey))
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.calendarTitle}
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
        <ActivityHeatmap
          calendar={calendar}
          t={t}
          selectedDateKey={selectedDateKey}
          onSelectDay={handleSelectDay}
        />
      </div>

      {selectedDateKey && (
        <div className="animate-pop rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 dark:border-fuchsia-800 dark:bg-fuchsia-900/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">
              {t.stats.dayDetailTitle(selectedDateKey)}
            </p>
            <button
              type="button"
              onClick={() => setSelectedDateKey(null)}
              className="touch-manipulation text-xs text-fuchsia-600 hover:underline dark:text-fuchsia-300"
            >
              {t.stats.dayDetailCloseButton}
            </button>
          </div>
          {selectedEntries.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t.stats.dayDetailNoRecords}
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {selectedEntries.map((entry, i) => {
                const label =
                  t.common.areaLabels[
                    areaKeyForEntry(entry) as keyof typeof t.common.areaLabels
                  ] ?? entry.mode
                const accuracyPercent =
                  entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0
                return (
                  <li
                    key={`${entry.timestamp}-${i}`}
                    className="text-sm text-gray-700 dark:text-gray-200"
                  >
                    {t.stats.dayDetailEntry(
                      label,
                      entry.level,
                      entry.correct,
                      entry.total,
                      accuracyPercent,
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
