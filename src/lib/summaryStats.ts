import { getStreakDays, localDateKey } from './history'
import type { HistoryEntry, Mode } from '../types'

// ④-4: 週間/月間の学習サマリー画像エクスポート向けの集計ロジック。
// canvas描画部分（summaryImage.ts）はブラウザAPI依存で単体テストしにくいため、
// 「何を表示するか」の集計だけをここに切り出してテスト可能にする

export type SummaryPeriod = 'week' | 'month'

const PERIOD_DAYS: Record<SummaryPeriod, number> = {
  week: 7,
  month: 30,
}

export interface ModeSetsCount {
  mode: Mode
  sets: number
}

export interface LearningSummary {
  period: SummaryPeriod
  days: number
  totalSets: number
  accuracyPercent: number | null
  streakDays: number
  // 挑戦セット数が多い順。1件も無ければ空配列
  topModes: ModeSetsCount[]
}

export function computeLearningSummary(
  history: HistoryEntry[],
  period: SummaryPeriod,
  now: Date = new Date(),
): LearningSummary {
  const days = PERIOD_DAYS[period]
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)

  const inRange = history.filter((e) => new Date(e.timestamp) >= cutoff)

  const correctSum = inRange.reduce((sum, e) => sum + e.correct, 0)
  const totalSum = inRange.reduce((sum, e) => sum + e.total, 0)

  const setsByMode = new Map<Mode, number>()
  for (const e of inRange) {
    setsByMode.set(e.mode, (setsByMode.get(e.mode) ?? 0) + 1)
  }
  const topModes = Array.from(setsByMode.entries())
    .map(([mode, sets]) => ({ mode, sets }))
    .sort((a, b) => b.sets - a.sets)

  return {
    period,
    days,
    totalSets: inRange.length,
    accuracyPercent: totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : null,
    streakDays: getStreakDays(history, now),
    topModes,
  }
}

export function summaryDateRangeLabel(now: Date = new Date(), days = 7): string {
  const start = new Date(now)
  start.setDate(start.getDate() - days + 1)
  const fmt = (d: Date) => localDateKey(d).replace(/-/g, '/')
  return `${fmt(start)} - ${fmt(now)}`
}
