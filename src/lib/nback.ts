import type { Level, NBackTrial } from '../types'

// レベルが上がるほど何個前の位置かを増やす（1back/2back/3back）
const N_VALUE: Record<Level, number> = { 1: 1, 2: 2, 3: 3 }

// 3×3グリッドのマス数（空間版Nバック課題）
export const GRID_SIZE = 3
const CELL_COUNT = GRID_SIZE * GRID_SIZE

// 出題数（問題セットの試行数）を選べるようにする
export const TRIAL_COUNT_OPTIONS = [10, 20, 30] as const
export type TrialCount = (typeof TRIAL_COUNT_OPTIONS)[number]
export const DEFAULT_TRIAL_COUNT: TrialCount = 20

const MATCH_PROBABILITY = 0.35

// 開始前の間、および各試行を表示する時間
export const READY_MS = 1000
// マスの表示時間と、次のマスとの間に挟む空白時間（切り替わりを分かりやすくするため）
export const STIMULUS_MS = 1800
export const GAP_MS = 400

export function getNValue(level: Level): number {
  return N_VALUE[level]
}

// N個前と一致する位置を意図的に一定確率で混ぜつつ、3×3グリッドの
// マス位置の系列を生成する（空間版Nバック課題、Kirchner 1958のspatial
// n-back課題を参考にした「位置が一致するか判定する」形式）
export function generateNBackSequence(
  level: Level,
  trialCount: number = DEFAULT_TRIAL_COUNT,
): NBackTrial[] {
  const n = N_VALUE[level]
  const positions: number[] = []
  const trials: NBackTrial[] = []
  for (let i = 0; i < trialCount; i++) {
    let position: number
    if (i >= n && Math.random() < MATCH_PROBABILITY) {
      position = positions[i - n]
    } else {
      position = Math.floor(Math.random() * CELL_COUNT)
    }
    const isMatch = i >= n && position === positions[i - n]
    positions.push(position)
    trials.push({ position, isMatch })
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
