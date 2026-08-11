import { useEffect, useRef, useState } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useCountdown } from '../hooks/useCountdown'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { usePauseState } from '../hooks/usePauseState'
import { buildRandomRounds, DEFAULT_ROUND_COUNT } from '../lib/random'
import type { RoundCount, RandomRoundExcludeSets, RandomRoundType } from '../lib/random'
import { loadHistory } from '../lib/history'
import { saveRecentQuestions, consumeRecentQuestions } from '../lib/recentQuestions'
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
import { saveGameSession, loadGameSession, clearGameSession } from '../lib/gameSessionPersistence'
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
import { RandomWordRound } from './RandomWordRound'
import { RandomOpsSpanRound } from './RandomOpsSpanRound'
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
  // 出題するモードの選択（未指定時は全種類が対象になる）
  enabledTypes?: RandomRoundType[]
}

function buildRounds(
  level: Level,
  weakPointFocus?: boolean,
  roundCount?: RoundCount,
  exclude?: RandomRoundExcludeSets,
  enabledTypes?: RandomRoundType[],
) {
  return buildRandomRounds(
    level,
    roundCount ?? DEFAULT_ROUND_COUNT,
    weakPointFocus ? { history: loadHistory() } : undefined,
    exclude,
    enabledTypes,
  )
}

// 問題id（`${level}-${Date.now()}-${idSuffix}`形式）からlevelを取り出す。
// 弱点重視モードでは各ラウンドのレベルが選択レベルと異なりうるため、
// 除外対象を正しいレベルのキーに保存するのに使う
function levelFromQuestionId(id: string): Level {
  const raw = Number(id.split('-')[0])
  return raw === 1 || raw === 2 || raw === 3 ? raw : 1
}

// 直前に中断したセットで実際に表示済みだったラウンドを、モード×レベル単位で
// まとめてsessionStorageに保存する。単体モード画面（DigitGameScreen等）と
// 同じキー（`<mode>:<level>`）を使うため、次回の出題生成は単体モード・
// ランダムモードのどちらから見ても直前に表示済みだった問題を除外できる
function saveShownRoundsForExclusion(rounds: RandomRound[]): void {
  const grouped = new Map<string, number[][]>()
  const add = (mode: string, id: string, shape: number[]) => {
    const key = `${mode}:${levelFromQuestionId(id)}`
    const list = grouped.get(key) ?? []
    list.push(shape)
    grouped.set(key, list)
  }
  const wordIds = new Map<string, string[]>()
  for (const round of rounds) {
    switch (round.mode) {
      case 'digit':
        add('digit', round.question.id, round.question.digits)
        break
      case 'spatial':
        add('spatial', round.question.id, round.question.sequence)
        break
      case 'pattern':
        add('pattern', round.question.id, round.question.filledCells)
        break
      case 'tone':
        add('tone', round.question.id, round.question.sequence)
        break
      case 'ops-span':
        add(
          'ops-span',
          round.question.id,
          round.question.trials.map((t) => t.memoryDigit),
        )
        break
      case 'word': {
        // フレーズのidは`${level}-${index}`形式（levelFromQuestionIdと同じ
        // 先頭セグメント）のため、数字列モードと同じキー構成で扱える
        const key = `word:${levelFromQuestionId(round.question.id)}`
        const list = wordIds.get(key) ?? []
        list.push(round.question.id)
        wordIds.set(key, list)
        break
      }
    }
  }
  for (const [key, items] of grouped) saveRecentQuestions(key, items)
  for (const [key, items] of wordIds) saveRecentQuestions(key, items)
}

// 新しいセットを組み立てる前に、モードごと（レベル問わず、弱点重視モードで
// どのレベルが選ばれても除外が効くよう全レベル分）の除外対象を読み出して消費する
function consumeRandomExcludeSets(): RandomRoundExcludeSets {
  const merge = (mode: string): number[][] =>
    ([1, 2, 3] as const).flatMap((lvl) => consumeRecentQuestions<number[]>(`${mode}:${lvl}`))
  const mergeWord = (): string[] =>
    ([1, 2, 3] as const).flatMap((lvl) => consumeRecentQuestions<string>(`word:${lvl}`))
  return {
    digit: merge('digit'),
    spatial: merge('spatial'),
    pattern: merge('pattern'),
    tone: merge('tone'),
    opsSpan: merge('ops-span'),
    word: mergeWord(),
  }
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
    // ops-span/wordは自己完結した専用コンポーネント(RandomOpsSpanRound/
    // RandomWordRound)が独自にタイミングを管理するため、共通のuseStepReveal
    // 経路は使わない（isIsolatedRoundでactive=falseにして無効化している）
    case 'ops-span':
    case 'word':
      return { itemCount: 0, shownMs: 0, gapMs: 0 }
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
    // ops-span/wordは自己完結したコンポーネントが独自にタイムアウトを
    // 管理するため未使用（isIsolatedRoundでactive=falseにしている）
    case 'ops-span':
    case 'word':
      return 0
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
    case 'ops-span':
      return t.opsSpan.answerPrompt
    case 'word':
      return ''
  }
}

