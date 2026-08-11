import { reverseDigits, sumDigits } from '../lib/digits'
import { reverseSequence } from '../lib/spatial'
import { useTranslation } from '../contexts/LanguageContext'
import type { RandomRound } from '../types'

interface RandomResultDetailProps {
  round: RandomRound
  typed: string
  tapped: number[]
}

// バグ修正: これまでランダムモードの結果フェーズはResultBadge（正解/不正解の
// バッジ）のみを表示し、単体モード画面（DigitGameScreen等）と異なり
// 「出題」「正しい答え」「あなたの回答」といった詳細が一切表示されていなかった。
// 各モードの単体画面と同じ内容をラウンド種別ごとに出し分けて表示する
export function RandomResultDetail({ round, typed, tapped }: RandomResultDetailProps) {
  const t = useTranslation()

  if (round.mode === 'digit') {
    const expectedAnswer =
      round.gameType === 'reverse'
        ? reverseDigits(round.question.digits)
        : sumDigits(round.question.digits)
    return (
      <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
        <p>
          {t.digit.questionLabel}
          {round.question.digits.join('')}
        </p>
        <p>
          {t.common.correctAnswerLabel}
          {expectedAnswer}
        </p>
        <p>
          {t.common.yourAnswerLabel}
          {typed || t.digit.noInput}
        </p>
      </div>
    )
  }

  if (round.mode === 'spatial') {
    const expected = reverseSequence(round.question.sequence)
    return (
      <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
        <p>
          {t.common.correctOrderLabel}
          {expected.map((c) => c + 1).join(' → ')}
        </p>
        <p>
          {t.common.yourAnswerLabel}
          {tapped.length > 0 ? tapped.map((c) => c + 1).join(' → ') : t.common.noAnswer}
        </p>
      </div>
    )
  }

  if (round.mode === 'tone') {
    return (
      <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
        <p>
          {t.common.correctOrderLabel}
          {round.question.sequence.map((p) => t.tone.padColors[p]).join(' → ')}
        </p>
        <p>
          {t.common.yourAnswerLabel}
          {tapped.length > 0
            ? tapped.map((p) => t.tone.padColors[p]).join(' → ')
            : t.common.noAnswer}
        </p>
      </div>
    )
  }

  // ops-span/wordラウンドは専用コンポーネント(RandomOpsSpanRound/
  // RandomWordRound)が自前の結果画面を表示するため、ここには到達しない
  if (round.mode === 'ops-span' || round.mode === 'word') return null

  // pattern: 正解のマス(緑)・誤選択(赤)・選び漏れ(黄)を色分け表示する
  // （PatternGameScreen.tsxの結果表示と同じ配色ロジック）
  const cellCount = round.question.gridSize * round.question.gridSize
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${round.question.gridSize}, minmax(0, 1fr))`,
        width: round.question.gridSize * 48,
        maxWidth: '100%',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: cellCount }, (_, cell) => {
        const wasFilled = round.question.filledCells.includes(cell)
        const wasSelected = tapped.includes(cell)
        let colorClass = 'bg-gray-100 dark:bg-gray-700'
        if (wasFilled && wasSelected) colorClass = 'bg-emerald-500'
        else if (wasSelected && !wasFilled) colorClass = 'bg-rose-500'
        else if (wasFilled && !wasSelected) colorClass = 'bg-amber-400'
        return <div key={cell} className={`aspect-square rounded-lg ${colorClass}`} />
      })}
    </div>
  )
}
