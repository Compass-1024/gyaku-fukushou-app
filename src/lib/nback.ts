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

// ④-1: アダプティブ難易度モード。従来のNバックはセット開始時にN値を
// 固定選択するのみで、セッション内でのリアルタイムな難易度適応が無い
// （レベル提案はセット完了後にしか出ない）。Jaeggi et al.のdual n-back
// 研究をはじめ学術的な適応課題プロトコルに倣い、直近の正誤に応じて
// N値を試行の合間に自動で上下させる「階段法（staircase）」を追加する。
export const ADAPTIVE_MIN_N = 1
export const ADAPTIVE_MAX_N = 3
// この件数分の直近試行がすべて正解ならN+1、2件以上不正解ならN-1する
const ADAPTIVE_WINDOW = 3

export interface AdaptiveNState {
  n: number
  positions: number[]
  recentResults: boolean[]
}

export function createAdaptiveNState(startN: number): AdaptiveNState {
  return { n: startN, positions: [], recentResults: [] }
}

// 現在のn値に基づき1試行分の刺激を生成し、生成後の状態（position履歴に
// 今回の位置を追加したもの）を返す
export function generateNextAdaptiveTrial(
  state: AdaptiveNState,
): { trial: NBackTrial; state: AdaptiveNState } {
  const { n, positions } = state
  let position: number
  if (positions.length >= n && Math.random() < MATCH_PROBABILITY) {
    position = positions[positions.length - n]
  } else {
    position = Math.floor(Math.random() * CELL_COUNT)
  }
  const isMatch = positions.length >= n && position === positions[positions.length - n]
  return {
    trial: { position, isMatch },
    state: { ...state, positions: [...positions, position] },
  }
}

// 直前の試行の正誤を反映してnを更新する。ADAPTIVE_WINDOW件たまるたびに
// 判定し、n が変化したら直近結果のウィンドウをリセットする（変化直後の
// 数試行だけで再度昇降しないようにするため）
export function advanceAdaptiveState(
  state: AdaptiveNState,
  correct: boolean,
): AdaptiveNState {
  const recentResults = [...state.recentResults, correct].slice(-ADAPTIVE_WINDOW)
  if (recentResults.length < ADAPTIVE_WINDOW) {
    return { ...state, recentResults }
  }
  const wrongCount = recentResults.filter((r) => !r).length
  let n = state.n
  if (wrongCount === 0) n = Math.min(ADAPTIVE_MAX_N, state.n + 1)
  else if (wrongCount >= 2) n = Math.max(ADAPTIVE_MIN_N, state.n - 1)
  if (n !== state.n) {
    return { ...state, n, recentResults: [] }
  }
  return { ...state, recentResults }
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
