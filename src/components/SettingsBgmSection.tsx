import { useTranslation } from '../contexts/LanguageContext'

interface SettingsBgmSectionProps {
  bgmEnabled: boolean
  onToggle: () => void
  bgmVolume: number
  onChangeVolume: (volume: number) => void
}

export function SettingsBgmSection({
  bgmEnabled,
  onToggle,
  bgmVolume,
  onChangeVolume,
}: SettingsBgmSectionProps) {
  const t = useTranslation()
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {t.settings.bgmTitle}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            bgmEnabled
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {bgmEnabled ? t.settings.on : t.settings.off}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="bgm-volume"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {t.settings.bgmVolumeTitle}
        </label>
        <div className="flex flex-1 items-center gap-2">
          <input
            id="bgm-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            value={bgmVolume}
            disabled={!bgmEnabled}
            onChange={(e) => onChangeVolume(Number(e.target.value))}
            className="flex-1 accent-indigo-500 disabled:opacity-50"
          />
          <span className="w-10 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {bgmVolume}
          </span>
        </div>
      </div>
    </section>
  )
}
