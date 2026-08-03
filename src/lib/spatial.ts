import type { Level, SpatialQuestion } from '../types'

const GRID_SIZE: Record<Level, number> = { 1: 3, 2: 3, 3: 4 }
const SEQUENCE_LENGTH: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }

const QUESTIONS_PER_SET = 3

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

export function pickSpatialQuestionSet(level: Level): SpatialQuestion[] {
  const gridSize = GRID_SIZE[level]
  const length = SEQUENCE_LENGTH[level]
  const now = Date.now()
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => ({
    id: `${level}-${now}-${i}`,
    gridSize,
    sequence: generateSequence(gridSize, length),
  }))
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
