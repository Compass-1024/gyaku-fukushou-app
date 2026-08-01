import { useEffect, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import {
  pickPatternQuestionSet,
  isPatternAnswerCorrect,
  PATTERN_LEVEL_LABELS,
  PATTERN_SHOWN_MS,
  PATTERN_BLANK_MS,
  READY_MS,
  getAnswerTimeoutMs,
} from '../lib/pattern'
import {
  appendHistoryEntry,
  getBestSetAccuracy,
  loadHistory,
} from '../lib/history'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { syncPushState } from '../lib/push'
import {
  playCorrectSound,
  playIncorrectSound,
  playButtonTap,
  playLevelUp,
  playAchievementUnlock,
} from '../lib/sound'
import { getNewlyUnlockedAchievements } from '../lib/achievements'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import type { Achievement } from '../lib/achievements'
import type {
  BaseGameScreenProps,
  PatternQuestion,
  PatternQuestionPhase,
  PatternQuestionResult,
} from '../types'

type PatternGameScreenProps = BaseGameScreenProps

export function PatternGameScreen({
  level,
  onExit,
  onSelectLevel,
}: PatternGameScreenProps) {
  const [questions, setQuestions] = useState<PatternQuestion[]>(() =>
    pickPatternQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<PatternQuestionPhase>('ready')
  // 0=模様を表示、1=空白（showingフェーズ内の2ステップ）
  const [step, setStep] = useState(0)
  const [currentResult, setCurrentResult] =
    useState<PatternQuestionResult | null>(null)
  const [results, setResults] = useState<PatternQuestionResult[]>([])
  const [finished, setFinished] = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  const [isNewBest, setIsNewBest] = useState(false)

  const currentQuestion = questions[currentIndex]
  const cellCount = currentQuestion.gridSize * currentQuestion.gridSize

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setStep(0)
    setCurrentResult(null)
  }, [currentQuestion])

  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentQuestion])

  // 模様を表示→空白の順に進め、空白が終わったら比較フェーズへ
  useEffect(() => {
    if (phase !== 'showing') return
    if (step >= 2) {
      setPhase('answering')
      return
    }
    const duration = step === 0 ? PATTERN_SHOWN_MS : PATTERN_BLANK_MS
    const timeout = setTimeout(() => setStep((s) => s + 1), duration)
    return () => clearTimeout(timeout)
  }, [phase, step, currentQuestion])

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら「変化なし」として自動採点する
  const answerRemaining = useCountdown(
    phase === 'answering',
    getAnswerTimeoutMs(currentQuestion.filledCells.length),
    () => finalizeAnswer(false),
  )

  // 結果表示中はEnterキーでも次の問題へ進めるようにする。finished後もこれが
  // 有効だと、SetSummary自身のEnterハンドラと二重に発火し履歴が二重記録
  // されてしまうため、finished中は無効化する
  useEnterKey(phase === 'result' && !finished, handleNext)

  function finalizeAnswer(answeredChanged: boolean) {
    const correct = isPatternAnswerCorrect(
      answeredChanged,
      currentQuestion.hasChange,
    )
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({ question: currentQuestion, answeredChanged, correct })
    setPhase('result')
  }

  function handleAnswer(answeredChanged: boolean) {
    if (phase !== 'answering') return
    if (loadSettings().soundEnabled) playButtonTap()
    finalizeAnswer(answeredChanged)
  }

  // 回答フェーズ中は物理キーボードでも操作できるようにする（Y/N、矢印キー）
  useEffect(() => {
    if (phase !== 'answering') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'y' || e.key === 'Y' || e.key === 'ArrowLeft') {
        handleAnswer(true)
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') {
        handleAnswer(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestion])

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  useEffect(() => {
    if (!finished) return
    const correctCount = results.filter((r) => r.correct).length
    const before = loadHistory()
    const previousBest = getBestSetAccuracy(before, 'pattern', level)
    appendHistoryEntry({
      mode: 'pattern',
      level,
      correct: correctCount,
      total: results.length,
    })
    syncPushState()
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
    setQuestions(pickPatternQuestionSet(level))
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
          label: r.question.hasChange ? '変化あり' : '変化なし',
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
                    ? `🎉 ${PATTERN_LEVEL_LABELS[suggestedLevel]}に挑戦する`
                    : `${PATTERN_LEVEL_LABELS[suggestedLevel]}に戻って練習する`,
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      />
    )
  }

  const displayedCells =
    phase === 'showing' && step === 0
      ? currentQuestion.filledCells
      : phase === 'answering'
        ? currentQuestion.comparisonCells
        : []

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
        {phase === 'ready' && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            よく覚えてください
          </p>
        )}
        {phase === 'showing' && step === 0 && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            よく覚えてください
          </p>
        )}
        {phase === 'showing' && step === 1 && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            &nbsp;
          </p>
        )}
        {phase === 'answering' && (
          <>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              さっきと模様は変わっていますか？
            </p>
            <p aria-hidden="true" className="text-2xl font-bold text-rose-500">
              {answerRemaining}
            </p>
          </>
        )}

        {phase !== 'result' && phase !== 'ready' && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${currentQuestion.gridSize}, minmax(0, 1fr))`,
              width: currentQuestion.gridSize * 48,
              maxWidth: '100%',
            }}
            aria-hidden="true"
          >
            {Array.from({ length: cellCount }, (_, cell) => (
              <div
                key={cell}
                className={`aspect-square rounded-lg ${
                  displayedCells.includes(cell)
                    ? 'bg-indigo-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        )}

        {phase === 'answering' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleAnswer(true)}
              className="touch-manipulation rounded-full bg-rose-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-rose-400"
            >
              変化あり
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(false)}
              className="touch-manipulation rounded-full bg-indigo-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-400"
            >
              変化なし
            </button>
          </div>
        )}

        {phase === 'result' && currentResult && (
          <>
            <ResultBadge correct={currentResult.correct} />
            <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
              <p>
                正しい答え:{' '}
                {currentResult.question.hasChange ? '変化あり' : '変化なし'}
              </p>
              <p>
                あなたの回答:{' '}
                {currentResult.answeredChanged ? '変化あり' : '変化なし'}
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
