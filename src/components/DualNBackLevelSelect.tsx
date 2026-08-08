import { useState } from 'react'
import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { TRIAL_COUNT_OPTIONS, DEFAULT_TRIAL_COUNT } from '../lib/dualNback'
import { LevelPicker } from './LevelPicker'
import { useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry, Level } from '../types'

interface DualNBackLevelSelectProps {
  history: HistoryEntry[]
  onSelect: (level: Level, trialCount: number) => void
  onBack: () => void
}

export function DualNBackLevelSelect({
  history,
  onSelect,
  onBack,
}: DualNBackLevelSelectProps) {
  const t = useTranslation()
  const [trialCount, setTrialCount] = useState<number>(DEFAULT_TRIAL_COUNT)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        {t.common.backToModeSelect}
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t.dualNback.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t.dualNback.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t.dualNback.trialCountTitle}
        </p>
        <div className="flex gap-2">
          {TRIAL_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setTrialCount(count)}
              aria-pressed={trialCount === count}
              className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
                trialCount === count
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.dualNback.trialCountLabel(count)}
            </button>
          ))}
        </div>
      </div>

      <LevelPicker
        labelFor={(level) => t.dualNback.levelLabel(level)}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'dual-nback')}
        onSelect={(level) => onSelect(level, trialCount)}
      />
    </div>
  )
}
