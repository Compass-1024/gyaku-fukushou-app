import { scoreMatchTrials } from './nback'
import type { NBackScore } from './nback'
import type { Level, DualNBackTrial } from '../types'

// レベルが上がるほど何個前と比較するかを増やす（1back/2back/3back）
const N_VALUE: Record<Level, number> = { 1: 1, 2: 2, 3: 3 }

export const DUAL_NBACK_SEQUENCE_LENGTH = 20
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
export function generateDualNBackSequence(level: Level): DualNBackTrial[] {
  const n = N_VALUE[level]
  const positions: number[] = []
  const sounds: number[] = []
  const trials: DualNBackTrial[] = []
  for (let i = 0; i < DUAL_NBACK_SEQUENCE_LENGTH; i++) {
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
