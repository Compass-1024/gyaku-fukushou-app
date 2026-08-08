import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { usePauseState } from '../hooks/usePauseState'
import { buildRandomRounds } from '../lib/random'
import { loadHistory } from '../lib/history'
import {
  reverseDigits,
  sumDigits,
  isDigitAnswerCorrect,
  DIGIT_SHOWN_MS,
  DIGIT_GAP_MS,
  READY_MS,
  getAnswerTimeoutMs as getDigitAnswerTimeoutMs,
} from '../lib/digits'
import {
  reverseSequence,
  isSpatialAnswerCorrect,
  SPATIAL_SHOWN_MS,
  SPATIAL_GAP_MS,
  getAnswerTimeoutMs as getSpatialAnswerTimeoutMs,
} from '../lib/spatial'
import {
  isPatternSelectionCorrect,
  PATTERN_SHOWN_MS,
  PATTERN_BLANK_MS,
  getAnswerTimeoutMs as getPatternAnswerTimeoutMs,
} from '../lib/pattern'
import {
  isToneAnswerCorrect,
  TONE_SHOWN_MS,
  TONE_GAP_MS,
  getAnswerTimeoutMs as getToneAnswerTimeoutMs,
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
import { NumpadInput } from './NumpadInput'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { PauseOverlay } from './PauseOverlay'
import { useTranslation } from '../contexts/LanguageContext'
import type { Translations } from '../lib/i18n'
import type {
  BaseGameScreenProps,
  Level,
  RandomQuestionPhase,
  RandomRound,
} from '../types'

type RandomGameScreenProps = BaseGameScreenProps & {
  // ④-2: レベル選択画面の「弱点重視」トグルがオンの場合、各ラウンドの
  // レベルを選択レベル固定ではなくモードごとの弱点レベルに差し替える
  weakPointFocus?: boolean
}

function buildRounds(level: Level, weakPointFocus?: boolean) {
  return buildRandomRounds(
    level,
    weakPointFocus ? { history: loadHistory() } : undefined,
  )
}

interface RoundOutcome {
  round: RandomRound
  correct: boolean
}

function getStepConfig(round: RandomRound) {
  switch (round.mode) {
    case 'digit':
      return { itemCount: round.question.digits.length, shownMs: DIGIT_SHOWN_MS, gapMs: DIGIT_GAP_MS }
    case 'spatial':
      return {
        itemCount: round.question.sequence.length,
        shownMs: SPATIAL_SHOWN_MS,
        gapMs: SPATIAL_GAP_MS,
      }
    case 'pattern':
      return { itemCount: 1, shownMs: PATTERN_SHOWN_MS, gapMs: PATTERN_BLANK_MS }
    case 'tone':
      return { itemCount: round.question.sequence.length, shownMs: TONE_SHOWN_MS, gapMs: TONE_GAP_MS }
  }
}

function getRoundAnswerTimeoutMs(round: RandomRound): number {
  switch (round.mode) {
    case 'digit':
      return getDigitAnswerTimeoutMs(round.question.digits.length)
    case 'spatial':
      return getSpatialAnswerTimeoutMs(round.question.sequence.length)
    case 'pattern':
      return getPatternAnswerTimeoutMs(round.question.filledCells.length)
    case 'tone':
      return getToneAnswerTimeoutMs(round.question.sequence.length)
  }
}

function roundAreaLabel(t: Translations, round: RandomRound): string {
  const key = round.mode === 'digit' ? `digit-${round.gameType}` : round.mode
  return t.common.areaLabels[key as keyof typeof t.common.areaLabels]
}

// 回答フェーズの指示文。単体モード画面（DigitGameScreen等）と同じ文言を
// ラウンド種別ごとに出し分ける（従来ランダムモードでは指示文が一切表示
// されておらず、単体モード画面と挙動が異なっていたため揃える）
function roundAnswerPrompt(t: Translations, round: RandomRound): string {
  switch (round.mode) {
    case 'digit':
      return t.digit.answerPrompt[round.gameType]
    case 'spatial':
      return t.spatial.answerPrompt
    case 'pattern':
      return t.pattern.selectPrompt
    case 'tone':
      return t.tone.answerPrompt
  }
}

export function RandomGameScreen({
  level,
  onExit,
  onSelectLevel,
  weakPointFocus,
}: RandomGameScreenProps) {
  const t = useTranslation()
  const [rounds, setRounds] = useState<RandomRound[]>(() =>
    buildRounds(level, weakPointFocus),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<RandomQuestionPhase>('ready')
  const [typed, setTyped] = useState('')
  const typedRef = useRef(typed)
  typedRef.current = typed
  const [arrayValue, setArrayValue] = useState<number[]>([])
  const arrayValueRef = useRef(arrayValue)
  arrayValueRef.current = arrayValue
  const [currentOutcome, setCurrentOutcome] = useState<RoundOutcome | null>(null)
  const [results, setResults] = useState<RoundOutcome[]>([])
  const [finished, setFinished] = useState(false)

  const currentRound = rounds[currentIndex]

  // ラウンドが変わるたびに状態をリセットする
  useEffect(() => {
    setPhase('ready')
    setTyped('')
    setArrayValue([])
    setCurrentOutcome(null)
  }, [currentRound])

  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase, currentRound])

  const stepConfig = getStepConfig(currentRound)
  const { index: stepIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: stepConfig.itemCount,
    shownMs: stepConfig.shownMs,
    gapMs: stepConfig.gapMs,
    onItemShown: (i) => {
      if (currentRound.mode === 'tone' && loadSettings().soundEnabled) {
        playPadTone(currentRound.question.sequence[i])
      }
    },
    onComplete: () => setPhase('answering'),
  })

  // ④-7: 回答フェーズ限定の一時停止
  const { paused, pause, resume } = usePauseState(currentRound)

  const answerRemaining = useCountdown(
    phase === 'answering',
    getRoundAnswerTimeoutMs(currentRound),
    () => finalizeAnswer(),
    paused,
  )

  function finalizeAnswer() {
    const round = currentRound
    let correct = false
    switch (round.mode) {
      case 'digit':
        correct = isDigitAnswerCorrect(
          typedRef.current,
          round.gameType === 'reverse'
            ? reverseDigits(round.question.digits)
            : sumDigits(round.question.digits),
        )
        break
      case 'spatial':
        correct = isSpatialAnswerCorrect(
          arrayValueRef.current,
          reverseSequence(round.question.sequence),
        )
        break
      case 'pattern':
        correct = isPatternSelectionCorrect(arrayValueRef.current, round.question.filledCells)
        break
      case 'tone':
        correct = isToneAnswerCorrect(arrayValueRef.current, round.question.sequence)
        break
    }
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentOutcome({ round, correct })
    setPhase('result')
  }

  function handleDigitPress(d: string) {
    if (phase !== 'answering' || paused) return
    if (currentRound.mode !== 'digit') return
    if (loadSettings().soundEnabled) playButtonTap()
    const maxLength = currentRound.question.digits.length
    setTyped((prev) => {
      if (prev.length >= maxLength) return prev
      const next = prev + d
      if (next.length === maxLength) finalizeAnswer()
      return next
    })
  }

  function handleBackspacePress() {
    if (paused) return
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => prev.slice(0, -1))
  }

  function commitTypedAnswer() {
    if (paused) return
    setTyped((prev) => {
      if (prev.length > 0) finalizeAnswer()
      return prev
    })
  }

  // 空間・音/色ラウンド: 順番にタップし、期待される長さに達したら自動採点する
  function handleOrderedTap(cell: number) {
    if (phase !== 'answering' || paused) return
    if (currentRound.mode !== 'spatial' && currentRound.mode !== 'tone') return
    if (loadSettings().soundEnabled) {
      if (currentRound.mode === 'tone') playPadTone(cell)
      else playButtonTap()
    }
    const expectedLength = currentRound.question.sequence.length
    setArrayValue((prev) => {
      if (prev.length >= expectedLength) return prev
      if (currentRound.mode === 'spatial' && prev.includes(cell)) return prev
      const next = [...prev, cell]
      if (next.length === expectedLength) finalizeAnswer()
      return next
    })
  }

  // 変化検出ラウンド: トグル選択し、「回答する」ボタンで明示的に確定する
  function handlePatternToggle(cell: number) {
    if (phase !== 'answering' || paused || currentRound.mode !== 'pattern') return
    if (loadSettings().soundEnabled) playButtonTap()
    setArrayValue((prev) =>
      prev.includes(cell) ? prev.filter((c) => c !== cell) : [...prev, cell],
    )
  }

  function handlePatternSubmit() {
    if (phase !== 'answering' || paused || currentRound.mode !== 'pattern') return
    if (loadSettings().soundEnabled) playButtonTap()
    finalizeAnswer()
  }

  useEnterKey(phase === 'result' && !finished, handleNext)

  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'random',
    level,
    correctCount: results.filter((r) => r.correct).length,
    total: results.length,
  })

  function handleNext() {
    if (!currentOutcome) return
    if (loadSettings().soundEnabled) playButtonTap()
    const updated = [...results, currentOutcome]
    setResults(updated)
    if (currentIndex + 1 >= rounds.length) {
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleRetry() {
    setRounds(buildRounds(level, weakPointFocus))
    setCurrentIndex(0)
    setResults([])
    setCurrentOutcome(null)
    setFinished(false)
  }

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length
    const accuracyPercent =
      results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
    const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
    return (
      <SetSummary
        items={results.map((r, i) => ({
          key: `${i}`,
          label: roundAreaLabel(t, r.round),
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
                    ? t.common.suggestionUp(t.random.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(t.random.levelLabel(suggestedLevel)),
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
            results.length > 0 || currentOutcome !== null,
            onExit,
            t.common.confirmExitMessage,
          )
        }
        currentIndex={currentIndex}
        total={rounds.length}
      />

      <p className="text-center text-xs font-semibold text-indigo-500 dark:text-indigo-300">
        {roundAreaLabel(t, currentRound)}
      </p>

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

        {(phase === 'ready' || phase === 'showing') && currentRound.mode === 'digit' && (
          <p aria-hidden="true" className="text-7xl font-bold tabular-nums text-indigo-500">
            {phase === 'ready' || isGap ? ' ' : currentRound.question.digits[stepIndex]}
          </p>
        )}

        {phase !== 'result' && currentRound.mode === 'spatial' && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${currentRound.question.gridSize}, minmax(0, 1fr))`,
              width: currentRound.question.gridSize * 48,
              maxWidth: '100%',
            }}
          >
            {Array.from(
              { length: currentRound.question.gridSize * currentRound.question.gridSize },
              (_, cell) => {
                const isLit =
                  phase === 'showing' &&
                  !isGap &&
                  currentRound.question.sequence[stepIndex] === cell
                const tapOrder = arrayValue.indexOf(cell)
                const isTapped = tapOrder !== -1
                return (
                  <button
                    key={cell}
                    type="button"
                    disabled={phase !== 'answering' || paused}
                    onClick={() => handleOrderedTap(cell)}
                    className={`aspect-square touch-manipulation rounded-lg text-sm font-bold transition disabled:cursor-not-allowed ${
                      isLit
                        ? 'bg-indigo-500 text-white'
                        : isTapped
                          ? 'bg-emerald-400 text-white'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}
                  >
                    {isTapped ? tapOrder + 1 : ''}
                  </button>
                )
              },
            )}
          </div>
        )}

        {phase !== 'result' && currentRound.mode === 'pattern' && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${currentRound.question.gridSize}, minmax(0, 1fr))`,
              width: currentRound.question.gridSize * 48,
              maxWidth: '100%',
            }}
          >
            {Array.from(
              { length: currentRound.question.gridSize * currentRound.question.gridSize },
              (_, cell) => {
                const isShown =
                  phase === 'showing' &&
                  !isGap &&
                  currentRound.question.filledCells.includes(cell)
                const isSelected = arrayValue.includes(cell)
                return (
                  <button
                    key={cell}
                    type="button"
                    disabled={phase !== 'answering' || paused}
                    onClick={() => handlePatternToggle(cell)}
                    className={`aspect-square touch-manipulation rounded-lg transition disabled:cursor-not-allowed ${
                      isShown || isSelected
                        ? 'bg-indigo-500'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  />
                )
              },
            )}
          </div>
        )}

        {phase !== 'result' && currentRound.mode === 'tone' && (
          <div className="grid grid-cols-2 gap-3" style={{ width: 176 }}>
            {Array.from({ length: PAD_COUNT }, (_, pad) => {
              const isLit =
                phase === 'showing' &&
                !isGap &&
                currentRound.question.sequence[stepIndex] === pad
              const tapOrder = arrayValue.indexOf(pad)
              return (
                <button
                  key={pad}
                  type="button"
                  disabled={phase !== 'answering' || paused}
                  onClick={() => handleOrderedTap(pad)}
                  aria-label={t.tone.padAriaLabel(t.tone.padColors[pad])}
                  className={`aspect-square touch-manipulation rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed ${
                    isLit ? 'bg-indigo-300' : 'bg-indigo-500'
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

        {phase === 'answering' && paused && <PauseOverlay onResume={resume} />}

        {phase === 'answering' && !paused && (
          <>
            <div className="flex w-full items-center justify-between">
              <span className="w-14" aria-hidden="true" />
              <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
                {roundAnswerPrompt(t, currentRound)}
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
            {currentRound.mode === 'digit' && (
              <NumpadInput
                value={typed}
                maxLength={currentRound.question.digits.length}
                onDigit={handleDigitPress}
                onBackspace={handleBackspacePress}
                onSubmit={commitTypedAnswer}
              />
            )}
            {currentRound.mode === 'pattern' && (
              <button
                type="button"
                onClick={handlePatternSubmit}
                className="touch-manipulation rounded-full bg-indigo-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-400"
              >
                {t.pattern.submitButton}
              </button>
            )}
          </>
        )}

        {phase === 'result' && currentOutcome && (
          <>
            <ResultBadge correct={currentOutcome.correct} />
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
            >
              {currentIndex + 1 >= rounds.length ? t.common.seeResults : t.common.next}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
