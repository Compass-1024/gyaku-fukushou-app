import type { RandomQuestionPhase, RandomRound } from '../types'

interface RandomSpatialGridProps {
  round: Extract<RandomRound, { mode: 'spatial' }>
  phase: RandomQuestionPhase
  isGap: boolean
  stepIndex: number
  arrayValue: number[]
  paused: boolean
  onTap: (cell: number) => void
}

// fix③-7: RandomGameScreen.tsxの肥大化対策で、空間ラウンドのグリッド表示を
// 切り出したもの。挙動はSpatialGameScreen.tsxのグリッドと同じ
export function RandomSpatialGrid({
  round,
  phase,
  isGap,
  stepIndex,
  arrayValue,
  paused,
  onTap,
}: RandomSpatialGridProps) {
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
          const isLit =
            phase === 'showing' && !isGap && round.question.sequence[stepIndex] === cell
          const tapOrder = arrayValue.indexOf(cell)
          const isTapped = tapOrder !== -1
          return (
            <button
              key={cell}
              type="button"
              disabled={phase !== 'answering' || paused}
              onClick={() => onTap(cell)}
              className={`aspect-square touch-manipulation rounded-lg text-sm font-bold transition disabled:cursor-not-allowed ${
                isLit
                  ? 'bg-indigo-500 text-white'
                  : isTapped
                    ? 'bg-emerald-400 text-white'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              {isTapped ? tapOrder + 1 : ''}
            </button>
          )
        },
      )}
    </div>
  )
}
