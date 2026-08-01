import { useEffect, useState } from 'react'
import {
  pickDigitQuestionSet,
  reverseDigits,
  sumDigits,
  isDigitAnswerCorrect,
  DIGIT_LEVEL_LABELS,
  DIGIT_SHOWN_MS,
  DIGIT_GAP_MS,
  READY_MS,
  getAnswerTimeoutMs,
} from '../lib/digits'
import { appendHistoryEntry, loadHistory } from '../lib/history'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import {
  playCorrectSound,
  playIncorrectSound,
  playButtonTap,
  playLevelUp,
  playAchievementUnlock,
} from '../lib/sound'
import { getNewlyUnlockedAchievements } from '../lib/achievements'
import { NumpadInput } from './NumpadInput'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import type { Achievement } from '../lib/achievements'
import type {
  DigitGameType,
  DigitQuestion,
  DigitQuestionPhase,
  DigitQuestionResult,
  Level,
} from '../types'

function computeExpectedAnswer(
  question: DigitQuestion,
  gameType: DigitGameType,
): string {
  return gameType === 'reverse'
    ? reverseDigits(question.digits)
    : sumDigits(question.digits)
}

const GAME_TYPE_PROMPTS: Record<DigitGameType, string> = {
  reverse: '逆から入力してください',
  sum: '全部たすといくつ？',
}

interface DigitGameScreenProps {
  level: Level
  gameType: DigitGameType
  onExit: () => void
  onSelectLevel: (level: Level) => void
}

export function DigitGameScreen({
  level,
  gameType,
  onExit,
  onSelectLevel,
}: DigitGameScreenProps) {
  const [questions, setQuestions] = useState<DigitQuestion[]>(() =>
    pickDigitQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<DigitQuestionPhase>('ready')
  // 表示ステップ: 偶数=数字を表示、奇数=数字と数字の間の空白。digitPos/isGapはこの値から導出する
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const [answerRemaining, setAnswerRemaining] = useState(0)
  const [currentResult, setCurrentResult] =
    useState<DigitQuestionResult | null>(null)
  const [results, setResults] = useState<DigitQuestionResult[]>([])
  const [finished, setFinished] = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])

  const currentQuestion = questions[currentIndex]
  const maxAnswerLength =
    gameType === 'reverse'
      ? currentQuestion.digits.length
      : String(9 * currentQuestion.digits.length).length
  const digitPos = Math.floor(step / 2)
  const isGap = step % 2 === 1

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setStep(0)
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
  useEffect(() => {
    if (phase !== 'showing') return
    if (digitPos >= currentQuestion.digits.length) {
      setPhase('answering')
      return
    }
    const duration = isGap ? DIGIT_GAP_MS : DIGIT_SHOWN_MS
    const timeout = setTimeout(() => setStep((s) => s + 1), duration)
    return () => clearTimeout(timeout)
  }, [phase, step, digitPos, isGap, currentQuestion])

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら自動で採点する
  useEffect(() => {
    if (phase !== 'answering') return
    const totalMs = getAnswerTimeoutMs(currentQuestion.digits.length)
    setAnswerRemaining(Math.ceil(totalMs / 1000))
    const interval = setInterval(() => {
      setAnswerRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    const timeout = setTimeout(() => {
      setTyped((prev) => {
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

  function handleDigitPress(d: string) {
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => (prev.length >= maxAnswerLength ? prev : prev + d))
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

  // setTyped の関数形更新の中で読むことで、直前の入力を確実に拾ってから採点する
  function commitAnswer() {
    setTyped((prev) => {
      if (prev.length > 0) finalizeAnswer(prev)
      return prev
    })
  }

  function finalizeAnswer(value: string) {
    const expectedAnswer = computeExpectedAnswer(currentQuestion, gameType)
    const correct = isDigitAnswerCorrect(value, expectedAnswer)
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
  useEffect(() => {
    if (!finished) return
    const correctCount = results.filter((r) => r.correct).length
    const before = loadHistory()
    appendHistoryEntry({
      mode: 'digit',
      gameType,
      level,
      correct: correctCount,
      total: results.length,
    })
    const after = loadHistory()
    const newly = getNewlyUnlockedAchievements(before, after)
    setNewAchievements(newly)

    if (loadSettings().soundEnabled) {
      if (newly.length > 0) playAchievementUnlock()
      const accuracyPercent =
        results.length > 0
          ? Math.round((correctCount / results.length) * 100)
          : 0
      const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
      if (suggestedLevel && suggestedLevel > level) playLevelUp()
    }
  }, [finished, results, level, gameType])

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
    setQuestions(pickDigitQuestionSet(level))
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
        suggestion={
          suggestedLevel
            ? {
                label:
                  suggestedLevel > level
                    ? `🎉 ${DIGIT_LEVEL_LABELS[suggestedLevel]}に挑戦する`
                    : `${DIGIT_LEVEL_LABELS[suggestedLevel]}に戻って練習する`,
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
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              よく覚えてください
            </p>
            <p
              aria-hidden="true"
              className="text-7xl font-bold tabular-nums text-indigo-500"
            >
              {phase === 'ready' || isGap ? ' ' : currentQuestion.digits[digitPos]}
            </p>
          </>
        )}

        {phase === 'answering' && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              {GAME_TYPE_PROMPTS[gameType]}
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
              <p>出題: {currentResult.question.digits.join('')}</p>
              <p>正しい答え: {currentResult.expectedAnswer}</p>
              <p>あなたの回答: {currentResult.typed || '（未入力）'}</p>
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
