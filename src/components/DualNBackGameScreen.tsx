import { useEffect, useRef, useState } from 'react'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import {
  generateDualNBackSequence,
  scoreDualNBackTrials,
  getDualNValue,
  GRID_SIZE,
  STIMULUS_MS,
  GAP_MS,
  READY_MS,
  createAdaptiveDualNState,
  generateNextAdaptiveDualTrial,
  advanceAdaptiveDualState,
} from '../lib/dualNback'
import type { AdaptiveDualNState } from '../lib/dualNback'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playButtonTap, playDualNBackTone } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { useTranslation } from '../contexts/LanguageContext'
import type {
  BaseGameScreenProps,
  DualNBackPhase,
  DualNBackTrial,
  Level,
} from '../types'

type DualNBackGameScreenProps = BaseGameScreenProps & {
  trialCount: number
  // ④-1: オンの場合、levelは開始N値としてのみ使い、セッション中は位置・音
  // 両方の正誤に応じてN値が自動で上下する（アダプティブ階段法）
  adaptive?: boolean
}

// 音を鳴らすタイミング(onItemShown)がtrials[i]を即座に参照するため、
// 非アダプティブ時と異なり1試行先読みで2件同時に生成しておく
function initialAdaptiveDualTrials(startN: number): {
  trials: DualNBackTrial[]
  engine: AdaptiveDualNState
} {
  const first = generateNextAdaptiveDualTrial(createAdaptiveDualNState(startN))
  const second = generateNextAdaptiveDualTrial(first.state)
  return { trials: [first.trial, second.trial], engine: second.state }
}

