import type { ThemeMode } from '../types'

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'システム' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
]

interface SettingsThemeSectionProps {
  themeMode: ThemeMode
  onChangeTheme: (mode: ThemeMode) => void
}

export function SettingsThemeSection({
  themeMode,
  onChangeTheme,
}: SettingsThemeSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        テーマ
      </h2>
      <div className="flex gap-2">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChangeTheme(opt.value)}
            className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
              themeMode === opt.value
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  )
}
