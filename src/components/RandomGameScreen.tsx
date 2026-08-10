import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { usePauseState } from '../hooks/usePauseState'
import { buildRandomRounds, DEFAULT_ROUND_COUNT } from '../lib/random'
import type { RoundCount } from '../lib/random'
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
import { playCorrectHaptic, playIncorrectHaptic } from '../lib/haptics'
import { NumpadInput } from './NumpadInput'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import { PausableAnswering } from './PausableAnswering'
import { RandomSpatialGrid } from './RandomSpatialGrid'
import { RandomPatternGrid } from './RandomPatternGrid'
import { RandomToneGrid } from './RandomToneGrid'
import { RandomResultDetail } from './RandomResultDetail'
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
  roundCount?: RoundCount
}

function buildRounds(level: Level, weakPointFocus?: boolean, roundCount?: RoundCount) {
  return buildRandomRounds(
    level,
    roundCount ?? DEFAULT_ROUND_COUNT,
    weakPointFocus ? { history: loadHistory() } : undefined,
  )
}

interface RoundOutcome {
  round: RandomRound
  correct: boolean
  // バグ修正: 結果フェーズで単体モード画面と同じ詳細（正しい答え・自分の回答）
  // を表示するため、回答内容もラウンドと一緒に保持する
  typed: string
  tapped: number[]
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

// バグ修正: 単体のすうじモード画面(DigitGameScreen)では「合計を入力」の
// 最大文字数は桁数そのものではなく取りうる最大の合計値の桁数
// （例: 7桁なら最大63、2桁）で計算しているが、ランダムモードは常に
// 出題の桁数をそのまま最大文字数に使っていたため、合計ラウンドで
// 本来より長く入力できてしまい、かつ自動採点も本来発生しない桁数
// （出題の桁数に達した時点）で誤って発生していた
function getDigitMaxAnswerLength(round: Extract<RandomRound, { mode: 'digit' }>): number {
  return round.gameType === 'reverse'
    ? round.question.digits.length
    : String(9 * round.question.digits.length).length
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
  roundCount,
}: RandomGameScreenProps) {
  const t = useTranslation()
  const [rounds, setRounds] = useState<RandomRound[]>(() =>
    buildRounds(level, weakPointFocus, roundCount),
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
    if (loadSettings().hapticsEnabled) {
      if (correct) playCorrectHaptic()
      else playIncorrectHaptic()
    }
    setCurrentOutcome({
      round,
      correct,
      typed: typedRef.current,
      tapped: arrayValueRef.current,
    })
    setPhase('result')
  }

  function handleDigitPress(d: string) {
    if (phase !== 'answering' || paused) return
    if (currentRound.mode !== 'digit') return
    if (loadSettings().soundEnabled) playButtonTap()
    const round = currentRound
    const maxLength = getDigitMaxAnswerLength(round)
    setTyped((prev) => {
      if (prev.length >= maxLength) return prev
      const next = prev + d
      // 「逆から」ラウンドのみ、正解の桁数が既知のため入力が揃った時点で
      // 自動採点する（単体のDigitGameScreenと同じ挙動。「合計」ラウンドは
      // 答えの桁数が定まらないため常に決定ボタンでの確定が必要）
      if (round.gameType === 'reverse' && next.length === maxLength) {
        finalizeAnswer()
      }
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

  const { newAchievements, isNewBest, isNewTodayBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
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
    setRounds(buildRounds(level, weakPointFocus, roundCount))
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
        isNewTodayBest={isNewTodayBest}
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
          <RandomSpatialGrid
            round={currentRound}
            phase={phase}
            isGap={isGap}
            stepIndex={stepIndex}
            arrayValue={arrayValue}
            paused={paused}
            onTap={handleOrderedTap}
          />
        )}

        {phase !== 'result' && currentRound.mode === 'pattern' && (
          <RandomPatternGrid
            round={currentRound}
            phase={phase}
            isGap={isGap}
            arrayValue={arrayValue}
            paused={paused}
            onToggle={handlePatternToggle}
          />
        )}

        {phase !== 'result' && currentRound.mode === 'tone' && (
          <RandomToneGrid
            round={currentRound}
            phase={phase}
            isGap={isGap}
            stepIndex={stepIndex}
            arrayValue={arrayValue}
            paused={paused}
            onTap={handleOrderedTap}
          />
        )}

        {phase === 'answering' && (
          <PausableAnswering
            paused={paused}
            onPause={pause}
            onResume={resume}
            prompt={roundAnswerPrompt(t, currentRound)}
            remainingSeconds={answerRemaining}
          >
            {currentRound.mode === 'digit' && (
              <NumpadInput
                value={typed}
                maxLength={getDigitMaxAnswerLength(currentRound)}
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
          </PausableAnswering>
        )}

        {phase === 'result' && currentOutcome && (
          <>
            <ResultBadge correct={currentOutcome.correct} />
            <RandomResultDetail
              round={currentOutcome.round}
              typed={currentOutcome.typed}
              tapped={currentOutcome.tapped}
            />
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
