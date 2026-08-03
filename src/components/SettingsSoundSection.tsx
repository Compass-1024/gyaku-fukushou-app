import { useTranslation } from '../contexts/LanguageContext'

interface SettingsSoundSectionProps {
  soundEnabled: boolean
  onToggle: () => void
}

export function SettingsSoundSection({
  soundEnabled,
  onToggle,
}: SettingsSoundSectionProps) {
  const t = useTranslation()
  return (
    <section className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
        {t.settings.soundTitle}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition ${
          soundEnabled
            ? 'bg-emerald-700 text-white'
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        {soundEnabled ? t.settings.on : t.settings.off}
      </button>
    </section>
  )
}
