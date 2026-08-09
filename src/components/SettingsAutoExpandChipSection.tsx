import { useTranslation } from '../contexts/LanguageContext'
import type { AppSettings } from '../types'

type AutoExpandChip = AppSettings['autoExpandChip']

interface SettingsAutoExpandChipSectionProps {
  autoExpandChip: AutoExpandChip
  onChange: (value: AutoExpandChip) => void
}

// ④-7: 「今日のミッション」「本日のお題」「7日間チャレンジ」のうち、
// ホーム画面表示時に自動展開しておきたい1件を選べる設定
export function SettingsAutoExpandChipSection({
  autoExpandChip,
  onChange,
}: SettingsAutoExpandChipSectionProps) {
  const t = useTranslation()
  const options: { value: AutoExpandChip; label: string }[] = [
    { value: 'none', label: t.settings.autoExpandChipNone },
    { value: 'mission', label: t.missions.chipLabel },
    { value: 'challenge', label: t.dailyChallenge.chipLabel },
    { value: 'program', label: t.program.chipLabel },
  ]

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
        {t.settings.autoExpandChipTitle}
      </span>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.settings.autoExpandChipDescription}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.settings.autoExpandChipTitle}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={autoExpandChip === option.value}
            className={`touch-manipulation rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              autoExpandChip === option.value
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}
