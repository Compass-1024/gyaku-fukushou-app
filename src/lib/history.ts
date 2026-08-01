import type { DigitGameType, HistoryEntry, Level, Mode } from '../types'

const STORAGE_KEY = 'gyaku-fukushou:history'
const MAX_ENTRIES = 200

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function appendHistoryEntry(
  entry: Omit<HistoryEntry, 'timestamp'>,
): void {
  const full: HistoryEntry = { ...entry, timestamp: new Date().toISOString() }
  const updated = [...loadHistory(), full].slice(-MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}

export interface LevelStats {
  attempts: number
  accuracy: number | null
}

export function getLevelStats(
  history: HistoryEntry[],
  level: Level,
  mode: Mode,
  gameType?: DigitGameType,
): LevelStats {
  let attempts = 0
  let correctSum = 0
  let totalSum = 0
  for (const e of history) {
    if (e.level === level && e.mode === mode && e.gameType === gameType) {
      attempts += 1
      correctSum += e.correct
      totalSum += e.total
    }
  }
  return {
    attempts,
    accuracy: totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : null,
  }
}

// タイムスタンプをローカルタイムゾーンの日付キー（YYYY-MM-DD）に変換する
function localDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 今日（ローカル日付）に完了したセット数
export function getTodayCount(history: HistoryEntry[]): number {
  const todayKey = localDateKey(new Date())
  return history.filter((e) => localDateKey(new Date(e.timestamp)) === todayKey)
    .length
}

// 連続で挑戦した日数。今日まだ挑戦していなくても、昨日までの連続記録が
// 途切れていなければ継続中として扱う
export function getStreakDays(history: HistoryEntry[]): number {
  if (history.length === 0) return 0
  const days = new Set(history.map((e) => localDateKey(new Date(e.timestamp))))
  const cursor = new Date()
  if (!days.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(localDateKey(cursor))) return 0
  }
  let streak = 0
  while (days.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export interface AreaStats {
  mode: Mode
  gameType?: DigitGameType
  level: Level
  stats: LevelStats
}

const ALL_AREAS: ReadonlyArray<{ mode: Mode; gameType?: DigitGameType }> = [
  { mode: 'word' },
  { mode: 'digit', gameType: 'reverse' },
  { mode: 'digit', gameType: 'sum' },
  { mode: 'nback' },
]
const ALL_LEVELS: readonly Level[] = [1, 2, 3]

// モード×レベルの全組み合わせについて正答率を集計する
export function getAllAreaStats(history: HistoryEntry[]): AreaStats[] {
  const result: AreaStats[] = []
  for (const area of ALL_AREAS) {
    for (const level of ALL_LEVELS) {
      result.push({
        ...area,
        level,
        stats: getLevelStats(history, level, area.mode, area.gameType),
      })
    }
  }
  return result
}

// 挑戦済みの中で正答率が低い項目を返す（苦手分野の可視化用）
export function getWeakestAreas(
  history: HistoryEntry[],
  count: number,
): AreaStats[] {
  return getAllAreaStats(history)
    .filter((a) => a.stats.attempts > 0 && a.stats.accuracy !== null)
    .sort((a, b) => (a.stats.accuracy ?? 0) - (b.stats.accuracy ?? 0))
    .slice(0, count)
}

export interface DailyAccuracy {
  dateKey: string
  accuracy: number | null
}

// 直近N日間（今日を含む）の日別正答率の推移。挑戦していない日はnull
export function getDailyAccuracyTrend(
  history: HistoryEntry[],
  days: number,
): DailyAccuracy[] {
  const result: DailyAccuracy[] = []
  const cursor = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    const dateKey = localDateKey(d)
    let correctSum = 0
    let totalSum = 0
    for (const e of history) {
      if (localDateKey(new Date(e.timestamp)) === dateKey) {
        correctSum += e.correct
        totalSum += e.total
      }
    }
    result.push({
      dateKey,
      accuracy: totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : null,
    })
  }
  return result
}
