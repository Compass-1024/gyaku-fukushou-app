import { useEffect, useRef, useState } from 'react'
import { useCountdown } from '../hooks/useCountdown'
import { useOpsSpanTrialFlow } from '../hooks/useOpsSpanTrialFlow'
import { usePauseState } from '../hooks/usePauseState'
import {
  getOpsSpanExpectedAnswer,
  isOpsSpanAnswerCorrect,
  READY_MS,
} from '../lib/opsSpan'
import { getAnswerTimeoutMs } from '../lib/digits'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { playCorrectHaptic, playIncorrectHaptic } from '../lib/haptics'
import { NumpadInput } from './NumpadInput'
import { ResultBadge } from './ResultBadge'
import { PausableAnswering } from './PausableAnswering'
import { useTranslation } from '../contexts/LanguageContext'
import type { OpsSpanPhase, OpsSpanQuestion } from '../types'

interface RandomOpsSpanRoundProps {
  question: OpsSpanQuestion
  isLastRound: boolean
  onFinish: (outcome: { correct: boolean; typed: string; expectedAnswer: string }) => void
}

// ランダムモードの処理記憶ラウンド。単体の処理記憶モード(OpsSpanGameScreen.tsx)
// と同じ「暗算の正誤判定→数字の記憶」の試行ループを1問ぶんだけ独立に実行する。
// 試行中にユーザー入力(⭕/❌タップ)を待つ点が他ラウンドのuseStepReveal前提の
// 共通showingフェーズと異なるため、ことばラウンドと同様に自己完結した
// コンポーネントとして切り出している
export function RandomOpsSpanRound({ question, isLastRound, onFinish }: RandomOpsSpanRoundProps) {
  const t = useTranslation()
  const [phase, setPhase] = useState<OpsSpanPhase>('ready')
  const [typed, setTyped] = useState('')
  const typedRef = useRef(typed)
  typedRef.current = typed
  const judgedCorrectCountRef = useRef(0)
  const maxAnswerLength = question.trials.length

  useEffect(() => {
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question])

  const { trialIndex, subPhase, judge } = useOpsSpanTrialFlow({
    active: phase === 'showing',
    trials: question.trials,
    onComplete: (judgedCorrectCount) => {
      judgedCorrectCountRef.current = judgedCorrectCount
      setPhase('answering')
    },
  })

  const { paused, pause, resume } = usePauseState(question)

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

  function commitAnswer() {
    if (paused) return
    setTyped((prev) => {
      if (prev.length > 0) finalizeAnswer(prev)
      return prev
    })
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

  const [result, setResult] = useState<{
    correct: boolean
    typed: string
    expectedAnswer: string
    judgedCorrectCount: number
  } | null>(null)

  function finalizeAnswer(value: string) {
    const expectedAnswer = getOpsSpanExpectedAnswer(question)
    const correct = isOpsSpanAnswerCorrect(value, expectedAnswer)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    if (loadSettings().hapticsEnabled) {
      if (correct) playCorrectHaptic()
      else playIncorrectHaptic()
    }
    setResult({
      correct,
      typed: value,
      expectedAnswer,
      judgedCorrectCount: judgedCorrectCountRef.current,
    })
    setPhase('result')
  }

  function handleNext() {
    if (!result) return
    if (loadSettings().soundEnabled) playButtonTap()
    onFinish({ correct: result.correct, typed: result.typed, expectedAnswer: result.expectedAnswer })
  }

  const activeTrial = question.trials[trialIndex]

  return (
    <>
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
          <p aria-hidden="true" className="text-7xl font-bold tabular-nums text-indigo-500">
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

      {phase === 'result' && result && (
        <>
          <ResultBadge correct={result.correct} />
          <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
            <p>
              {t.opsSpan.questionLabel}
              {result.expectedAnswer}
            </p>
            <p>
              {t.common.yourAnswerLabel}
              {result.typed || t.opsSpan.noInput}
            </p>
            <p>
              {t.opsSpan.judgedAccuracyLabel(result.judgedCorrectCount, question.trials.length)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            {isLastRound ? t.common.seeResults : t.common.next}
          </button>
        </>
      )}
    </>
  )
}
