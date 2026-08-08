import { useMemo } from 'react'
import { getDailyAccuracyTrend } from '../lib/history'
import { AccuracyTrendChart } from './StatsTrendSection'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry, DigitGameType, Mode } from '../types'

interface StatsModeTrendSectionProps {
  history: HistoryEntry[]
  days: number
}

// ④-6: 統計画面の「ワーキングメモリの伸び」は前半/後半比較の3段階ラベル
// （向上中/横ばい/低下ぎみ）のみで、どれくらい伸びたかが実感しにくい。
// 既存の日別正答率グラフ（AccuracyTrendChart）をモード別に再利用し、
// 実際の推移を時系列で見せる。ランダムモードは単一スキル指標ではないため
// 対象外（ALL_AREASと同じ方針、history.tsを参照）
const TREND_AREAS: ReadonlyArray<{
  key: string
  mode: Mode
  gameType?: DigitGameType
}> = [
  { key: 'word', mode: 'word' },
  { key: 'digit-reverse', mode: 'digit', gameType: 'reverse' },
  { key: 'digit-sum', mode: 'digit', gameType: 'sum' },
  { key: 'nback', mode: 'nback' },
  { key: 'dual-nback', mode: 'dual-nback' },
  { key: 'spatial', mode: 'spatial' },
  { key: 'pattern', mode: 'pattern' },
  { key: 'tone', mode: 'tone' },
]

// 十分な推移が見えるよう、最低限このセット数は記録されていることを要求する
const MIN_SETS_FOR_TREND = 4

export function StatsModeTrendSection({ history, days }: StatsModeTrendSectionProps) {
  const t = useTranslation()
  const { language } = useLanguage()

  const trends = useMemo(() => {
    return TREND_AREAS.filter((area) => language === 'ja' || area.mode !== 'word')
      .map((area) => {
        const filtered = history.filter(
          (e) => e.mode === area.mode && e.gameType === area.gameType,
        )
        return { area, filtered }
      })
      .filter(({ filtered }) => filtered.length >= MIN_SETS_FOR_TREND)
      .map(({ area, filtered }) => ({
        area,
        trend: getDailyAccuracyTrend(filtered, days),
      }))
  }, [history, language, days])

  if (trends.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.modeTrendTitle}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {trends.map(({ area, trend }) => {
          const label =
            t.common.areaLabels[area.key as keyof typeof t.common.areaLabels]
          return (
            <div
              key={area.key}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="mb-1 truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                {label}
              </p>
              <AccuracyTrendChart
                trend={trend}
                t={t}
                ariaLabel={`${label}: ${t.stats.trendAriaLabel(days)}`}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
