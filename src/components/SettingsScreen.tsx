import { useEffect, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import type { AppSettings, ThemeMode } from '../types'

interface SettingsScreenProps {
  themeMode: ThemeMode
  onChangeTheme: (mode: ThemeMode) => void
  onBack: () => void
  onOpenPrivacy: () => void
}

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'システム' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: 'ダーク' },
]

const RATE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.75, label: 'ゆっくり' },
  { value: 0.95, label: 'ふつう' },
  { value: 1.15, label: 'はやい' },
]

const DAILY_GOAL_OPTIONS = [1, 3, 5, 10]

export function SettingsScreen({
  themeMode,
  onChangeTheme,
  onBack,
  onOpenPrivacy,
}: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    function updateVoices() {
      const all = window.speechSynthesis.getVoices()
      setVoices(all.filter((v) => v.lang.startsWith('ja')))
    }
    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () =>
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
  }, [])

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

  function handleTestVoice() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('こんにちは')
    utterance.lang = 'ja-JP'
    utterance.rate = settings.speechRate
    const voice = voices.find((v) => v.voiceURI === settings.voiceURI)
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          読み上げ速度
        </h2>
        <div className="flex gap-2">
          {RATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateSettings({ speechRate: opt.value })}
              className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
                settings.speechRate === opt.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {voices.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            声
          </h2>
          <select
            value={settings.voiceURI ?? ''}
            onChange={(e) =>
              updateSettings({ voiceURI: e.target.value || null })
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">自動</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <button
        type="button"
        onClick={handleTestVoice}
        className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        🔊 テスト再生
      </button>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          1日の目標セット数
        </h2>
        <div className="flex gap-2">
          {DAILY_GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => updateSettings({ dailyGoal: goal })}
              className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
                settings.dailyGoal === goal
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          効果音
        </span>
        <button
          type="button"
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            settings.soundEnabled
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {settings.soundEnabled ? 'オン' : 'オフ'}
        </button>
      </section>

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
