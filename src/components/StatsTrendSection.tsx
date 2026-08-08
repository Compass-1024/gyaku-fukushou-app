import { useTranslation } from '../contexts/LanguageContext'
import type { DailyAccuracy } from '../lib/history'
import type { Translations } from '../lib/i18n'

interface StatsTrendSectionProps {
  trend: DailyAccuracy[]
  days: number
}

function AccuracyTrendChart({
  trend,
  t,
  ariaLabel,
}: {
  trend: DailyAccuracy[]
  t: Translations
  ariaLabel: string
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
      aria-label={ariaLabel}
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
        {t.stats.trendDaysAgo(trend.length)}
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

export function StatsTrendSection({ trend, days }: StatsTrendSectionProps) {
  const t = useTranslation()
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.trendTitle(days)}
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
        <AccuracyTrendChart trend={trend} t={t} ariaLabel={t.stats.trendAriaLabel(days)} />
      </div>
    </section>
  )
}

export { AccuracyTrendChart }
