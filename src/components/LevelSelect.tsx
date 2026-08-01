import { LEVEL_LABELS } from '../lib/phrases'
import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { LevelPicker } from './LevelPicker'
import type { HistoryEntry, Level } from '../types'

const LEVEL_DESCRIPTIONS: Record<Level, string> = {
  1: '例：くつ、りんご',
  2: '例：ひまわり、とうもろこし',
  3: '例：がっこうにいく、あめがふってきた',
}

interface LevelSelectProps {
  recognitionSupported: boolean
  history: HistoryEntry[]
  onSelect: (level: Level) => void
  onBack: () => void
}

export function LevelSelect({
  recognitionSupported,
  history,
  onSelect,
  onBack,
}: LevelSelectProps) {
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
          ことばモード
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          言葉を聞いて、逆から声に出して答えるワーキングメモリトレーニングです。
        </p>
      </div>

      {!recognitionSupported && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
          お使いのブラウザは音声認識に対応していません。Google Chrome や
          Microsoft Edge でお試しください。
        </div>
      )}

      <LevelPicker
        labelFor={(level) => LEVEL_LABELS[level]}
        descriptionFor={(level) => LEVEL_DESCRIPTIONS[level]}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'word')}
        disabled={!recognitionSupported}
        onSelect={onSelect}
      />
    </div>
  )
}
