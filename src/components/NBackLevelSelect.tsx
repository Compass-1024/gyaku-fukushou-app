import { NBACK_LEVEL_LABELS } from '../lib/nback'
import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { LevelPicker } from './LevelPicker'
import type { HistoryEntry, Level } from '../types'

interface NBackLevelSelectProps {
  history: HistoryEntry[]
  onSelect: (level: Level) => void
  onBack: () => void
}

export function NBackLevelSelect({
  history,
  onSelect,
  onBack,
}: NBackLevelSelectProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        ← モード選択
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Nバックモード
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          数字が1つずつ表示されます。N個前と同じ数字なら「一致」を押すワーキングメモリトレーニングです。
        </p>
      </div>

      <LevelPicker
        labelFor={(level) => NBACK_LEVEL_LABELS[level]}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'nback')}
        onSelect={onSelect}
      />
    </div>
  )
}
