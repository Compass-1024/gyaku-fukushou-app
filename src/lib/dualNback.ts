import { scoreMatchTrials, computeAdaptiveN, ADAPTIVE_WINDOW } from './nback'
import type { NBackScore } from './nback'
import type { Level, DualNBackTrial } from '../types'

// レベルが上がるほど何個前と比較するかを増やす（1back/2back/3back）
const N_VALUE: Record<Level, number> = { 1: 1, 2: 2, 3: 3 }

// 出題数（問題セットの試行数）を選べるようにする（Nバックモードと同様）
export const TRIAL_COUNT_OPTIONS = [10, 20, 30] as const
export type TrialCount = (typeof TRIAL_COUNT_OPTIONS)[number]
export const DEFAULT_TRIAL_COUNT: TrialCount = 20

const MATCH_PROBABILITY = 0.3

// 3×3グリッドの位置(0〜8)と8種類の音(0〜7)
export const GRID_SIZE = 3
export const SOUND_COUNT = 8

// 開始前の間、および各試行を表示する時間（2つの刺激を同時に処理するため
// 通常のNバックよりやや長めに取る）
export const READY_MS = 1000
export const STIMULUS_MS = 2000
export const GAP_MS = 400

export function getDualNValue(level: Level): number {
  return N_VALUE[level]
}

// 位置・音それぞれ独立に、N個前と一致する箇所を一定確率で混ぜつつ生成する
export function generateDualNBackSequence(
  level: Level,
  trialCount: number = DEFAULT_TRIAL_COUNT,
): DualNBackTrial[] {
  const n = N_VALUE[level]
  const positions: number[] = []
  const sounds: number[] = []
  const trials: DualNBackTrial[] = []
  for (let i = 0; i < trialCount; i++) {
    const position =
      i >= n && Math.random() < MATCH_PROBABILITY
        ? positions[i - n]
        : Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE))
    const sound =
      i >= n && Math.random() < MATCH_PROBABILITY
        ? sounds[i - n]
        : Math.floor(Math.random() * SOUND_COUNT)
    const positionMatch = i >= n && position === positions[i - n]
    const soundMatch = i >= n && sound === sounds[i - n]
    positions.push(position)
    sounds.push(sound)
    trials.push({ position, sound, positionMatch, soundMatch })
  }
  return trials
}

// ④-1: デュアルNバックへのアダプティブ難易度拡張。通常Nバック（nback.ts）の
// 階段法と同じ判定ロジック（computeAdaptiveN）を共有しつつ、位置・音の
// 2チャンネル分の履歴を保持する専用の状態型を使う。1試行の正誤は
// 「位置・音の両方が正しく判定できた場合のみ正解」という厳しめの基準にする
// （デュアル課題の難しさに合わせ、片方だけ合っていてもN値は上げない）
export interface AdaptiveDualNState {
  n: number
  positions: number[]
  sounds: number[]
  recentResults: boolean[]
}

export function createAdaptiveDualNState(startN: number): AdaptiveDualNState {
  return { n: startN, positions: [], sounds: [], recentResults: [] }
}

export function generateNextAdaptiveDualTrial(
  state: AdaptiveDualNState,
): { trial: DualNBackTrial; state: AdaptiveDualNState } {
  const { n, positions, sounds } = state
  const position =
    positions.length >= n && Math.random() < MATCH_PROBABILITY
      ? positions[positions.length - n]
      : Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE))
  const sound =
    sounds.length >= n && Math.random() < MATCH_PROBABILITY
      ? sounds[sounds.length - n]
      : Math.floor(Math.random() * SOUND_COUNT)
  const positionMatch = positions.length >= n && position === positions[positions.length - n]
  const soundMatch = sounds.length >= n && sound === sounds[sounds.length - n]
  return {
    trial: { position, sound, positionMatch, soundMatch },
    state: {
      ...state,
      positions: [...positions, position],
      sounds: [...sounds, sound],
    },
  }
}

export function advanceAdaptiveDualState(
  state: AdaptiveDualNState,
  correct: boolean,
): AdaptiveDualNState {
  const recentResults = [...state.recentResults, correct].slice(-ADAPTIVE_WINDOW)
  if (recentResults.length < ADAPTIVE_WINDOW) {
    return { ...state, recentResults }
  }
  const n = computeAdaptiveN(state.n, recentResults)
  if (n !== state.n) {
    return { ...state, n, recentResults: [] }
  }
  return { ...state, recentResults }
}

export interface DualNBackScore {
  position: NBackScore
  sound: NBackScore
}

// positionPressed[i]/soundPressed[i] は各試行でユーザーが「位置一致」/「音一致」を
// 押したかどうか
export function scoreDualNBackTrials(
  trials: DualNBackTrial[],
  positionPressed: boolean[],
  soundPressed: boolean[],
): DualNBackScore {
  return {
    position: scoreMatchTrials(
      trials.map((t) => t.positionMatch),
      positionPressed,
    ),
    sound: scoreMatchTrials(
      trials.map((t) => t.soundMatch),
      soundPressed,
    ),
  }
}
