import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { usePauseState } from '../hooks/usePauseState'
import {
  pickToneQuestionSet,
  isToneAnswerCorrect,
  recordToneAttempt,
  TONE_SHOWN_MS,
  TONE_GAP_MS,
  READY_MS,
  getAnswerTimeoutMs,
  PAD_COUNT,
} from '../lib/tone'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import {
  playCorrectSound,
  playIncorrectSound,
  playButtonTap,
  playPadTone,
} from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { PauseOverlay } from './PauseOverlay'
import { useTranslation } from '../contexts/LanguageContext'
import type {
  BaseGameScreenProps,
  ToneQuestion,
  ToneQuestionPhase,
  ToneQuestionResult,
} from '../types'

const PAD_COLORS = [
  'bg-rose-500 hover:enabled:bg-rose-400',
  'bg-sky-500 hover:enabled:bg-sky-400',
  'bg-emerald-500 hover:enabled:bg-emerald-400',
  'bg-amber-400 hover:enabled:bg-amber-300',
]
const PAD_LIT_COLORS = ['bg-rose-300', 'bg-sky-300', 'bg-emerald-300', 'bg-amber-200']

type ToneGameScreenProps = BaseGameScreenProps

export function ToneGameScreen({
  level,
  onExit,
  onSelectLevel,
}: ToneGameScreenProps) {
  const t = useTranslation()
  const [questions, setQuestions] = useState<ToneQuestion[]>(() =>
    pickToneQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<ToneQuestionPhase>('ready')
  const [tapped, setTapped] = useState<number[]>([])
  // タイムアウト時に最新の入力値を読むための参照(setStateのアップデータ内で
  // 副作用を呼ぶのを避けるため)
  const tappedRef = useRef(tapped)
  tappedRef.current = tapped
  const [currentResult, setCurrentResult] =
    useState<ToneQuestionResult | null>(null)
  const [results, setResults] = useState<ToneQuestionResult[]>([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[currentIndex]

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

  // パッドを1つずつ順番に光らせ、音を鳴らす
  const { index: trialIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: currentQuestion.sequence.length,
    shownMs: TONE_SHOWN_MS,
    gapMs: TONE_GAP_MS,
    onItemShown: (i) => {
      if (loadSettings().soundEnabled) playPadTone(currentQuestion.sequence[i])
    },
    onComplete: () => setPhase('answering'),
  })
  const litPad =
    phase === 'showing' && !isGap ? currentQuestion.sequence[trialIndex] : null

  // ④-7: 回答フェーズ限定の一時停止
  const { paused, pause, resume } = usePauseState(currentQuestion)

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら自動で採点する
  const answerRemaining = useCountdown(
    phase === 'answering',
    getAnswerTimeoutMs(currentQuestion.sequence.length),
    () => finalizeAnswer(tappedRef.current),
    paused,
  )

  function handlePadTap(pad: number) {
    if (phase !== 'answering' || paused) return
    if (loadSettings().soundEnabled) playPadTone(pad)
    setTapped((prev) => {
      if (prev.length >= currentQuestion.sequence.length) return prev
      const next = [...prev, pad]
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
    const correct = isToneAnswerCorrect(value, currentQuestion.sequence)
    recordToneAttempt(level, currentQuestion.sequence, correct)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({ question: currentQuestion, tapped: value, correct })
    setPhase('result')
  }

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'tone',
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
    setQuestions(pickToneQuestionSet(level))
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
          label: t.tone.resultLabel(r.question.sequence.length),
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
                    ? t.common.suggestionUp(t.tone.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(t.tone.levelLabel(suggestedLevel)),
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
        {phase === 'answering' && paused && <PauseOverlay onResume={resume} />}

        {phase === 'answering' && !paused && (
          <>
            <div className="flex w-full items-center justify-between">
              <span className="w-14" aria-hidden="true" />
              <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {t.tone.answerPrompt}
              </p>
              <button
                type="button"
                onClick={pause}
                className="touch-manipulation rounded-full px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {t.common.pauseButton}
              </button>
            </div>
            <p aria-hidden="true" className="text-2xl font-bold text-rose-500">
              {answerRemaining}
            </p>
          </>
        )}

        {phase !== 'result' && !(phase === 'answering' && paused) && (
          <div className="grid grid-cols-2 gap-3" style={{ width: 176 }}>
            {Array.from({ length: PAD_COUNT }, (_, pad) => {
              const isLit = litPad === pad
              const tapOrder = tapped.indexOf(pad)
              return (
                <button
                  key={pad}
                  type="button"
                  disabled={phase !== 'answering'}
                  onClick={() => handlePadTap(pad)}
                  aria-label={t.tone.padAriaLabel(t.tone.padColors[pad])}
                  className={`aspect-square touch-manipulation rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed ${
                    isLit ? PAD_LIT_COLORS[pad] : PAD_COLORS[pad]
                  }`}
                >
                  {tapOrder !== -1 && (
                    <span className="text-sm font-bold">{tapOrder + 1}</span>
                  )}
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
                {currentResult.question.sequence
                  .map((p) => t.tone.padColors[p])
                  .join(' → ')}
              </p>
              <p>
                {t.common.yourAnswerLabel}
                {currentResult.tapped.length > 0
                  ? currentResult.tapped
                      .map((p) => t.tone.padColors[p])
                      .join(' → ')
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
