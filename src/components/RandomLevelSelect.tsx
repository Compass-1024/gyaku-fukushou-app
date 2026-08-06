import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { LevelPicker } from './LevelPicker'
import { useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry, Level } from '../types'

interface RandomLevelSelectProps {
  history: HistoryEntry[]
  onSelect: (level: Level) => void
  onBack: () => void
}

export function RandomLevelSelect({
  history,
  onSelect,
  onBack,
}: RandomLevelSelectProps) {
  const t = useTranslation()
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
          {t.random.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t.random.subtitle}
        </p>
      </div>

      <LevelPicker
        labelFor={(level) => t.random.levelLabel(level)}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'random')}
        onSelect={onSelect}
      />
    </div>
  )
}
