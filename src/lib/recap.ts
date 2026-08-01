import { localDateKey } from './history'
import type { HistoryEntry } from '../types'

export interface WeeklyRecap {
  // 対象週（月曜始まり）の月曜日を表す日付キー。表示済み判定にも使う
  weekKey: string
  totalSets: number
  accuracyPercent: number | null
  previousWeekSets: number
}

// dateが属する週の月曜0時を返す
function getWeekStartMonday(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=日, 1=月, ...
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  return d
}

// 直近に完了した週（月曜〜日曜）の振り返りを集計する。
// その週に1件も記録がなければnullを返す（何も振り返る内容がないため）
export function getWeeklyRecap(
  history: HistoryEntry[],
  now: Date = new Date(),
): WeeklyRecap | null {
  const thisWeekStart = getWeekStartMonday(now)
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = thisWeekStart // 排他的な終端
  const twoWeeksAgoStart = new Date(lastWeekStart)
  twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 7)

  let totalSets = 0
  let correctSum = 0
  let totalSum = 0
  let previousWeekSets = 0

  for (const e of history) {
    const t = new Date(e.timestamp)
    if (t >= lastWeekStart && t < lastWeekEnd) {
      totalSets += 1
      correctSum += e.correct
      totalSum += e.total
    } else if (t >= twoWeeksAgoStart && t < lastWeekStart) {
      previousWeekSets += 1
    }
  }

  if (totalSets === 0) return null

  return {
    weekKey: localDateKey(lastWeekStart),
    totalSets,
    accuracyPercent: totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : null,
    previousWeekSets,
  }
}

const LAST_SHOWN_KEY = 'gyaku-fukushou:lastRecapWeekKey'

// この端末で最後に表示した振り返りの週キー（未表示ならnull）
export function getLastShownRecapWeekKey(): string | null {
  try {
    return localStorage.getItem(LAST_SHOWN_KEY)
  } catch {
    return null
  }
}

export function markRecapShown(weekKey: string): void {
  try {
    localStorage.setItem(LAST_SHOWN_KEY, weekKey)
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}
