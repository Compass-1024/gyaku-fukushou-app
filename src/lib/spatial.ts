import type { Level, SpatialQuestion } from '../types'
import { loadBucketStats, recordBucketAttempt, pickWeightedCandidate } from './questionWeighting'

const GRID_SIZE: Record<Level, number> = { 1: 3, 2: 3, 3: 4 }
const SEQUENCE_LENGTH: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }

const QUESTIONS_PER_SET = 3
const STATS_MODE = 'spatial'

export function getGridSize(level: Level): number {
  return GRID_SIZE[level]
}

// gridSize×gridSizeのマスから、重複なくlength個のセルをランダムに選ぶ
// （Corsi Block-Tapping Taskに倣い、同じマスは1系列中に一度だけ光る）
function generateSequence(gridSize: number, length: number): number[] {
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => i)
  const sequence: number[] = []
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * cells.length)
    sequence.push(cells[idx])
    cells.splice(idx, 1)
  }
  return sequence
}

// 出題重み付け用の系列パターン分類。隣り合うマスへ連続して移動する箇所が
// あるか（'adjacent'）、常に離れたマスへ飛ぶか（'scattered'）で2分割する
// （隣接移動は空間的にチャンク化しやすく、難易度に影響しうる特徴のため）
function classifySpatialSequence(sequence: number[], gridSize: number): string {
  for (let i = 1; i < sequence.length; i++) {
    const ax = sequence[i - 1] % gridSize
    const ay = Math.floor(sequence[i - 1] / gridSize)
    const bx = sequence[i] % gridSize
    const by = Math.floor(sequence[i] / gridSize)
    if (Math.abs(ax - bx) + Math.abs(ay - by) === 1) return 'adjacent'
  }
  return 'scattered'
}

// 誤答が多い系列パターンほど選ばれやすい重み付き抽選で1問だけ生成する。
// ④-2: アダプティブ難易度モードは問題ごとにレベルが変わりうるため、
// 3問セットの一括生成(pickSpatialQuestionSet)とは別に1問単位の生成が必要
export function pickSpatialQuestion(
  level: Level,
  idSuffix: string | number = 0,
  exclude: number[][] = [],
): SpatialQuestion {
  const gridSize = GRID_SIZE[level]
  const length = SEQUENCE_LENGTH[level]
  const stats = loadBucketStats(STATS_MODE)
  const sequence = pickWeightedCandidate(
    () => generateSequence(gridSize, length),
    (s) => `${level}:${classifySpatialSequence(s, gridSize)}`,
    stats,
    undefined,
    exclude,
  )
  return { id: `${level}-${Date.now()}-${idSuffix}`, gridSize, sequence }
}

// exclude: 直前に中断したセットで実際に表示済みだった系列（モードを途中で
// やめて再挑戦した際、同じ問題が出ないようにする）
export function pickSpatialQuestionSet(level: Level, exclude: number[][] = []): SpatialQuestion[] {
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => pickSpatialQuestion(level, i, exclude))
}

export function recordSpatialAttempt(
  level: Level,
  sequence: number[],
  gridSize: number,
  correct: boolean,
): void {
  recordBucketAttempt(
    STATS_MODE,
    `${level}:${classifySpatialSequence(sequence, gridSize)}`,
    correct,
  )
}

export function reverseSequence(sequence: number[]): number[] {
  return sequence.slice().reverse()
}

export function isSpatialAnswerCorrect(
  tapped: number[],
  expected: number[],
): boolean {
  if (tapped.length !== expected.length) return false
  return tapped.every((cell, i) => cell === expected[i])
}

// マスを1つずつ光らせる際の表示時間と、マス同士の間の空白時間
export const SPATIAL_SHOWN_MS = 700
export const SPATIAL_GAP_MS = 250

// レベル選択後、最初のマスが光るまでの間を置く時間
export const READY_MS = 1000

// マス数が多いほどタップして答えるのに時間がかかるため、マス数に応じて回答時間を伸ばす
const ANSWER_BASE_MS = 3000
const ANSWER_MS_PER_CELL = 2000

export function getAnswerTimeoutMs(length: number): number {
  return ANSWER_BASE_MS + length * ANSWER_MS_PER_CELL
}
