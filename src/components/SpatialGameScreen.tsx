import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import {
  pickSpatialQuestionSet,
  reverseSequence,
  isSpatialAnswerCorrect,
  recordSpatialAttempt,
  SPATIAL_SHOWN_MS,
  SPATIAL_GAP_MS,
  READY_MS,
  getAnswerTimeoutMs,
} from '../lib/spatial'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { useTranslation } from '../contexts/LanguageContext'
import type {
  BaseGameScreenProps,
  SpatialQuestion,
  SpatialQuestionPhase,
  SpatialQuestionResult,
} from '../types'

type SpatialGameScreenProps = BaseGameScreenProps

export function SpatialGameScreen({
  level,
  onExit,
  onSelectLevel,
}: SpatialGameScreenProps) {
  const t = useTranslation()
  const [questions, setQuestions] = useState<SpatialQuestion[]>(() =>
    pickSpatialQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<SpatialQuestionPhase>('ready')
  const [tapped, setTapped] = useState<number[]>([])
  // タイムアウト時に最新の入力値を読むための参照(setStateのアップデータ内で
  // 副作用を呼ぶのを避けるため)
  const tappedRef = useRef(tapped)
  tappedRef.current = tapped
  const [currentResult, setCurrentResult] =
    useState<SpatialQuestionResult | null>(null)
  const [results, setResults] = useState<SpatialQuestionResult[]>([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[currentIndex]
  const cellCount = currentQuestion.gridSize * currentQuestion.gridSize

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setTapped([])
    setCurrentResult(null)
  }, [currentQuestion])

  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentQuestion])

  // マスを1つずつ順番に光らせる
  const { index: litIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: currentQuestion.sequence.length,
    shownMs: SPATIAL_SHOWN_MS,
    gapMs: SPATIAL_GAP_MS,
    onComplete: () => setPhase('answering'),
  })

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら自動で採点する
  const answerRemaining = useCountdown(
    phase === 'answering',
    getAnswerTimeoutMs(currentQuestion.sequence.length),
    () => finalizeAnswer(tappedRef.current),
  )

  function handleCellTap(cell: number) {
    if (phase !== 'answering') return
    if (loadSettings().soundEnabled) playButtonTap()
    setTapped((prev) => {
      if (prev.length >= currentQuestion.sequence.length) return prev
      if (prev.includes(cell)) return prev
      const next = [...prev, cell]
      if (next.length === currentQuestion.sequence.length) {
        finalizeAnswer(next)
      }
      return next
    })
  }

  // 結果表示中はEnterキーでも次の問題へ進めるようにする。finished後もこれが
  // 有効だと、SetSummary自身のEnterハンドラと二重に発火し履歴が二重記録
  // されてしまうため、finished中は無効化する
  useEnterKey(phase === 'result' && !finished, handleNext)

  function finalizeAnswer(value: number[]) {
    const expectedAnswer = reverseSequence(currentQuestion.sequence)
    const correct = isSpatialAnswerCorrect(value, expectedAnswer)
    recordSpatialAttempt(level, currentQuestion.sequence, currentQuestion.gridSize, correct)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({
      question: currentQuestion,
      expectedAnswer,
      tapped: value,
      correct,
    })
    setPhase('result')
  }

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'spatial',
    level,
    correctCount: results.filter((r) => r.correct).length,
    total: results.length,
  })

  function handleNext() {
    if (!currentResult) return
    if (loadSettings().soundEnabled) playButtonTap()
    const updated = [...results, currentResult]
    setResults(updated)
    if (currentIndex + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleRetry() {
    setQuestions(pickSpatialQuestionSet(level))
    setCurrentIndex(0)
    setResults([])
    setCurrentResult(null)
    setFinished(false)
  }

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length
    const accuracyPercent =
      results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
    const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
    return (
      <SetSummary
        items={results.map((r) => ({
          key: r.question.id,
          label: t.spatial.resultLabel(r.question.sequence.length),
          correct: r.correct,
        }))}
        onRetry={handleRetry}
        onChangeLevel={onExit}
        newAchievements={newAchievements}
        isNewBest={isNewBest}
        xpGained={xpGained}
        leveledUp={leveledUp}
        newLevel={newLevel}
        suggestion={
          suggestedLevel
            ? {
                label:
                  suggestedLevel > level
                    ? t.common.suggestionUp(t.spatial.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(
                        t.spatial.levelLabel(suggestedLevel),
                      ),
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <GameHeader
        backLabel={t.common.backToLevelSelect}
        onBack={() =>
          confirmExit(
            results.length > 0 || currentResult !== null,
            onExit,
            t.common.confirmExitMessage,
          )
        }
        currentIndex={currentIndex}
        total={questions.length}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:px-6 sm:py-10 dark:border-gray-700 dark:bg-gray-800"
      >
        {(phase === 'ready' || phase === 'showing') && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            {t.common.rememberPrompt}
          </p>
        )}
        {phase === 'answering' && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {t.spatial.answerPrompt}
            </p>
            <p aria-hidden="true" className="text-2xl font-bold text-rose-500">
              {answerRemaining}
            </p>
          </>
        )}

        {phase !== 'result' && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${currentQuestion.gridSize}, minmax(0, 1fr))`,
              width: currentQuestion.gridSize * 56,
              maxWidth: '100%',
            }}
            aria-label={
              phase === 'showing' ? t.spatial.litSquaresAriaLabel : undefined
            }
          >
            {Array.from({ length: cellCount }, (_, cell) => {
              const isLit =
                phase === 'showing' &&
                !isGap &&
                currentQuestion.sequence[litIndex] === cell
              const tapOrder = tapped.indexOf(cell)
              const isTapped = tapOrder !== -1
              return (
                <button
                  key={cell}
                  type="button"
                  disabled={phase !== 'answering'}
                  onClick={() => handleCellTap(cell)}
                  aria-label={t.spatial.cellAriaLabel(
                    cell + 1,
                    isTapped ? tapOrder + 1 : null,
                  )}
                  className={`aspect-square touch-manipulation rounded-lg text-sm font-bold transition disabled:cursor-not-allowed ${
                    isLit
                      ? 'bg-indigo-500 text-white'
                      : isTapped
                        ? 'bg-emerald-400 text-white'
                        : 'bg-gray-100 text-gray-400 hover:enabled:bg-gray-200 dark:bg-gray-700 dark:text-gray-500 dark:hover:enabled:bg-gray-600'
                  }`}
                >
                  {isTapped ? tapOrder + 1 : ''}
                </button>
              )
            })}
          </div>
        )}

        {phase === 'result' && currentResult && (
          <>
            <ResultBadge correct={currentResult.correct} />
            <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
              <p>
                {t.common.correctOrderLabel}
                {currentResult.expectedAnswer.map((c) => c + 1).join(' → ')}
              </p>
              <p>
                {t.common.yourAnswerLabel}
                {currentResult.tapped.length > 0
                  ? currentResult.tapped.map((c) => c + 1).join(' → ')
                  : t.common.noAnswer}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
            >
              {currentIndex + 1 >= questions.length
                ? t.common.seeResults
                : t.common.next}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
