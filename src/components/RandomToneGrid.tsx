import { PAD_COUNT } from '../lib/tone'
import { useTranslation } from '../contexts/LanguageContext'
import type { RandomQuestionPhase, RandomRound } from '../types'

interface RandomToneGridProps {
  round: Extract<RandomRound, { mode: 'tone' }>
  phase: RandomQuestionPhase
  isGap: boolean
  stepIndex: number
  arrayValue: number[]
  paused: boolean
  onTap: (pad: number) => void
}

// fix③-7: RandomGameScreen.tsxの肥大化対策で、音・色ラウンドのパッド表示を
// 切り出したもの。挙動はToneGameScreen.tsxのパッドと同じ
export function RandomToneGrid({
  round,
  phase,
  isGap,
  stepIndex,
  arrayValue,
  paused,
  onTap,
}: RandomToneGridProps) {
  const t = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3" style={{ width: 176 }}>
      {Array.from({ length: PAD_COUNT }, (_, pad) => {
        const isLit =
          phase === 'showing' && !isGap && round.question.sequence[stepIndex] === pad
        const tapOrder = arrayValue.indexOf(pad)
        return (
          <button
            key={pad}
            type="button"
            disabled={phase !== 'answering' || paused}
            onClick={() => onTap(pad)}
            aria-label={t.tone.padAriaLabel(t.tone.padColors[pad])}
            className={`aspect-square touch-manipulation rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed ${
              isLit ? 'bg-indigo-300' : 'bg-indigo-500'
            }`}
          >
            {tapOrder !== -1 && <span className="text-sm font-bold">{tapOrder + 1}</span>}
          </button>
        )
      })}
    </div>
  )
}
