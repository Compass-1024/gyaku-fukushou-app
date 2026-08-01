import { useEffect, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { SettingsThemeSection } from './SettingsThemeSection'
import { SettingsVoiceSection } from './SettingsVoiceSection'
import { SettingsDailyGoalSection } from './SettingsDailyGoalSection'
import { SettingsSoundSection } from './SettingsSoundSection'
import { SettingsNotificationSection } from './SettingsNotificationSection'
import { SettingsDataSection } from './SettingsDataSection'
import type { AppSettings, ThemeMode } from '../types'

interface SettingsScreenProps {
  themeMode: ThemeMode
  onChangeTheme: (mode: ThemeMode) => void
  onBack: () => void
  onOpenPrivacy: () => void
}

export function SettingsScreen({
  themeMode,
  onChangeTheme,
  onBack,
  onOpenPrivacy,
}: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())

  // themeMode は App 側（useThemeMode）が別途 saveSettings しているため、
  // ここでのローカル state が古いままにならないよう常に同期しておく
  useEffect(() => {
    setSettings((prev) =>
      prev.themeMode === themeMode ? prev : { ...prev, themeMode },
    )
  }, [themeMode])

  function updateSettings(partial: Partial<AppSettings>) {
    // 保存直前に最新の設定を読み直してからマージする。ローカル state だけを
    // 元にすると、themeMode のように他所で更新されたフィールドを
    // 古い値で上書きしてしまうため。
    const next = { ...loadSettings(), ...partial }
    saveSettings(next)
    setSettings(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        ← 戻る
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        設定
      </h1>

      <SettingsThemeSection themeMode={themeMode} onChangeTheme={onChangeTheme} />

      <SettingsVoiceSection
        speechRate={settings.speechRate}
        voiceURI={settings.voiceURI}
        onChangeRate={(speechRate) => updateSettings({ speechRate })}
        onChangeVoice={(voiceURI) => updateSettings({ voiceURI })}
      />

      <SettingsDailyGoalSection
        dailyGoal={settings.dailyGoal}
        onChangeGoal={(dailyGoal) => updateSettings({ dailyGoal })}
      />

      <SettingsSoundSection
        soundEnabled={settings.soundEnabled}
        onToggle={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
      />

      <SettingsNotificationSection
        notificationsEnabled={settings.notificationsEnabled}
        onChange={(notificationsEnabled) =>
          updateSettings({ notificationsEnabled })
        }
      />

      <SettingsDataSection
        onImported={(imported) => {
          setSettings(imported)
          onChangeTheme(imported.themeMode)
        }}
      />

      <button
        type="button"
        onClick={onOpenPrivacy}
        className="touch-manipulation self-start text-sm text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        プライバシーポリシー
      </button>
    </div>
  )
}