export function RandomGameScreen({
  level,
  onExit,
  onSelectLevel,
  weakPointFocus,
  roundCount,
  enabledTypes,
}: RandomGameScreenProps) {
  const t = useTranslation()
  // Android実装を見据え、モバイルOSがバックグラウンドでプロセスを再生成した
  // 場合に回答中のセットが失われないよう、sessionStorageから復元を試みる
  const sessionKey = `game-session:random:${level}:${weakPointFocus}:${roundCount ?? DEFAULT_ROUND_COUNT}:${(enabledTypes ?? []).join(',')}`
  const [restoredSession] = useState(() =>
    loadGameSession<RandomRound, RoundOutcome>(sessionKey),
  )
  // 直前に中断したセットで表示済みだったラウンドを、再挑戦時の出題候補から
  // 除外する（モードを途中でやめて再びトライすると、やめる前と異なる問題に
  // なるようにする）。sessionStorageから復元する場合（reload後の再開）は
  // 同じ試行の続きなので除外しない
  const [rounds, setRounds] = useState<RandomRound[]>(() => {
    if (restoredSession?.questions) return restoredSession.questions
    return buildRounds(level, weakPointFocus, roundCount, consumeRandomExcludeSets(), enabledTypes)
  })
  const [currentIndex, setCurrentIndex] = useState(() => restoredSession?.currentIndex ?? 0)
  const [phase, setPhase] = useState<RandomQuestionPhase>('ready')
  const [typed, setTyped] = useState('')
  const typedRef = useRef(typed)
  typedRef.current = typed
  const [arrayValue, setArrayValue] = useState<number[]>([])
  const arrayValueRef = useRef(arrayValue)
  arrayValueRef.current = arrayValue
  const [currentOutcome, setCurrentOutcome] = useState<RoundOutcome | null>(null)
  const [results, setResults] = useState<RoundOutcome[]>(
    () => restoredSession?.results ?? [],
  )
  const [finished, setFinished] = useState(false)

  const currentRound = rounds[currentIndex]
  // ops-span/wordラウンドは自己完結した専用コンポーネントが出題演出・回答・
  // 採点をすべて自前で行うため、以下の共通の状態機（phase/useStepReveal/
  // useCountdown/finalizeAnswer）を無効化する
  const isIsolatedRound = currentRound.mode === 'ops-span' || currentRound.mode === 'word'

  useEffect(() => {
    if (finished) {
      clearGameSession(sessionKey)
    } else {
      saveGameSession(sessionKey, { questions: rounds, results, currentIndex })
    }
  }, [sessionKey, rounds, results, currentIndex, finished])

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
    active: phase === 'showing' && !isIsolatedRound,
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
    phase === 'answering' && !isIsolatedRound,
    getRoundAnswerTimeoutMs(currentRound),
    () => finalizeAnswer(),
    paused,
  )

  // overrideTyped/overrideArrayValueは、入力直後のsetState関数型アップデータ
  // 内から自動採点する際に使う。ref（typedRef/arrayValueRef）は次のレンダー
  // まで更新されないため、同期呼び出しだと直前の1手分が欠けた状態で採点して
  // しまう不具合があった（単体モード画面と同じく最新値を明示的に渡す設計に統一）
  function finalizeAnswer(overrideTyped?: string, overrideArrayValue?: number[]) {
    const round = currentRound
    const typedValue = overrideTyped ?? typedRef.current
    const arrayValue = overrideArrayValue ?? arrayValueRef.current
    let correct = false
    switch (round.mode) {
      case 'digit':
        correct = isDigitAnswerCorrect(
          typedValue,
          round.gameType === 'reverse'
            ? reverseDigits(round.question.digits)
            : sumDigits(round.question.digits),
        )
        break
      case 'spatial':
        correct = isSpatialAnswerCorrect(arrayValue, reverseSequence(round.question.sequence))
        break
      case 'pattern':
        correct = isPatternSelectionCorrect(arrayValue, round.question.filledCells)
        break
      case 'tone':
        correct = isToneAnswerCorrect(arrayValue, round.question.sequence)
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
      typed: typedValue,
      tapped: arrayValue,
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
        finalizeAnswer(next)
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
      if (prev.length > 0) finalizeAnswer(prev)
      return prev
    })
  }

  // バグ修正: 単体のDigitGameScreenでは回答フェーズ中に物理キーボードの数字
  // 入力も受け付けるが、ランダムモードのすうじラウンドにはこの対応が無く、
  // 画面タップでしか入力できなかった
  useEffect(() => {
    if (phase !== 'answering' || paused || currentRound.mode !== 'digit') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspacePress()
      } else if (e.key === 'Enter') {
        commitTypedAnswer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentRound])

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
      if (next.length === expectedLength) finalizeAnswer(undefined, next)
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

  // ops-span/wordラウンドは専用コンポーネントが自前の「結果→次へ」画面を
  // 表示済みのため、ここでは結果の記録とラウンド送りだけを行う
  // （音・ハプティクスの再生も専用コンポーネント側で既に行っている）
  function advanceIsolatedRound(outcome: { correct: boolean; typed: string; tapped: number[] }) {
    const updated = [...results, { round: currentRound, ...outcome }]
    setResults(updated)
    if (currentIndex + 1 >= rounds.length) {
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleRetry() {
    setRounds(buildRounds(level, weakPointFocus, roundCount, undefined, enabledTypes))
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
            () => {
              saveShownRoundsForExclusion(rounds.slice(0, currentIndex + 1))
              clearGameSession(sessionKey)
              onExit()
            },
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
        {currentRound.mode === 'word' && (
          <RandomWordRound
            phrase={currentRound.question}
            level={levelFromQuestionId(currentRound.question.id)}
            isLastRound={currentIndex + 1 >= rounds.length}
            onFinish={(outcome) =>
              advanceIsolatedRound({ correct: outcome.correct, typed: outcome.heard, tapped: [] })
            }
          />
        )}

        {currentRound.mode === 'ops-span' && (
          <RandomOpsSpanRound
            question={currentRound.question}
            isLastRound={currentIndex + 1 >= rounds.length}
            onFinish={(outcome) =>
              advanceIsolatedRound({ correct: outcome.correct, typed: outcome.typed, tapped: [] })
            }
          />
        )}

        {!isIsolatedRound && (phase === 'ready' || phase === 'showing') && (
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
