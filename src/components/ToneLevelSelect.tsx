import { TONE_LEVEL_LABELS } from '../lib/tone'
import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { LevelPicker } from './LevelPicker'
import type { HistoryEntry, Level } from '../types'

interface ToneLevelSelectProps {
  history: HistoryEntry[]
  onSelect: (level: Level) => void
  onBack: () => void
}

export function ToneLevelSelect({
  history,
  onSelect,
  onBack,
}: ToneLevelSelectProps) {
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
          音・色モード
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          色のパッドが音とともに光る順番を覚えて、同じ順にタップして再現するワーキングメモリトレーニングです。
        </p>
      </div>

      <LevelPicker
        labelFor={(level) => TONE_LEVEL_LABELS[level]}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'tone')}
        onSelect={onSelect}
      />
    </div>
  )
}
