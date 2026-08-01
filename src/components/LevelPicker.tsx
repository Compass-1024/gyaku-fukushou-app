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
              // 半透明にすると背景色によってはWCAG AAのコントラスト基準（4.5:1）を
              // 割り込むため、不透明の白文字にして太字/サイズだけで階層を表現する
              <span className="text-sm">{descriptionFor(level)}</span>
            )}
            {stats.accuracy !== null && (
              <span className="text-xs">
                これまでの正答率: {stats.accuracy}%（{stats.attempts}回挑戦）
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
