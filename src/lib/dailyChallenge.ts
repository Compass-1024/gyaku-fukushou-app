import { localDateKey } from './history'

// ④-9: 日付をシードにした「今日だけの共通お題」。既存の各モードは毎回
// 乱数生成のため「今日は特別」という感覚が生まれにくい。日替わりパズル
// （Wordle等）の話題性・習慣化フックを軽量に取り込む狙いで、既存の出題
// ロジック（重み付き抽選）には手を入れず完全に独立したミニチャレンジとして
// 実装する。1日1回のみ挑戦可能。

// mulberry32: 小さく決定的な擬似乱数生成器。日付文字列から数値シードを作り、
// 同じ日は必ず同じ数字列になる
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromDateKey(dateKey: string): number {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  }
  return hash
}

export const DAILY_CHALLENGE_DIGIT_COUNT = 4

// 今日のお題の数字列を決定的に生成する（4桁固定、すうじモードのレベル2相当）
export function getDailyChallengeDigits(now: Date = new Date()): number[] {
  const rng = mulberry32(seedFromDateKey(localDateKey(now)))
  return Array.from({ length: DAILY_CHALLENGE_DIGIT_COUNT }, () =>
    Math.floor(rng() * 10),
  )
}

export function reverseDigitsToString(digits: number[]): string {
  return digits.slice().reverse().join('')
}

export interface DailyChallengeCompletion {
  dateKey: string
  correct: boolean
}

const STORAGE_KEY = 'gyaku-fukushou:dailyChallengeCompletions'
const MAX_ENTRIES = 60

function isValidCompletion(value: unknown): value is DailyChallengeCompletion {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.dateKey === 'string' && typeof v.correct === 'boolean'
}

export function loadDailyChallengeCompletions(): DailyChallengeCompletion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidCompletion)
  } catch {
    return []
  }
}

export function hasCompletedTodayChallenge(now: Date = new Date()): boolean {
  const todayKey = localDateKey(now)
  return loadDailyChallengeCompletions().some((c) => c.dateKey === todayKey)
}

export function recordTodayChallengeCompletion(
  correct: boolean,
  now: Date = new Date(),
): void {
  const todayKey = localDateKey(now)
  if (hasCompletedTodayChallenge(now)) return
  try {
    const updated = [
      ...loadDailyChallengeCompletions(),
      { dateKey: todayKey, correct },
    ].slice(-MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}
