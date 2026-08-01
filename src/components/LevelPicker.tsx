import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import type { LevelStats } from '../lib/history'
import type { Level } from '../types'

const LEVELS: readonly Level[] = [1, 2, 3]

interface LevelPickerProps {
  labelFor: (level: Level) => string
  descriptionFor?: (level: Level) => string
  colorFor: (level: Level) => string
  statsFor: (level: Level) => LevelStats
  disabled?: boolean
  onSelect: (level: Level) => void
}

export function LevelPicker({
  labelFor,
  descriptionFor,
  colorFor,
  statsFor,
  disabled,
  onSelect,
}: LevelPickerProps) {
  return (
    <div className="flex flex-col gap-4">
      {LEVELS.map((level) => {
        const stats = statsFor(level)
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (loadSettings().soundEnabled) playButtonTap()
              onSelect(level)
            }}
            className={`flex touch-manipulation flex-col items-start gap-1 rounded-xl px-5 py-4 text-left text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${colorFor(level)}`}
          >
            <span className="text-lg font-semibold">{labelFor(level)}</span>
            {descriptionFor && (
              <span className="text-sm opacity-90">
                {descriptionFor(level)}
              </span>
            )}
            {stats.accuracy !== null && (
              <span className="text-xs opacity-80">
                これまでの正答率: {stats.accuracy}%（{stats.attempts}回挑戦）
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
