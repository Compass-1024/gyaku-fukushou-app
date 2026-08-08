import { useEffect, useRef, useState } from 'react'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import {
  generateNBackSequence,
  scoreNBackTrials,
  getNValue,
  GRID_SIZE,
  STIMULUS_MS,
  GAP_MS,
  READY_MS,
  createAdaptiveNState,
  generateNextAdaptiveTrial,
  advanceAdaptiveState,
} from '../lib/nback'
import type { AdaptiveNState } from '../lib/nback'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { useTranslation } from '../contexts/LanguageContext'
import type { BaseGameScreenProps, NBackPhase, NBackTrial } from '../types'

type NBackGameScreenProps = BaseGameScreenProps & {
  trialCount: number
  // ④-1: オンの場合、levelは開始N値としてのみ使い、セッション中は直近の
  // 正誤に応じてN値が自動で上下する（アダプティブ階段法）
  adaptive?: boolean
}

function initialAdaptiveTrial(startN: number): {
  trials: NBackTrial[]
  engine: AdaptiveNState
} {
  const { trial, state } = generateNextAdaptiveTrial(createAdaptiveNState(startN))
  return { trials: [trial], engine: state }
}

export function NBackGameScreen({
  level,
  trialCount,
  adaptive = false,
  onExit,
  onSelectLevel,
}: NBackGameScreenProps) {
  const t = useTranslation()
  const startN = getNValue(level)
  const engineRef = useRef<AdaptiveNState>(createAdaptiveNState(startN))
  const [trials, setTrials] = useState<NBackTrial[]>(() => {
    if (!adaptive) return generateNBackSequence(level, trialCount)
    const { trials: initialTrials, engine } = initialAdaptiveTrial(startN)
    engineRef.current = engine
    return initialTrials
  })
  const [currentN, setCurrentN] = useState(startN)
  const [maxNReached, setMaxNReached] = useState(startN)
  const [phase, setPhase] = useState<NBackPhase>('ready')
  const [pressed, setPressed] = useState<boolean[]>(() =>
    new Array(trialCount).fill(false),
  )
  const pressedRef = useRef(pressed)
  pressedRef.current = pressed

  // 準備フェーズ: 少し間を置いてから開始する
  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  // 各試行を「表示→空白」の順に一定時間ずつ進め、最後まで来たら結果表示する。
  // itemCountは常にセッション全体の試行数(trialCount)で固定し、trials配列の
  // 実際の長さ（アダプティブ時は逐次生成のため段階的に伸びる）とは独立させる
  const { index: trialIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: trialCount,
    shownMs: STIMULUS_MS,
    gapMs: GAP_MS,
    onComplete: () => setPhase('result'),
  })

  // アダプティブモード: 試行が進むたびに、直前の試行の正誤を反映してN値を
  // 更新し、次の試行を生成する（非アダプティブ時は全試行が生成済みのため
  // 何もしない）。ref操作をuseState更新関数の内側ではなくeffect本体に置く
  // ことで、Strict Modeの二重実行検証（更新関数は純粋であるべき）と衝突しないようにする
  useEffect(() => {
    if (!adaptive) return
    if (trialIndex === 0 || trialIndex >= trialCount) return
    if (trials.length > trialIndex) return // 既に生成済み
    const prevTrial = trials[trialIndex - 1]
    const prevCorrect =
      (prevTrial.isMatch && pressedRef.current[trialIndex - 1]) ||
      (!prevTrial.isMatch && !pressedRef.current[trialIndex - 1])
    const advanced = advanceAdaptiveState(engineRef.current, prevCorrect)
    const { trial, state } = generateNextAdaptiveTrial(advanced)
    engineRef.current = state
    setCurrentN(state.n)
    setMaxNReached((m) => Math.max(m, state.n))
    setTrials([...trials, trial])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptive, trialIndex, trialCount])

  function handleMatchPress() {
    if (phase !== 'showing' || trialIndex >= trialCount || !trials[trialIndex]) return
    setPressed((prev) => {
      if (prev[trialIndex]) return prev
      const next = [...prev]
      next[trialIndex] = true
      return next
    })
    if (loadSettings().soundEnabled) playButtonTap()
  }

  // スペースキー・Enterキーでも「一致」を押せるようにする
  // （他モードの操作フェーズもEnter/物理キーボードに対応しており、
  // 片手・キーボード操作での周回のしやすさを揃えるため）
  useEffect(() => {
    if (phase !== 'showing') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        handleMatchPress()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trialIndex])

  // 結果が確定するたびに、履歴の記録・効果音の再生・新規実績の解除演出を行う
  const score = scoreNBackTrials(trials, pressed)
  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: phase === 'result',
    mode: 'nback',
    level,
    correctCount: score.hits + score.correctRejections,
    total: trials.length,
    playAccuracySound: true,
  })

  function handleRetry() {
    if (adaptive) {
      const { trials: initialTrials, engine } = initialAdaptiveTrial(startN)
      engineRef.current = engine
      setTrials(initialTrials)
      setCurrentN(startN)
      setMaxNReached(startN)
    } else {
      setTrials(generateNBackSequence(level, trialCount))
    }
    setPressed(new Array(trialCount).fill(false))
    setPhase('ready')
  }

  if (phase === 'result') {
    const suggestedLevel = getSuggestedLevel(level, score.accuracy)
    return (
      <SetSummary
        items={trials.map((trial, i) => ({
          key: `${i}`,
          label: t.nback.resultLabel(trial.position, trial.isMatch),
          correct:
            (trial.isMatch && pressed[i]) || (!trial.isMatch && !pressed[i]),
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
                    ? t.common.suggestionUp(t.nback.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(t.nback.levelLabel(suggestedLevel)),
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      >
        {adaptive && (
          <p className="text-center text-xs font-medium text-indigo-500 dark:text-indigo-300">
            {t.nback.maxNReachedLabel(maxNReached)}
          </p>
        )}
      </SetSummary>
    )
  }

  const currentTrial = trials[trialIndex]
  const litCell = phase === 'showing' && !isGap ? currentTrial?.position : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <GameHeader
        backLabel={t.common.backToLevelSelect}
        onBack={() =>
          confirmExit(trialIndex > 0, onExit, t.common.confirmExitMessage)
        }
        currentIndex={trialIndex}
        total={trialCount}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:px-6 sm:py-10 dark:border-gray-700 dark:bg-gray-800"
      >
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {t.nback.matchPrompt(currentN)}
        </p>
        {adaptive && (
          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">
            {t.nback.currentNLabel(currentN)}
          </p>
        )}

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: GRID_SIZE * 56,
            maxWidth: '100%',
          }}
          aria-hidden="true"
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => (
            <div
              key={cell}
              className={`aspect-square rounded-lg ${
                litCell === cell
                  ? 'bg-indigo-500'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {phase === 'showing' && (
          <button
            type="button"
            onClick={handleMatchPress}
            disabled={pressed[trialIndex]}
            className={`touch-manipulation rounded-full px-8 py-3 text-lg font-bold text-white shadow-sm transition ${
              pressed[trialIndex]
                ? 'bg-emerald-400'
                : 'bg-indigo-500 hover:bg-indigo-400'
            }`}
          >
            {pressed[trialIndex] ? t.nback.matchButtonPressed : t.nback.matchButton}
          </button>
        )}
      </div>
    </div>
  )
}
