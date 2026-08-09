import { useTranslation } from '../contexts/LanguageContext'

interface SettingsFocusModeSectionProps {
  focusModeEnabled: boolean
  onToggle: () => void
}

// ④-6: 集中モード。回答中の背景装飾（カラフルなグラデーション・ぼかし円）を
// 非表示にし、ニュートラルな単色背景にする没入UIテーマ
export function SettingsFocusModeSection({
  focusModeEnabled,
  onToggle,
}: SettingsFocusModeSectionProps) {
  const t = useTranslation()
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {t.settings.focusModeTitle}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            focusModeEnabled
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {focusModeEnabled ? t.settings.on : t.settings.off}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.settings.focusModeDescription}
      </p>
    </section>
  )
}
