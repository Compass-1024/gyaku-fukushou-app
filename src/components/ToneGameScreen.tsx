import { useEffect, useState } from 'react'
import {
  pickToneQuestionSet,
  isToneAnswerCorrect,
  TONE_LEVEL_LABELS,
  TONE_SHOWN_MS,
  TONE_GAP_MS,
  READY_MS,
  getAnswerTimeoutMs,
  PAD_COUNT,
  PAD_LABELS,
} from '../lib/tone'
import {
  appendHistoryEntry,
  getBestSetAccuracy,
  loadHistory,
} from '../lib/history'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import {
  playCorrectSound,
  playIncorrectSound,
  playButtonTap,
  playPadTone,
  playLevelUp,
  playAchievementUnlock,
} from '../lib/sound'
import { getNewlyUnlockedAchievements } from '../lib/achievements'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import type { Achievement } from '../lib/achievements'
import type {
  Level,
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

interface ToneGameScreenProps {
  level: Level
  onExit: () => void
  onSelectLevel: (level: Level) => void
}

export function ToneGameScreen({
  level,
  onExit,
  onSelectLevel,
}: ToneGameScreenProps) {
  const [questions, setQuestions] = useState<ToneQuestion[]>(() =>
    pickToneQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<ToneQuestionPhase>('ready')
  const [step, setStep] = useState(0)
  const [tapped, setTapped] = useState<number[]>([])
  const [answerRemaining, setAnswerRemaining] = useState(0)
  const [currentResult, setCurrentResult] =
    useState<ToneQuestionResult | null>(null)
  const [results, setResults] = useState<ToneQuestionResult[]>([])
  const [finished, setFinished] = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [isNewBest, setIsNewBest] = useState(false)

  const currentQuestion = questions[currentIndex]
  const trialIndex = Math.floor(step / 2)
  const isGap = step % 2 === 1
  const litPad =
    phase === 'showing' && !isGap ? currentQuestion.sequence[trialIndex] : null

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setStep(0)
    setTapped([])
    setCurrentResult(null)
  }, [currentQuestion])

  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentQuestion])

  // パッドを1つずつ順番に光らせ、音を鳴らす
  useEffect(() => {
    if (phase !== 'showing') return
    if (trialIndex >= currentQuestion.sequence.length) {
      setPhase('answering')
      return
    }
    if (!isGap && loadSettings().soundEnabled) {
      playPadTone(currentQuestion.sequence[trialIndex])
    }
    const duration = isGap ? TONE_GAP_MS : TONE_SHOWN_MS
    const timeout = setTimeout(() => setStep((s) => s + 1), duration)
    return () => clearTimeout(timeout)
  }, [phase, step, trialIndex, isGap, currentQuestion])

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら自動で採点する
  useEffect(() => {
    if (phase !== 'answering') return
    const totalMs = getAnswerTimeoutMs(currentQuestion.sequence.length)
    setAnswerRemaining(Math.ceil(totalMs / 1000))
    const interval = setInterval(() => {
      setAnswerRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    const timeout = setTimeout(() => {
      setTapped((prev) => {
        finalizeAnswer(prev)
        return prev
      })
    }, totalMs)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestion])

  function handlePadTap(pad: number) {
    if (phase !== 'answering') return
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

  // 結果表示中はEnterキーでも次の問題へ進めるようにする
  useEffect(() => {
    if (phase !== 'result') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentResult])

  function finalizeAnswer(value: number[]) {
    const correct = isToneAnswerCorrect(value, currentQuestion.sequence)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({ question: currentQuestion, tapped: value, correct })
    setPhase('result')
  }

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  useEffect(() => {
    if (!finished) return
    const correctCount = results.filter((r) => r.correct).length
    const before = loadHistory()
    const previousBest = getBestSetAccuracy(before, 'tone', level)
    appendHistoryEntry({
      mode: 'tone',
      level,
      correct: correctCount,
      total: results.length,
    })
    const after = loadHistory()
    const newly = getNewlyUnlockedAchievements(before, after)
    setNewAchievements(newly)

    const accuracyPercent =
      results.length > 0
        ? Math.round((correctCount / results.length) * 100)
        : 0
    setIsNewBest(previousBest !== null && accuracyPercent > previousBest)

    if (loadSettings().soundEnabled) {
      if (newly.length > 0) playAchievementUnlock()
      const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
      if (suggestedLevel && suggestedLevel > level) playLevelUp()
    }
  }, [finished, results, level])

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
          label: `${r.question.sequence.length}音`,
          correct: r.correct,
        }))}
        onRetry={handleRetry}
        onChangeLevel={onExit}
        newAchievements={newAchievements}
        isNewBest={isNewBest}
        suggestion={
          suggestedLevel
            ? {
                label:
                  suggestedLevel > level
                    ? `🎉 ${TONE_LEVEL_LABELS[suggestedLevel]}に挑戦する`
                    : `${TONE_LEVEL_LABELS[suggestedLevel]}に戻って練習する`,
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
        backLabel="← レベル選択"
        onBack={() =>
          confirmExit(results.length > 0 || currentResult !== null, onExit)
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
            よく覚えてください
          </p>
        )}
        {phase === 'answering' && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              同じ順番でパッドをタップしてください
            </p>
            <p aria-hidden="true" className="text-2xl font-bold text-rose-500">
              {answerRemaining}
            </p>
          </>
        )}

        {phase !== 'result' && (
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
                  aria-label={`${PAD_LABELS[pad]}のパッド`}
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
                正しい順番:{' '}
                {currentResult.question.sequence
                  .map((p) => PAD_LABELS[p])
                  .join(' → ')}
              </p>
              <p>
                あなたの回答:{' '}
                {currentResult.tapped.length > 0
                  ? currentResult.tapped.map((p) => PAD_LABELS[p]).join(' → ')
                  : '（未回答）'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
            >
              {currentIndex + 1 >= questions.length ? '結果を見る' : '次へ'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
