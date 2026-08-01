import {
  getAllAreaStats,
  getWeakestAreas,
  getDailyAccuracyTrend,
} from '../lib/history'
import { ACHIEVEMENTS } from '../lib/achievements'
import type { DailyAccuracy } from '../lib/history'
import type { DigitGameType, HistoryEntry, Mode } from '../types'

interface StatsScreenProps {
  history: HistoryEntry[]
  onBack: () => void
}

const AREA_LABELS: Record<string, string> = {
  word: 'ことば',
  'digit-reverse': 'すうじ（逆から）',
  'digit-sum': 'すうじ（合計）',
  nback: 'Nバック',
}

const TREND_DAYS = 14

function areaKey(area: { mode: Mode; gameType?: DigitGameType }): string {
  return area.gameType ? `${area.mode}-${area.gameType}` : area.mode
}

function AccuracyTrendChart({ trend }: { trend: DailyAccuracy[] }) {
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
      aria-label={`直近${TREND_DAYS}日間の正答率の推移`}
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
              <title>{`${d.dateKey}: 記録なし`}</title>
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
        {TREND_DAYS}日前
      </text>
      <text
        x={width}
        y={chartHeight + labelHeight - 4}
        textAnchor="end"
        fontSize={8}
        className="fill-gray-500 dark:fill-gray-400"
      >
        今日
      </text>
    </svg>
  )
}

export function StatsScreen({ history, onBack }: StatsScreenProps) {
  const areas = getAllAreaStats(history)
  const weakest = getWeakestAreas(history, 2)
  const weakestKeys = new Set(weakest.map((a) => `${areaKey(a)}-${a.level}`))
  const hasAnyAttempts = areas.some((a) => a.stats.attempts > 0)
  const trend = getDailyAccuracyTrend(history, TREND_DAYS)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        ← 戻る
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        統計
      </h1>

      {!hasAnyAttempts ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          まだ記録がありません。プレイすると統計が表示されます。
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              正答率の推移（直近{TREND_DAYS}日間）
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
              <AccuracyTrendChart trend={trend} />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              実績
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = achievement.isUnlocked(history)
                return (
                  <div
                    key={achievement.id}
                    title={achievement.description}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center ${
                      unlocked
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                        : 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800/50'
                    }`}
                  >
                    <span aria-hidden="true" className="text-2xl">
                      {achievement.icon}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {achievement.label}
                    </span>
                    <span className="sr-only">
                      {unlocked ? '解除済み' : '未解除'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              モード別の正答率
            </h2>
            <ul className="flex flex-col gap-2">
              {areas.map((area) => {
                const key = `${areaKey(area)}-${area.level}`
                const isWeak = weakestKeys.has(key)
                return (
                  <li
                    key={key}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                      isWeak
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="text-gray-700 dark:text-gray-200">
                      {AREA_LABELS[areaKey(area)]} レベル{area.level}
                      {isWeak && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">
                          ⚠️ 要復習
                        </span>
                      )}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {area.stats.accuracy !== null
                        ? `${area.stats.accuracy}%（${area.stats.attempts}回）`
                        : '未挑戦'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