export function DualNBackGameScreen({
  level,
  trialCount,
  adaptive = false,
  onExit,
  onSelectLevel,
}: DualNBackGameScreenProps) {
  const t = useTranslation()
  const startN = getDualNValue(level)
  const engineRef = useRef<AdaptiveDualNState>(createAdaptiveDualNState(startN))
  const [trials, setTrials] = useState<DualNBackTrial[]>(() => {
    if (!adaptive) return generateDualNBackSequence(level, trialCount)
    const { trials: initialTrials, engine } = initialAdaptiveDualTrials(startN)
    engineRef.current = engine
    return initialTrials
  })
  const [currentN, setCurrentN] = useState(startN)
  const [maxNReached, setMaxNReached] = useState(startN)
  const [phase, setPhase] = useState<DualNBackPhase>('ready')
  const [positionPressed, setPositionPressed] = useState<boolean[]>(() =>
    new Array(trialCount).fill(false),
  )
  const [soundPressed, setSoundPressed] = useState<boolean[]>(() =>
    new Array(trialCount).fill(false),
  )
  const positionPressedRef = useRef(positionPressed)
  positionPressedRef.current = positionPressed
  const soundPressedRef = useRef(soundPressed)
  soundPressedRef.current = soundPressed

  // 準備フェーズ: 少し間を置いてから開始する
  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  // 各試行を「表示→空白」の順に一定時間ずつ進め、表示のたびに音を鳴らす。
  // itemCountは常にセッション全体の試行数(trialCount)で固定する
  const { index: trialIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: trialCount,
    shownMs: STIMULUS_MS,
    gapMs: GAP_MS,
    onItemShown: (i) => {
      if (loadSettings().soundEnabled) playDualNBackTone(trials[i]?.sound ?? 0)
    },
    onComplete: () => setPhase('result'),
  })

  // アダプティブモード: onItemShownが「表示された瞬間」に trials[i] を
  // 参照するため、非アダプティブ時と違い1試行先読みで生成しておく必要が
  // ある（生成が後追いだと音が鳴らせない）。そのため初期状態でtrials[0]と
  // trials[1]を両方生成し、以降はtrialIndexが進むたびに「1つ前の試行の
  // 正誤を反映してNを更新し、trialIndex+1（まだ無ければ）を生成する」
  useEffect(() => {
    if (!adaptive) return
    if (trialIndex === 0 || trialIndex >= trialCount) return
    const nextIndexToGenerate = trialIndex + 1
    if (trials.length > nextIndexToGenerate) return // 既に生成済み
    const prevTrial = trials[trialIndex - 1]
    const posCorrect =
      (prevTrial.positionMatch && positionPressedRef.current[trialIndex - 1]) ||
      (!prevTrial.positionMatch && !positionPressedRef.current[trialIndex - 1])
    const soundCorrect =
      (prevTrial.soundMatch && soundPressedRef.current[trialIndex - 1]) ||
      (!prevTrial.soundMatch && !soundPressedRef.current[trialIndex - 1])
    const advanced = advanceAdaptiveDualState(engineRef.current, posCorrect && soundCorrect)
    engineRef.current = advanced
    setCurrentN(advanced.n)
    setMaxNReached((m) => Math.max(m, advanced.n))
    if (nextIndexToGenerate < trialCount) {
      const { trial, state } = generateNextAdaptiveDualTrial(advanced)
      engineRef.current = state
      setTrials([...trials, trial])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptive, trialIndex, trialCount])

  function handlePositionMatchPress() {
    if (phase !== 'showing' || trialIndex >= trialCount || !trials[trialIndex]) return
    setPositionPressed((prev) => {
      if (prev[trialIndex]) return prev
      const next = [...prev]
      next[trialIndex] = true
      return next
    })
    if (loadSettings().soundEnabled) playButtonTap()
  }

  function handleSoundMatchPress() {
    if (phase !== 'showing' || trialIndex >= trialCount || !trials[trialIndex]) return
    setSoundPressed((prev) => {
      if (prev[trialIndex]) return prev
      const next = [...prev]
      next[trialIndex] = true
      return next
    })
    if (loadSettings().soundEnabled) playButtonTap()
  }

  // 位置一致=A/ArrowLeft、音一致=L/ArrowRightキーでも操作できるようにする
  useEffect(() => {
    if (phase !== 'showing') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        handlePositionMatchPress()
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        handleSoundMatchPress()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trialIndex])

  // 修正①: アダプティブモードでは、開始レベルではなく実際に到達したN値を
  // 履歴・統計・実績の判定に使う
  const recordedLevel = (adaptive ? maxNReached : level) as Level

  // 結果が確定するたびに、履歴の記録・効果音の再生・新規実績の解除演出を行う
  const score = scoreDualNBackTrials(trials, positionPressed, soundPressed)
  const correctCount =
    score.position.hits +
    score.position.correctRejections +
    score.sound.hits +
    score.sound.correctRejections
  const { newAchievements, isNewBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: phase === 'result',
    mode: 'dual-nback',
    level: recordedLevel,
    correctCount,
    total: trials.length * 2,
    playAccuracySound: true,
  })

  function handleRetry() {
    if (adaptive) {
      const { trials: initialTrials, engine } = initialAdaptiveDualTrials(startN)
      engineRef.current = engine
      setTrials(initialTrials)
      setCurrentN(startN)
      setMaxNReached(startN)
    } else {
      setTrials(generateDualNBackSequence(level, trialCount))
    }
    setPositionPressed(new Array(trialCount).fill(false))
    setSoundPressed(new Array(trialCount).fill(false))
    setPhase('ready')
  }

  if (phase === 'result') {
    const accuracyPercent =
      trials.length > 0
        ? Math.round((correctCount / (trials.length * 2)) * 100)
        : 0
    const suggestedLevel = getSuggestedLevel(recordedLevel, accuracyPercent)
    return (
      <SetSummary
        items={trials.flatMap((trial, i) => [
          {
            key: `${i}-position`,
            label: t.dualNback.resultLabel('position', trial.positionMatch),
            correct:
              (trial.positionMatch && positionPressed[i]) ||
              (!trial.positionMatch && !positionPressed[i]),
          },
          {
            key: `${i}-sound`,
            label: t.dualNback.resultLabel('sound', trial.soundMatch),
            correct:
              (trial.soundMatch && soundPressed[i]) ||
              (!trial.soundMatch && !soundPressed[i]),
          },
        ])}
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
                  suggestedLevel > recordedLevel
                    ? t.common.suggestionUp(t.dualNback.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(
                        t.dualNback.levelLabel(suggestedLevel),
                      ),
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      >
        {adaptive && (
          <p className="text-center text-xs font-medium text-indigo-500 dark:text-indigo-300">
            {t.dualNback.maxNReachedLabel(maxNReached)}
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
          {t.dualNback.matchPrompt(currentN)}
        </p>
        {adaptive && (
          <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-300">
            {t.dualNback.currentNLabel(currentN)}
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePositionMatchPress}
              disabled={positionPressed[trialIndex]}
              className={`touch-manipulation rounded-full px-5 py-3 font-bold text-white shadow-sm transition ${
                positionPressed[trialIndex]
                  ? 'bg-emerald-400'
                  : 'bg-indigo-500 hover:bg-indigo-400'
              }`}
            >
              {positionPressed[trialIndex]
                ? t.dualNback.positionMatchButtonPressed
                : t.dualNback.positionMatchButton}
            </button>
            <button
              type="button"
              onClick={handleSoundMatchPress}
              disabled={soundPressed[trialIndex]}
              className={`touch-manipulation rounded-full px-5 py-3 font-bold text-white shadow-sm transition ${
                soundPressed[trialIndex]
                  ? 'bg-emerald-400'
                  : 'bg-rose-500 hover:bg-rose-400'
              }`}
            >
              {soundPressed[trialIndex]
                ? t.dualNback.soundMatchButtonPressed
                : t.dualNback.soundMatchButton}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
