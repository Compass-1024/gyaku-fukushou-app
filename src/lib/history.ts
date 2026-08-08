import type { DigitGameType, HistoryEntry, Level, Mode } from '../types'

const STORAGE_KEY = 'gyaku-fukushou:history'
const MAX_ENTRIES = 200

const VALID_MODES: readonly Mode[] = [
  'word',
  'digit',
  'nback',
  'dual-nback',
  'spatial',
  'pattern',
  'tone',
  'random',
]
const VALID_GAME_TYPES: readonly DigitGameType[] = ['reverse', 'sum']
const VALID_LEVELS: readonly Level[] = [1, 2, 3]

// localStorageは手動改変・旧バージョンのデータ形式・将来のスキーマ変更などで
// 不正な形のデータが混入しうる唯一の永続化層のため、読み込み時に各フィールドの
// 型・値域を検証し、不正な要素は静かに除外する（バックアップ復元時の検証
// `backup.ts`の`isValidHistoryEntry`と同じ基準）
export function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  if (!VALID_MODES.includes(e.mode as Mode)) return false
  if (
    e.gameType !== undefined &&
    !VALID_GAME_TYPES.includes(e.gameType as DigitGameType)
  ) {
    return false
  }
  if (!VALID_LEVELS.includes(e.level as Level)) return false
  if (
    typeof e.correct !== 'number' ||
    !Number.isFinite(e.correct) ||
    e.correct < 0
  ) {
    return false
  }
  if (typeof e.total !== 'number' || !Number.isFinite(e.total) || e.total < 0) {
    return false
  }
  if (e.correct > e.total) return false
  if (typeof e.timestamp !== 'string' || Number.isNaN(Date.parse(e.timestamp))) {
    return false
  }
  return true
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidHistoryEntry)
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
    const valid = entries.filter(isValidHistoryEntry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid.slice(-MAX_ENTRIES)))
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
export function localDateKey(date: Date): string {
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

// 1か月あたりに許容する「ストリークフリーズ」の回数（1日休んでも連続記録が
// 途切れない猶予）。全か無かのプレッシャーによる離脱を防ぐための施策
const MAX_STREAK_FREEZES_PER_MONTH = 2

// 連続で挑戦した日数。今日まだ挑戦していなくても、昨日までの連続記録が
// 途切れていなければ継続中として扱う。また、1か月に最大
// MAX_STREAK_FREEZES_PER_MONTH 回まで、1日だけの欠落（前後は挑戦している）
// を「フリーズ」として自動的に穴埋めし、連続記録を途切れさせない。
// 2日以上連続で欠落した場合はフリーズでは救済しない。
export function getStreakDays(
  history: HistoryEntry[],
  now: Date = new Date(),
): number {
  if (history.length === 0) return 0
  const days = new Set(history.map((e) => localDateKey(new Date(e.timestamp))))
  const cursor = new Date(now)
  if (!days.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(localDateKey(cursor))) return 0
  }
  let streak = 0
  let lastWasFreeze = false
  const freezesUsedByMonth = new Map<string, number>()
  while (true) {
    const key = localDateKey(cursor)
    if (days.has(key)) {
      streak += 1
      lastWasFreeze = false
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (lastWasFreeze) break // 2日連続の欠落はフリーズで救済しない
    const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    const used = freezesUsedByMonth.get(monthKey) ?? 0
    if (used >= MAX_STREAK_FREEZES_PER_MONTH) break
    freezesUsedByMonth.set(monthKey, used + 1)
    lastWasFreeze = true
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

// 'random'（全モード横断のミックス練習）は単一スキル指標ではないため、
// 苦手分野判定・ベンチマークの対象外として意図的に含めない
const ALL_AREAS: ReadonlyArray<{ mode: Mode; gameType?: DigitGameType }> = [
  { mode: 'word' },
  { mode: 'digit', gameType: 'reverse' },
  { mode: 'digit', gameType: 'sum' },
  { mode: 'nback' },
  { mode: 'dual-nback' },
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

// 間隔反復（Spaced Repetition）の考え方を踏まえ、最終挑戦からの経過日数
// 1日あたりに加算する優先度スコア（正答率ポイントと同じスケールに揃えている）。
// 正答率が高くても長期間触れていない項目は、忘却が進んでいる可能性が高いため
// 再浮上させる
const RECENCY_SCORE_PER_DAY = 3

function getLastAttemptTimestampMs(
  history: HistoryEntry[],
  area: { mode: Mode; gameType?: DigitGameType },
  level: Level,
): number | null {
  let latest: number | null = null
  for (const e of history) {
    if (e.mode !== area.mode || e.level !== level || e.gameType !== area.gameType) {
      continue
    }
    const t = new Date(e.timestamp).getTime()
    if (latest === null || t > latest) latest = t
  }
  return latest
}

// 挑戦済みの中から、優先して復習すべき項目を返す（「今日のおすすめ」用）。
// 正答率が低いほど、また最終挑戦からの経過日数が長いほど優先度スコアが高くなる。
// 挑戦回数が十分な項目があればそちらを優先し、スコアが同じ場合は挑戦回数が
// 多い（＝より確からしい）項目を優先する
export function getWeakestAreas(
  history: HistoryEntry[],
  count: number,
  now: Date = new Date(),
): AreaStats[] {
  const attempted = getAllAreaStats(history).filter(
    (a) => a.stats.attempts > 0 && a.stats.accuracy !== null,
  )
  const reliable = attempted.filter(
    (a) => a.stats.attempts >= MIN_ATTEMPTS_FOR_RELIABLE_WEAKEST,
  )
  const pool = reliable.length > 0 ? reliable : attempted
  const nowMs = now.getTime()

  return pool
    .map((area) => {
      const lastAttemptMs = getLastAttemptTimestampMs(history, area, area.level)
      const daysSinceLastAttempt =
        lastAttemptMs === null ? 0 : Math.max(0, (nowMs - lastAttemptMs) / 86_400_000)
      const score =
        (100 - (area.stats.accuracy ?? 0)) + daysSinceLastAttempt * RECENCY_SCORE_PER_DAY
      return { area, score }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.area.stats.attempts - a.area.stats.attempts
    })
    .slice(0, count)
    .map((x) => x.area)
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
  now: Date = new Date(),
): ActivityDay[] {
  const counts = new Map<string, number>()
  for (const e of history) {
    const key = localDateKey(new Date(e.timestamp))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const today = new Date(now)
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
