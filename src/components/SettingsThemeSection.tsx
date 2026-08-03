import { useTranslation } from '../contexts/LanguageContext'
import type { ThemeMode } from '../types'

interface SettingsThemeSectionProps {
  themeMode: ThemeMode
  onChangeTheme: (mode: ThemeMode) => void
}

export function SettingsThemeSection({
  themeMode,
  onChangeTheme,
}: SettingsThemeSectionProps) {
  const t = useTranslation()
  const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t.settings.theme.system },
    { value: 'light', label: t.settings.theme.light },
    { value: 'dark', label: t.settings.theme.dark },
  ]
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.settings.theme.title}
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
