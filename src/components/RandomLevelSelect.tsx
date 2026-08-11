import { useMemo, useState } from 'react'
import { getLevelStats } from '../lib/history'
import { LEVEL_STYLES } from '../lib/levelStyles'
import { ROUND_COUNT_OPTIONS, DEFAULT_ROUND_COUNT, ALL_ROUND_TYPES } from '../lib/random'
import type { RoundCount, RandomRoundType } from '../lib/random'
import { LevelPicker } from './LevelPicker'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry, Level } from '../types'

interface RandomLevelSelectProps {
  history: HistoryEntry[]
  onSelect: (
    level: Level,
    weakPointFocus: boolean,
    roundCount: RoundCount,
    enabledTypes: RandomRoundType[],
  ) => void
  onBack: () => void
}

export function RandomLevelSelect({
  history,
  onSelect,
  onBack,
}: RandomLevelSelectProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  // ことばモードは日本語の音韻に依存するため、英語版では候補から除外する
  // （TopScreen/App.tsxの他のことばモード用言語ガードと同じ考え方）
  const availableTypes = useMemo(
    () => (language === 'ja' ? ALL_ROUND_TYPES : ALL_ROUND_TYPES.filter((t2) => t2 !== 'word')),
    [language],
  )
  // ④-2: オンにすると各ラウンドのレベルを一律ではなくモードごとの弱点レベルへ
  // 自動で合わせる（インターリーブ練習を弱点分野に集中させるオプション）
  const [weakPointFocus, setWeakPointFocus] = useState(false)
  const [roundCount, setRoundCount] = useState<RoundCount>(DEFAULT_ROUND_COUNT)
  // 出題するモードの選択。既定は全種類（従来どおりの挙動）
  const [enabledTypes, setEnabledTypes] = useState<RandomRoundType[]>([...availableTypes])

  function toggleType(type: RandomRoundType) {
    setEnabledTypes((prev) => {
      if (prev.includes(type)) {
        // 最後の1つは選択解除できないようにする（出題不能状態を防ぐ）
        if (prev.length === 1) return prev
        return prev.filter((t2) => t2 !== type)
      }
      return [...prev, type]
    })
  }

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

      <div className="flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t.random.roundCountTitle}
        </p>
        <div className="flex gap-2">
          {ROUND_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setRoundCount(count)}
              aria-pressed={roundCount === count}
              className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
                roundCount === count
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.random.roundCountLabel(count)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
          {t.random.roundTypeTitle}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableTypes.map((type) => {
            const checked = enabledTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                aria-pressed={checked}
                className={`touch-manipulation rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  checked
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t.common.areaLabels[type]}
              </button>
            )
          })}
        </div>
        {enabledTypes.length === 1 && (
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
            {t.random.roundTypeAllOffWarning}
          </p>
        )}
      </div>

      <label className="flex touch-manipulation items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
        <input
          type="checkbox"
          checked={weakPointFocus}
          onChange={(e) => setWeakPointFocus(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-indigo-500"
        />
        <span>
          <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
            {t.random.weakPointFocusLabel}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {t.random.weakPointFocusDescription}
          </span>
        </span>
      </label>

      <LevelPicker
        labelFor={(level) => t.random.levelLabel(level)}
        colorFor={(level) => LEVEL_STYLES[level]}
        statsFor={(level) => getLevelStats(history, level, 'random')}
        onSelect={(level) => onSelect(level, weakPointFocus, roundCount, enabledTypes)}
      />
    </div>
  )
}
