import type { Level, PatternQuestion } from '../types'

const GRID_SIZE: Record<Level, number> = { 1: 4, 2: 4, 3: 5 }
const FILLED_COUNT: Record<Level, number> = { 1: 4, 2: 6, 3: 8 }

const QUESTIONS_PER_SET = 3
const CHANGE_PROBABILITY = 0.5

function pickRandomCells(totalCells: number, count: number): number[] {
  const cells = Array.from({ length: totalCells }, (_, i) => i)
  const picked: number[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * cells.length)
    picked.push(cells[idx])
    cells.splice(idx, 1)
  }
  return picked
}

// 変化ありの場合、塗りつぶしマスを1つだけ別の空きマスへ移動させる
// （Luck & Vogel (1997) の変化検出課題に倣い、追加/削除ではなく1箇所の位置変化にする）
function buildComparisonCells(
  filledCells: number[],
  totalCells: number,
  hasChange: boolean,
): number[] {
  if (!hasChange) return filledCells.slice()
  const emptyCells = Array.from({ length: totalCells }, (_, i) => i).filter(
    (c) => !filledCells.includes(c),
  )
  if (emptyCells.length === 0) return filledCells.slice()
  const swapOutIdx = Math.floor(Math.random() * filledCells.length)
  const swapInIdx = Math.floor(Math.random() * emptyCells.length)
  const next = filledCells.slice()
  next[swapOutIdx] = emptyCells[swapInIdx]
  return next
}

export function pickPatternQuestionSet(level: Level): PatternQuestion[] {
  const gridSize = GRID_SIZE[level]
  const totalCells = gridSize * gridSize
  const count = FILLED_COUNT[level]
  const now = Date.now()
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => {
    const filledCells = pickRandomCells(totalCells, count)
    const hasChange = Math.random() < CHANGE_PROBABILITY
    return {
      id: `${level}-${now}-${i}`,
      gridSize,
      filledCells,
      comparisonCells: buildComparisonCells(filledCells, totalCells, hasChange),
      hasChange,
    }
  })
}

export function isPatternAnswerCorrect(
  answeredChanged: boolean,
  hasChange: boolean,
): boolean {
  return answeredChanged === hasChange
}

// 模様の表示時間、表示と比較の間に挟む空白時間
export const PATTERN_SHOWN_MS = 3000
export const PATTERN_BLANK_MS = 500

// レベル選択後、最初の模様が表示されるまでの間を置く時間
export const READY_MS = 1000

// マス数が多いほど見比べるのに時間がかかるため、塗りつぶしマス数に応じて回答時間を伸ばす
const ANSWER_BASE_MS = 4000
const ANSWER_MS_PER_CELL = 400

export function getAnswerTimeoutMs(filledCount: number): number {
  return ANSWER_BASE_MS + filledCount * ANSWER_MS_PER_CELL
}
