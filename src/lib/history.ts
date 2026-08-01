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

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}

// バックアップからのインポートなど、履歴全体を丸ごと置き換える用途向け
export function replaceHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
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
  { mode: 'spatial' },
  { mode: 'pattern' },
  { mode: 'tone' },
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

// この回数未満の挑戦しかない項目は、1回のたまたまの失敗で「苦手分野」と
// 誤判定されやすいため、十分な挑戦回数がある項目を優先する
const MIN_ATTEMPTS_FOR_RELIABLE_WEAKEST = 2

// 挑戦済みの中で正答率が低い項目を返す（苦手分野の可視化用）。
// 挑戦回数が十分な項目があればそちらを優先し、正答率が同じ場合は挑戦回数が
// 多い（＝より確からしい）項目を優先する
export function getWeakestAreas(
  history: HistoryEntry[],
  count: number,
): AreaStats[] {
  const attempted = getAllAreaStats(history).filter(
    (a) => a.stats.attempts > 0 && a.stats.accuracy !== null,
  )
  const reliable = attempted.filter(
    (a) => a.stats.attempts >= MIN_ATTEMPTS_FOR_RELIABLE_WEAKEST,
  )
  const pool = reliable.length > 0 ? reliable : attempted
  return pool
    .sort((a, b) => {
      const accuracyDiff = (a.stats.accuracy ?? 0) - (b.stats.accuracy ?? 0)
      if (accuracyDiff !== 0) return accuracyDiff
      return b.stats.attempts - a.stats.attempts
    })
    .slice(0, count)
}

// 指定モード・レベルにおける、これまでの1セットあたりの最高正答率（%）
export function getBestSetAccuracy(
  history: HistoryEntry[],
  mode: Mode,
  level: Level,
  gameType?: DigitGameType,
): number | null {
  let best: number | null = null
  for (const e of history) {
    if (e.mode !== mode || e.level !== level || e.gameType !== gameType) {
      continue
    }
    if (e.total <= 0) continue
    const accuracy = Math.round((e.correct / e.total) * 100)
    if (best === null || accuracy > best) best = accuracy
  }
  return best
}

export interface DailyAccuracy {
  dateKey: string
  accuracy: number | null
}

export interface ActivityDay {
  dateKey: string
  // 完了セット数。-1は未来日（まだ存在しない日、グリッドの穴埋め用）を示す
  count: number
  weekday: number
}

// 直近N週間分の日別活動量（GitHub風ヒートマップ用）。
// 日曜始まり・土曜終わりの週単位グリッドに揃え、今週の残り（未来日）はcount: -1で埋める
export function getActivityCalendar(
  history: HistoryEntry[],
  weeks: number,
): ActivityDay[] {
  const counts = new Map<string, number>()
  for (const e of history) {
    const key = localDateKey(new Date(e.timestamp))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const gridEnd = new Date(today)
  gridEnd.setDate(gridEnd.getDate() + (6 - today.getDay()))
  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridStart.getDate() - (weeks * 7 - 1))

  const result: ActivityDay[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const dateKey = localDateKey(cursor)
    const isFuture = cursor > today
    result.push({
      dateKey,
      count: isFuture ? -1 : (counts.get(dateKey) ?? 0),
      weekday: cursor.getDay(),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
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
