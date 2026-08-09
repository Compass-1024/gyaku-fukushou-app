import type { RandomQuestionPhase, RandomRound } from '../types'

interface RandomPatternGridProps {
  round: Extract<RandomRound, { mode: 'pattern' }>
  phase: RandomQuestionPhase
  isGap: boolean
  arrayValue: number[]
  paused: boolean
  onToggle: (cell: number) => void
}

// fix③-7: RandomGameScreen.tsxの肥大化対策で、変化検出ラウンドのグリッド
// 表示を切り出したもの。挙動はPatternGameScreen.tsxのグリッドと同じ
export function RandomPatternGrid({
  round,
  phase,
  isGap,
  arrayValue,
  paused,
  onToggle,
}: RandomPatternGridProps) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${round.question.gridSize}, minmax(0, 1fr))`,
        width: round.question.gridSize * 48,
        maxWidth: '100%',
      }}
    >
      {Array.from(
        { length: round.question.gridSize * round.question.gridSize },
        (_, cell) => {
          const isShown =
            phase === 'showing' && !isGap && round.question.filledCells.includes(cell)
          const isSelected = arrayValue.includes(cell)
          return (
            <button
              key={cell}
              type="button"
              disabled={phase !== 'answering' || paused}
              onClick={() => onToggle(cell)}
              className={`aspect-square touch-manipulation rounded-lg transition disabled:cursor-not-allowed ${
                isShown || isSelected
                  ? 'bg-indigo-500'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            />
          )
        },
      )}
    </div>
  )
}
