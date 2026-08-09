import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { usePauseState } from '../hooks/usePauseState'
import {
  pickPatternQuestionSet,
  isPatternSelectionCorrect,
  recordPatternAttempt,
  PATTERN_SHOWN_MS,
  PATTERN_BLANK_MS,
  READY_MS,
  getAnswerTimeoutMs,
} from '../lib/pattern'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { PausableAnswering } from './PausableAnswering'
import { useTranslation } from '../contexts/LanguageContext'
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
  const t = useTranslation()
  const [questions, setQuestions] = useState<PatternQuestion[]>(() =>
    pickPatternQuestionSet(level),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<PatternQuestionPhase>('ready')
  // 0=模様を表示、1=空白（showingフェーズ内の2ステップ）
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  // タイムアウト時に最新の選択値を読むための参照(setStateのアップデータ内で
  // 副作用を呼ぶのを避けるため)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const [currentResult, setCurrentResult] =
    useState<PatternQuestionResult | null>(null)
  const [results, setResults] = useState<PatternQuestionResult[]>([])
  const [finished, setFinished] = useState(false)

  const currentQuestion = questions[currentIndex]
  const cellCount = currentQuestion.gridSize * currentQuestion.gridSize

  // 出題が変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setStep(0)
    setSelected([])
    setCurrentResult(null)
  }, [currentQuestion])

  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentQuestion])

  // 模様を表示→空白の順に進め、空白が終わったら回答フェーズへ
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

  // ④-7: 回答フェーズ限定の一時停止
  const { paused, pause, resume } = usePauseState(currentQuestion)

  // 回答フェーズ: 残り時間をカウントダウンし、時間切れなら現在の選択で自動採点する
  const answerRemaining = useCountdown(
    phase === 'answering',
    getAnswerTimeoutMs(currentQuestion.filledCells.length),
    () => finalizeAnswer(selectedRef.current),
    paused,
  )

  // 結果表示中はEnterキーでも次の問題へ進めるようにする。finished後もこれが
  // 有効だと、SetSummary自身のEnterハンドラと二重に発火し履歴が二重記録
  // されてしまうため、finished中は無効化する
  useEnterKey(phase === 'result' && !finished, handleNext)

  function toggleCell(cell: number) {
    if (phase !== 'answering' || paused) return
    if (loadSettings().soundEnabled) playButtonTap()
    setSelected((prev) =>
      prev.includes(cell) ? prev.filter((c) => c !== cell) : [...prev, cell],
    )
  }

  function finalizeAnswer(value: number[]) {
    const correct = isPatternSelectionCorrect(value, currentQuestion.filledCells)
    recordPatternAttempt(
      level,
      currentQuestion.filledCells,
      currentQuestion.gridSize,
      correct,
    )
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({ question: currentQuestion, selectedCells: value, correct })
    setPhase('result')
  }

  function handleSubmit() {
    if (phase !== 'answering' || paused) return
    if (loadSettings().soundEnabled) playButtonTap()
    finalizeAnswer(selected)
  }

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'pattern',
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
          label: t.pattern.levelLabel(level),
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
                    ? t.common.suggestionUp(t.pattern.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(
                        t.pattern.levelLabel(suggestedLevel),
                      ),
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      />
    )
  }

  // showing(表示中)のみ元の塗りつぶしマスを見せる。答え合わせ前(answering)は全マス白
  const shownCells = phase === 'showing' && step === 0 ? currentQuestion.filledCells : []

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
        {(phase === 'ready' || (phase === 'showing' && step === 0)) && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            {t.common.rememberPrompt}
          </p>
        )}
        {phase === 'showing' && step === 1 && (
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            &nbsp;
          </p>
        )}
        {phase === 'answering' && (
          <PausableAnswering
            paused={paused}
            onPause={pause}
            onResume={resume}
            prompt={t.pattern.selectPrompt}
            remainingSeconds={answerRemaining}
          />
        )}

        {phase !== 'result' && !(phase === 'answering' && paused) && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${currentQuestion.gridSize}, minmax(0, 1fr))`,
              width: currentQuestion.gridSize * 48,
              maxWidth: '100%',
            }}
          >
            {Array.from({ length: cellCount }, (_, cell) => {
              const isShown = shownCells.includes(cell)
              const isSelected = selected.includes(cell)
              return (
                <button
                  key={cell}
                  type="button"
                  disabled={phase !== 'answering'}
                  onClick={() => toggleCell(cell)}
                  aria-pressed={phase === 'answering' ? isSelected : undefined}
                  aria-label={t.pattern.cellAriaLabel(cell + 1, isSelected)}
                  className={`aspect-square touch-manipulation rounded-lg transition disabled:cursor-not-allowed ${
                    isShown || isSelected
                      ? 'bg-indigo-500'
                      : 'bg-gray-100 hover:enabled:bg-gray-200 dark:bg-gray-700 dark:hover:enabled:bg-gray-600'
                  }`}
                />
              )
            })}
          </div>
        )}

        {phase === 'answering' && !paused && (
          <button
            type="button"
            onClick={handleSubmit}
            className="touch-manipulation rounded-full bg-indigo-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-400"
          >
            {t.pattern.submitButton}
          </button>
        )}

        {phase === 'result' && currentResult && (
          <>
            <ResultBadge correct={currentResult.correct} />
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${currentQuestion.gridSize}, minmax(0, 1fr))`,
                width: currentQuestion.gridSize * 48,
                maxWidth: '100%',
              }}
              aria-hidden="true"
            >
              {Array.from({ length: cellCount }, (_, cell) => {
                const wasFilled = currentQuestion.filledCells.includes(cell)
                const wasSelected = currentResult.selectedCells.includes(cell)
                let colorClass = 'bg-gray-100 dark:bg-gray-700'
                if (wasFilled && wasSelected) colorClass = 'bg-emerald-500'
                else if (wasSelected && !wasFilled) colorClass = 'bg-rose-500'
                else if (wasFilled && !wasSelected) colorClass = 'bg-amber-400'
                return (
                  <div key={cell} className={`aspect-square rounded-lg ${colorClass}`} />
                )
              })}
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
