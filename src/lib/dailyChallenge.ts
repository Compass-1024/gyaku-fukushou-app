import { localDateKey } from './history'
import type { Level } from '../types'

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

// ④-9: 桁数固定だと得意な人には物足りず苦手な人にはハードルが高いままなので、
// すうじモードと同じ3段階のLevelで難易度を選べるようにする。桁数を
// シード文字列に含めることで、同じ日でも難易度ごとに異なる数字列になる
// （さもないと桁数を後ろから切り出すだけの構造が見えてしまう）
export const DAILY_CHALLENGE_DIGIT_COUNT_BY_LEVEL: Record<Level, number> = {
  1: 3,
  2: 4,
  3: 5,
}

// 後方互換用（既存コードや過去バージョンからの参照向けにレベル2の値を残す）
export const DAILY_CHALLENGE_DIGIT_COUNT =
  DAILY_CHALLENGE_DIGIT_COUNT_BY_LEVEL[2]

// 今日のお題の数字列を決定的に生成する（難易度=すうじモードのレベル相当、既定レベル2）
export function getDailyChallengeDigits(
  difficulty: Level = 2,
  now: Date = new Date(),
): number[] {
  const digitCount = DAILY_CHALLENGE_DIGIT_COUNT_BY_LEVEL[difficulty]
  const rng = mulberry32(
    seedFromDateKey(`${localDateKey(now)}:${digitCount}`),
  )
  return Array.from({ length: digitCount }, () => Math.floor(rng() * 10))
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

// バックアップからのインポートなど、完了ログ全体を丸ごと置き換える用途向け
export function replaceDailyChallengeCompletions(
  entries: DailyChallengeCompletion[],
): void {
  try {
    const valid = entries.filter(isValidCompletion)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid.slice(-MAX_ENTRIES)))
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
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
