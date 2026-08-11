import { useEffect, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { SettingsThemeSection } from './SettingsThemeSection'
import { SettingsLanguageSection } from './SettingsLanguageSection'
import { SettingsVoiceSection } from './SettingsVoiceSection'
import { SettingsDailyGoalSection } from './SettingsDailyGoalSection'
import { SettingsSoundSection } from './SettingsSoundSection'
import { SettingsBgmSection } from './SettingsBgmSection'
import { SettingsFocusModeSection } from './SettingsFocusModeSection'
import { SettingsHapticsSection } from './SettingsHapticsSection'
import { SettingsNotificationSection } from './SettingsNotificationSection'
import { SettingsDataSection } from './SettingsDataSection'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { AppSettings, ThemeMode } from '../types'

interface SettingsScreenProps {
  themeMode: ThemeMode
  onChangeTheme: (mode: ThemeMode) => void
  bgmEnabled: boolean
  onChangeBgmEnabled: (enabled: boolean) => void
  bgmVolume: number
  onChangeBgmVolume: (volume: number) => void
  focusModeEnabled: boolean
  onChangeFocusModeEnabled: (enabled: boolean) => void
  onBack: () => void
  onOpenPrivacy: () => void
}

export function SettingsScreen({
  themeMode,
  onChangeTheme,
  bgmEnabled,
  onChangeBgmEnabled,
  bgmVolume,
  onChangeBgmVolume,
  focusModeEnabled,
  onChangeFocusModeEnabled,
  onBack,
  onOpenPrivacy,
}: SettingsScreenProps) {
  const t = useTranslation()
  const { language, setLanguage } = useLanguage()
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())

  // themeMode/bgmEnabled/bgmVolume/focusModeEnabled は App 側
  // （useThemeMode/useBackgroundMusic/useFocusMode）が別途 saveSettings しているため、
  // ここでのローカル state が古いままにならないよう常に同期しておく
  useEffect(() => {
    setSettings((prev) =>
      prev.themeMode === themeMode &&
      prev.bgmEnabled === bgmEnabled &&
      prev.bgmVolume === bgmVolume &&
      prev.focusModeEnabled === focusModeEnabled
        ? prev
        : { ...prev, themeMode, bgmEnabled, bgmVolume, focusModeEnabled },
    )
  }, [themeMode, bgmEnabled, bgmVolume, focusModeEnabled])

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
        {t.common.back}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t.settings.heading}
      </h1>

      <SettingsThemeSection themeMode={themeMode} onChangeTheme={onChangeTheme} />

      <SettingsLanguageSection language={language} onChangeLanguage={setLanguage} />

      {language === 'ja' && (
        <SettingsVoiceSection
          speechRate={settings.speechRate}
          voiceURI={settings.voiceURI}
          onChangeRate={(speechRate) => updateSettings({ speechRate })}
          onChangeVoice={(voiceURI) => updateSettings({ voiceURI })}
        />
      )}

      <SettingsDailyGoalSection
        dailyGoal={settings.dailyGoal}
        onChangeGoal={(dailyGoal) => updateSettings({ dailyGoal })}
      />

      <SettingsSoundSection
        soundEnabled={settings.soundEnabled}
        onToggle={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        sfxVolume={settings.sfxVolume}
        onChangeVolume={(sfxVolume) => updateSettings({ sfxVolume })}
      />

      <SettingsBgmSection
        bgmEnabled={bgmEnabled}
        onToggle={() => onChangeBgmEnabled(!bgmEnabled)}
        bgmVolume={bgmVolume}
        onChangeVolume={onChangeBgmVolume}
      />

      <SettingsFocusModeSection
        focusModeEnabled={focusModeEnabled}
        onToggle={() => onChangeFocusModeEnabled(!focusModeEnabled)}
      />

      <SettingsHapticsSection
        hapticsEnabled={settings.hapticsEnabled}
        onToggle={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
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
          onChangeBgmEnabled(imported.bgmEnabled)
          onChangeBgmVolume(imported.bgmVolume)
          onChangeFocusModeEnabled(imported.focusModeEnabled)
        }}
      />

      <button
        type="button"
        onClick={onOpenPrivacy}
        className="touch-manipulation self-start text-sm text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {t.common.privacyPolicy}
      </button>
    </div>
  )
}
