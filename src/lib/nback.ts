import type { Level, NBackTrial } from '../types'

// レベルが上がるほど何個前の数字かを増やす（1back/2back/3back）
const N_VALUE: Record<Level, number> = { 1: 1, 2: 2, 3: 3 }

export const NBACK_SEQUENCE_LENGTH = 15
const MATCH_PROBABILITY = 0.35

// 開始前の間、および各試行を表示する時間
export const READY_MS = 1000
// 数字の表示時間と、次の数字との間に挟む空白時間（切り替わりを分かりやすくするため）
export const STIMULUS_MS = 1800
export const GAP_MS = 400

export function getNValue(level: Level): number {
  return N_VALUE[level]
}

// N個前と一致する箇所を意図的に一定確率で混ぜつつ、数字の系列を生成する
export function generateNBackSequence(level: Level): NBackTrial[] {
  const n = N_VALUE[level]
  const digits: number[] = []
  const trials: NBackTrial[] = []
  for (let i = 0; i < NBACK_SEQUENCE_LENGTH; i++) {
    let digit: number
    if (i >= n && Math.random() < MATCH_PROBABILITY) {
      digit = digits[i - n]
    } else {
      digit = Math.floor(Math.random() * 10)
    }
    const isMatch = i >= n && digit === digits[i - n]
    digits.push(digit)
    trials.push({ digit, isMatch })
  }
  return trials
}

export interface NBackScore {
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  accuracy: number
}

// シグナル検出理論(SDT)に基づくスコアリング。isMatch[i]が実際に一致する
// 試行かどうか、pressed[i]がユーザーが「一致」ボタンを押したかどうかを表す。
// Nバック・Dual N-Back（位置/音の各チャンネル）で共通に使う
export function scoreMatchTrials(
  isMatch: boolean[],
  pressed: boolean[],
): NBackScore {
  let hits = 0
  let misses = 0
  let falseAlarms = 0
  let correctRejections = 0
  isMatch.forEach((match, i) => {
    const didPress = pressed[i] ?? false
    if (match && didPress) hits += 1
    else if (match && !didPress) misses += 1
    else if (!match && didPress) falseAlarms += 1
    else correctRejections += 1
  })
  const total = isMatch.length
  const accuracy =
    total > 0 ? Math.round(((hits + correctRejections) / total) * 100) : 0
  return { hits, misses, falseAlarms, correctRejections, accuracy }
}

// pressed[i] は各試行でユーザーが「一致」ボタンを押したかどうか
export function scoreNBackTrials(
  trials: NBackTrial[],
  pressed: boolean[],
): NBackScore {
  return scoreMatchTrials(
    trials.map((t) => t.isMatch),
    pressed,
  )
}
