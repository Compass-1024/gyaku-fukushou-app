import { useEffect, useState } from 'react'
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
} from '../lib/dualNback'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playButtonTap, playDualNBackTone } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { useTranslation } from '../contexts/LanguageContext'
import type { BaseGameScreenProps, DualNBackPhase, DualNBackTrial } from '../types'

type DualNBackGameScreenProps = BaseGameScreenProps & { trialCount: number }

export function DualNBackGameScreen({
  level,
  trialCount,
  onExit,
  onSelectLevel,
}: DualNBackGameScreenProps) {
  const t = useTranslation()
  const n = getDualNValue(level)
  const [trials, setTrials] = useState<DualNBackTrial[]>(() =>
    generateDualNBackSequence(level, trialCount),
  )
  const [phase, setPhase] = useState<DualNBackPhase>('ready')
  const [positionPressed, setPositionPressed] = useState<boolean[]>(() =>
    new Array(trialCount).fill(false),
  )
  const [soundPressed, setSoundPressed] = useState<boolean[]>(() =>
    new Array(trialCount).fill(false),
  )

  // 準備フェーズ: 少し間を置いてから開始する
  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  // 各試行を「表示→空白」の順に一定時間ずつ進め、表示のたびに音を鳴らす
  const { index: trialIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: trials.length,
    shownMs: STIMULUS_MS,
    gapMs: GAP_MS,
    onItemShown: (i) => {
      if (loadSettings().soundEnabled) playDualNBackTone(trials[i].sound)
    },
    onComplete: () => setPhase('result'),
  })

  function handlePositionMatchPress() {
    if (phase !== 'showing' || trialIndex >= trials.length) return
    setPositionPressed((prev) => {
      if (prev[trialIndex]) return prev
      const next = [...prev]
      next[trialIndex] = true
      return next
    })
    if (loadSettings().soundEnabled) playButtonTap()
  }

  function handleSoundMatchPress() {
    if (phase !== 'showing' || trialIndex >= trials.length) return
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
    level,
    correctCount,
    total: trials.length * 2,
    playAccuracySound: true,
  })

  function handleRetry() {
    setTrials(generateDualNBackSequence(level, trialCount))
    setPositionPressed(new Array(trialCount).fill(false))
    setSoundPressed(new Array(trialCount).fill(false))
    setPhase('ready')
  }

  if (phase === 'result') {
    const accuracyPercent =
      trials.length > 0
        ? Math.round((correctCount / (trials.length * 2)) * 100)
        : 0
    const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
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
                  suggestedLevel > level
                    ? t.common.suggestionUp(t.dualNback.levelLabel(suggestedLevel))
                    : t.common.suggestionDown(
                        t.dualNback.levelLabel(suggestedLevel),
                      ),
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      />
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
        total={trials.length}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:px-6 sm:py-10 dark:border-gray-700 dark:bg-gray-800"
      >
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {t.dualNback.matchPrompt(n)}
        </p>

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
