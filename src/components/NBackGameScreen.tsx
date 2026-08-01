import { useEffect, useState } from 'react'
import { useStepReveal } from '../hooks/useStepReveal'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import {
  generateNBackSequence,
  scoreNBackTrials,
  getNValue,
  NBACK_SEQUENCE_LENGTH,
  NBACK_LEVEL_LABELS,
  STIMULUS_MS,
  GAP_MS,
  READY_MS,
} from '../lib/nback'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import type { BaseGameScreenProps, NBackPhase, NBackTrial } from '../types'

type NBackGameScreenProps = BaseGameScreenProps

export function NBackGameScreen({
  level,
  onExit,
  onSelectLevel,
}: NBackGameScreenProps) {
  const n = getNValue(level)
  const [trials, setTrials] = useState<NBackTrial[]>(() =>
    generateNBackSequence(level),
  )
  const [phase, setPhase] = useState<NBackPhase>('ready')
  const [pressed, setPressed] = useState<boolean[]>(() =>
    new Array(NBACK_SEQUENCE_LENGTH).fill(false),
  )

  // 準備フェーズ: 少し間を置いてから開始する
  useEffect(() => {
    if (phase !== 'ready') return
    const timeout = setTimeout(() => setPhase('showing'), READY_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  // 各試行を「表示→空白」の順に一定時間ずつ進め、最後まで来たら結果表示する
  const { index: trialIndex, isGap } = useStepReveal({
    active: phase === 'showing',
    itemCount: trials.length,
    shownMs: STIMULUS_MS,
    gapMs: GAP_MS,
    onComplete: () => setPhase('result'),
  })

  function handleMatchPress() {
    if (phase !== 'showing' || trialIndex >= trials.length) return
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
  const { newAchievements, isNewBest } = useSetCompletionRecorder({
    trigger: phase === 'result',
    mode: 'nback',
    level,
    correctCount: score.hits + score.correctRejections,
    total: trials.length,
    playAccuracySound: true,
  })

  function handleRetry() {
    setTrials(generateNBackSequence(level))
    setPressed(new Array(NBACK_SEQUENCE_LENGTH).fill(false))
    setPhase('ready')
  }

  if (phase === 'result') {
    const suggestedLevel = getSuggestedLevel(level, score.accuracy)
    return (
      <SetSummary
        items={trials.map((t, i) => ({
          key: `${i}`,
          label: t.isMatch ? `${t.digit}（一致）` : `${t.digit}`,
          correct: (t.isMatch && pressed[i]) || (!t.isMatch && !pressed[i]),
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
                    ? `🎉 ${NBACK_LEVEL_LABELS[suggestedLevel]}に挑戦する`
                    : `${NBACK_LEVEL_LABELS[suggestedLevel]}に戻って練習する`,
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
        onBack={() => confirmExit(trialIndex > 0, onExit)}
        currentIndex={trialIndex}
        total={trials.length}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:px-6 sm:py-10 dark:border-gray-700 dark:bg-gray-800"
      >
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {n}個前と同じなら「一致」を押してください
        </p>
        <p
          aria-hidden="true"
          className="text-7xl font-bold tabular-nums text-indigo-500"
        >
          {phase === 'ready' || isGap ? ' ' : (trials[trialIndex]?.digit ?? ' ')}
        </p>
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
            {pressed[trialIndex] ? '✓ 一致' : '一致'}
          </button>
        )}
      </div>
    </div>
  )
}
