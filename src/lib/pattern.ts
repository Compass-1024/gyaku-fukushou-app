import type { Level, PatternQuestion } from '../types'
import { loadBucketStats, recordBucketAttempt, pickWeightedCandidate } from './questionWeighting'

const GRID_SIZE: Record<Level, number> = { 1: 4, 2: 4, 3: 5 }
const FILLED_COUNT: Record<Level, number> = { 1: 4, 2: 6, 3: 8 }

const QUESTIONS_PER_SET = 3
const STATS_MODE = 'pattern'

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

// 出題重み付け用の模様パターン分類。塗りつぶしマスの平均マス間距離が
// グリッド幅の半分以下なら'clustered'（かたまって配置）、それより離れて
// いれば'scattered'（散らばって配置）とする（まとまった配置はチャンク化
// しやすく、難易度に影響しうる特徴のため）
function classifyFilledCells(filledCells: number[], gridSize: number): string {
  let totalDistance = 0
  let pairCount = 0
  for (let i = 0; i < filledCells.length; i++) {
    for (let j = i + 1; j < filledCells.length; j++) {
      const ax = filledCells[i] % gridSize
      const ay = Math.floor(filledCells[i] / gridSize)
      const bx = filledCells[j] % gridSize
      const by = Math.floor(filledCells[j] / gridSize)
      totalDistance += Math.abs(ax - bx) + Math.abs(ay - by)
      pairCount += 1
    }
  }
  const avgDistance = pairCount > 0 ? totalDistance / pairCount : 0
  return avgDistance <= gridSize / 2 ? 'clustered' : 'scattered'
}

// 誤答が多い模様パターンほど選ばれやすい重み付き抽選で出題する
export function pickPatternQuestionSet(level: Level): PatternQuestion[] {
  const gridSize = GRID_SIZE[level]
  const totalCells = gridSize * gridSize
  const count = FILLED_COUNT[level]
  const now = Date.now()
  const stats = loadBucketStats(STATS_MODE)
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => {
    const filledCells = pickWeightedCandidate(
      () => pickRandomCells(totalCells, count),
      (cells) => `${level}:${classifyFilledCells(cells, gridSize)}`,
      stats,
    )
    return { id: `${level}-${now}-${i}`, gridSize, filledCells }
  })
}

export function recordPatternAttempt(
  level: Level,
  filledCells: number[],
  gridSize: number,
  correct: boolean,
): void {
  recordBucketAttempt(
    STATS_MODE,
    `${level}:${classifyFilledCells(filledCells, gridSize)}`,
    correct,
  )
}

// 白紙に戻った状態から選び直したマスが、元の塗りつぶしマスと完全一致（順不同）
// する場合のみ正解とする
export function isPatternSelectionCorrect(
  selected: number[],
  filledCells: number[],
): boolean {
  if (selected.length !== filledCells.length) return false
  const expected = new Set(filledCells)
  return selected.every((c) => expected.has(c))
}

// 模様の表示時間、表示と回答の間に挟む空白時間
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
