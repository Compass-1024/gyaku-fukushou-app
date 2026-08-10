import { useState } from 'react'
import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { LevelPicker } from './LevelPicker'
import { useTranslation } from '../contexts/LanguageContext'
import type { DigitGameType, HistoryEntry, Level } from '../types'

interface DigitLevelSelectProps {
  gameType: DigitGameType
  history: HistoryEntry[]
  onSelect: (level: Level, adaptive: boolean) => void
  onBack: () => void
}

export function DigitLevelSelect({
  gameType,
  history,
  onSelect,
  onBack,
}: DigitLevelSelectProps) {
  const t = useTranslation()
  // ④-2: オンにすると選んだレベルは開始レベルとしてのみ使い、セット中は
  // 1問ごとの正誤に応じてレベルが自動で上下する
  const [adaptive, setAdaptive] = useState(false)

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
          {t.digit.levelSelectTitle(t.digit.gameTypes[gameType].title)}
        </h1>
      </div>

      <label className="flex touch-manipulation items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
        <input
          type="checkbox"
          checked={adaptive}
          onChange={(e) => setAdaptive(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-indigo-500"
        />
        <span>
          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.digit.adaptiveLabel}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {t.digit.adaptiveDescription}
          </span>
        </span>
      </label>

      <LevelPicker
        labelFor={(level) => t.digit.levelLabel(level)}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'digit', gameType)}
        onSelect={(level) => onSelect(level, adaptive)}
      />
    </div>
  )
}
