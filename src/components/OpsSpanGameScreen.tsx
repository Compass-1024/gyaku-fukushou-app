import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useOpsSpanTrialFlow } from '../hooks/useOpsSpanTrialFlow'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { usePauseState } from '../hooks/usePauseState'
import {
  pickOpsSpanQuestionSet,
  getOpsSpanExpectedAnswer,
  isOpsSpanAnswerCorrect,
  READY_MS,
} from '../lib/opsSpan'
import { getAnswerTimeoutMs } from '../lib/digits'
import { saveRecentQuestions, consumeRecentQuestions } from '../lib/recentQuestions'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { playCorrectHaptic, playIncorrectHaptic } from '../lib/haptics'
import { NumpadInput } from './NumpadInput'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { PausableAnswering } from './PausableAnswering'
import { useTranslation } from '../contexts/LanguageContext'
import type {
  BaseGameScreenProps,
  OpsSpanPhase,
  OpsSpanQuestion,
  OpsSpanQuestionResult,
} from '../types'

type OpsSpanGameScreenProps = BaseGameScreenProps

export function OpsSpanGameScreen({
  level,
  onExit,
  onSelectLevel,
}: OpsSpanGameScreenProps) {
  const t = useTranslation()
  // 直前に中断したセットで表示済みだった記憶数字列を、再挑戦時の出題候補から
  // 除外する（モードを途中でやめて再びトライすると、やめる前と異なる問題に
  // なるようにする）
  const [questions, setQuestions] = useState<OpsSpanQuestion[]>(() =>
    pickOpsSpanQuestionSet(level, consumeRecentQuestions<number[]>(`ops-span:${level}`)),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<OpsSpanPhase>('ready')
  const [typed, setTyped] = useState('')
  const typedRef = useRef(typed)
  typedRef.current = typed
  const [currentResult, setCurrentResult] = useState<OpsSpanQuestionResult | null>(null)
  const [results, setResults] = useState<OpsSpanQuestionResult[]>([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[currentIndex]
  const maxAnswerLength = currentQuestion.trials.length

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setTyped('')
    setCurrentResult(null)
  }, [currentQuestion])

  // 最初の試行が始まるまで少し間を置く
  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentQuestion])

  const { trialIndex, subPhase, judge } = useOpsSpanTrialFlow({
    active: phase === 'showing',
    trials: currentQuestion.trials,
    onComplete: (judgedCorrectCount) => {
      judgedCorrectCountRef.current = judgedCorrectCount
      setPhase('answering')
    },
  })
  // onCompleteのクロージャ内でしか得られない値を、finalizeAnswer側で
  // 参照できるようにrefに退避する
  const judgedCorrectCountRef = useRef(0)

  const { paused, pause, resume } = usePauseState(currentQuestion)

  const answerRemaining = useCountdown(
    phase === 'answering',
    getAnswerTimeoutMs(maxAnswerLength),
    () => finalizeAnswer(typedRef.current),
    paused,
  )

  function handleDigitPress(d: string) {
    if (paused) return
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => {
      if (prev.length >= maxAnswerLength) return prev
      const next = prev + d
      if (next.length === maxAnswerLength) finalizeAnswer(next)
      return next
    })
  }

  function handleBackspacePress() {
    if (paused) return
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => prev.slice(0, -1))
  }

  useEffect(() => {
    if (phase !== 'answering' || paused) return
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

  useEnterKey(phase === 'result' && !finished, handleNext)

  function commitAnswer() {
    if (paused) return
    setTyped((prev) => {
      if (prev.length > 0) finalizeAnswer(prev)
      return prev
    })
  }

  function finalizeAnswer(value: string) {
    const expectedAnswer = getOpsSpanExpectedAnswer(currentQuestion)
    const correct = isOpsSpanAnswerCorrect(value, expectedAnswer)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    if (loadSettings().hapticsEnabled) {
      if (correct) playCorrectHaptic()
      else playIncorrectHaptic()
    }
    setCurrentResult({
      question: currentQuestion,
      expectedAnswer,
      typed: value,
      correct,
      judgedCorrectCount: judgedCorrectCountRef.current,
    })
    setPhase('result')
  }

  const { newAchievements, isNewBest, isNewTodayBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'ops-span',
    level,
    correctCount: results.filter((r) => r.correct).length,
    total: results.length,
  })

  const TOTAL_QUESTIONS = 3

  function handleNext() {
    if (!currentResult) return
    if (loadSettings().soundEnabled) playButtonTap()
    const updated = [...results, currentResult]
    setResults(updated)
    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      setFinished(true)
      return
    }
    setCurrentIndex((i) => i + 1)
  }

  function handleRetry() {
    setQuestions(pickOpsSpanQuestionSet(level))
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
          label: r.expectedAnswer,
          correct: r.correct,
        }))}
        onRetry={handleRetry}
        onChangeLevel={onExit}
        newAchievements={newAchievements}
        isNewBest={isNewBest}
        isNewTodayBest={isNewTodayBest}
        xpGained={xpGained}
        leveledUp={leveledUp}
        newLevel={newLevel}
        suggestion={
          suggestedLevel
            ? {
                label:
                  suggestedLevel > level
                    ? t.common.suggestionUp(t.opsSpan.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(t.opsSpan.levelLabel(suggestedLevel)),
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      />
    )
  }

  const activeTrial = currentQuestion.trials[trialIndex]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <GameHeader
        backLabel={t.common.backToLevelSelect}
        onBack={() =>
          confirmExit(
            results.length > 0 || currentResult !== null,
            () => {
              saveRecentQuestions(
                `ops-span:${level}`,
                questions.slice(0, currentIndex + 1).map((q) => q.trials.map((tr) => tr.memoryDigit)),
              )
              onExit()
            },
            t.common.confirmExitMessage,
          )
        }
        currentIndex={currentIndex}
        total={TOTAL_QUESTIONS}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:px-6 sm:py-10 dark:border-gray-700 dark:bg-gray-800"
      >
        {phase === 'showing' && subPhase === 'judging' && activeTrial && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {t.opsSpan.judgePrompt}
            </p>
            <p className="text-4xl font-bold tabular-nums text-indigo-500">
              {t.opsSpan.judgeExpression(activeTrial.a, activeTrial.b, activeTrial.shownSum)}
            </p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => judge(true)}
                className="touch-manipulation rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-400"
              >
                {t.opsSpan.judgeTrueButton}
              </button>
              <button
                type="button"
                onClick={() => judge(false)}
                className="touch-manipulation rounded-lg bg-rose-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-400"
              >
                {t.opsSpan.judgeFalseButton}
              </button>
            </div>
          </>
        )}

        {phase === 'showing' && subPhase !== 'judging' && activeTrial && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {t.common.rememberPrompt}
            </p>
            <p
              aria-hidden="true"
              className="text-7xl font-bold tabular-nums text-indigo-500"
            >
              {subPhase === 'gap' ? ' ' : activeTrial.memoryDigit}
            </p>
          </>
        )}

        {(phase === 'ready' || (phase === 'showing' && !activeTrial)) && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            {t.common.rememberPrompt}
          </p>
        )}

        {phase === 'answering' && (
          <PausableAnswering
            paused={paused}
            onPause={pause}
            onResume={resume}
            prompt={t.opsSpan.answerPrompt}
            remainingSeconds={answerRemaining}
          >
            <NumpadInput
              value={typed}
              maxLength={maxAnswerLength}
              onDigit={handleDigitPress}
              onBackspace={handleBackspacePress}
              onSubmit={commitAnswer}
            />
          </PausableAnswering>
        )}

        {phase === 'result' && currentResult && (
          <>
            <ResultBadge correct={currentResult.correct} />
            <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
              <p>
                {t.opsSpan.questionLabel}
                {currentResult.expectedAnswer}
              </p>
              <p>
                {t.common.yourAnswerLabel}
                {currentResult.typed || t.opsSpan.noInput}
              </p>
              <p>
                {t.opsSpan.judgedAccuracyLabel(
                  currentResult.judgedCorrectCount,
                  currentResult.question.trials.length,
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
            >
              {currentIndex + 1 >= TOTAL_QUESTIONS
                ? t.common.seeResults
                : t.common.next}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
