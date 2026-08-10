import { useTranslation } from '../contexts/LanguageContext'

interface SettingsHapticsSectionProps {
  hapticsEnabled: boolean
  onToggle: () => void
}

// Android実装(TWA)を見据えたハプティックフィードバック設定。
// navigator.vibrate非対応環境（iOS Safari等）ではオンにしても何も起きない
export function SettingsHapticsSection({
  hapticsEnabled,
  onToggle,
}: SettingsHapticsSectionProps) {
  const t = useTranslation()
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {t.settings.hapticsTitle}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            hapticsEnabled
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {hapticsEnabled ? t.settings.on : t.settings.off}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.settings.hapticsDescription}
      </p>
    </section>
  )
}
