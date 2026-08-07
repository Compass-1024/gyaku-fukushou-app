import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import {
  pickSequenceQuestionSet,
  expectedSequenceAnswer,
  isSequenceAnswerCorrect,
  recordSequenceAttempt,
  DIGIT_SHOWN_MS,
  DIGIT_GAP_MS,
  READY_MS,
  getAnswerTimeoutMs,
} from '../lib/sequence'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { NumpadInput } from './NumpadInput'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { useTranslation } from '../contexts/LanguageContext'
import type {
  BaseGameScreenProps,
  SequenceQuestion,
  SequenceQuestionPhase,
  SequenceQuestionResult,
} from '../types'

type SequenceGameScreenProps = BaseGameScreenProps

export function SequenceGameScreen({
  level,
  onExit,
  onSelectLevel,
}: SequenceGameScreenProps) {
  const t = useTranslation()
  const [questions, setQuestions] = useState<SequenceQuestion[]>(() =>
    pickSequenceQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<SequenceQuestionPhase>('ready')
  const [typed, setTyped] = useState('')
  // タイムアウト時に最新の入力値を読むための参照(setStateのアップデータ内で
  // 副作用を呼ぶのを避けるため)
  const typedRef = useRef(typed)
  typedRef.current = typed
  const [currentResult, setCurrentResult] =
    useState<SequenceQuestionResult | null>(null)
  const [results, setResults] = useState<SequenceQuestionResult[]>([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[currentIndex]
  const maxAnswerLength = currentQuestion.digits.length

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setTyped('')
    setCurrentResult(null)
  }, [currentQuestion])

  // 数字が表示され始めるまで少し間を置く
  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentQuestion])

  // 数字を1つずつ順番に表示する
  const { index: digitPos, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: currentQuestion.digits.length,
    shownMs: DIGIT_SHOWN_MS,
    gapMs: DIGIT_GAP_MS,
    onComplete: () => setPhase('answering'),
  })

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら自動で採点する
  const answerRemaining = useCountdown(
    phase === 'answering',
    getAnswerTimeoutMs(currentQuestion.digits.length),
    () => finalizeAnswer(typedRef.current),
  )

  function handleDigitPress(d: string) {
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => {
      if (prev.length >= maxAnswerLength) return prev
      const next = prev + d
      // 桁数が既知のため、入力が揃った時点で決定ボタンを押さずとも自動採点する
      if (next.length === maxAnswerLength) {
        finalizeAnswer(next)
      }
      return next
    })
  }

  function handleBackspacePress() {
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => prev.slice(0, -1))
  }

  // 回答フェーズ中は物理キーボードの数字入力も受け付ける
  useEffect(() => {
    if (phase !== 'answering') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspacePress()
      } else if (e.key === 'Enter') {
        commitAnswer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // 結果表示中はEnterキーでも次の問題へ進めるようにする。finished後もこれが
  // 有効だと、SetSummary自身のEnterハンドラと二重に発火し履歴が二重記録
  // されてしまうため、finished中は無効化する
  useEnterKey(phase === 'result' && !finished, handleNext)

  // setTyped の関数形更新の中で読むことで、直前の入力を確実に拾ってから採点する
  function commitAnswer() {
    setTyped((prev) => {
      if (prev.length > 0) finalizeAnswer(prev)
      return prev
    })
  }

  function finalizeAnswer(value: string) {
    const expectedAnswer = expectedSequenceAnswer(currentQuestion.digits)
    const correct = isSequenceAnswerCorrect(value, expectedAnswer)
    recordSequenceAttempt(level, currentQuestion.digits, correct)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({
      question: currentQuestion,
      expectedAnswer,
      typed: value,
      correct,
    })
    setPhase('result')
  }

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'sequence',
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
    setQuestions(pickSequenceQuestionSet(level))
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
          label: r.question.digits.join(''),
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
                    ? t.common.suggestionUp(t.sequence.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(
                        t.sequence.levelLabel(suggestedLevel),
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
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {t.common.rememberPrompt}
            </p>
            <p
              aria-hidden="true"
              className="text-7xl font-bold tabular-nums text-indigo-500"
            >
              {phase === 'ready' || isGap ? ' ' : currentQuestion.digits[digitPos]}
            </p>
          </>
        )}

        {phase === 'answering' && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {t.sequence.answerPrompt}
            </p>
            <p aria-hidden="true" className="text-2xl font-bold text-rose-500">
              {answerRemaining}
            </p>
            <NumpadInput
              value={typed}
              maxLength={maxAnswerLength}
              onDigit={handleDigitPress}
              onBackspace={handleBackspacePress}
              onSubmit={commitAnswer}
            />
          </>
        )}

        {phase === 'result' && currentResult && (
          <>
            <ResultBadge correct={currentResult.correct} />
            <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
              <p>
                {t.sequence.questionLabel}
                {currentResult.question.digits.join('')}
              </p>
              <p>
                {t.common.correctAnswerLabel}
                {currentResult.expectedAnswer}
              </p>
              <p>
                {t.common.yourAnswerLabel}
                {currentResult.typed || t.sequence.noInput}
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
