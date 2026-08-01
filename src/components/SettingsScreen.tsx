import { useEffect, useRef, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { clearHistory, loadHistory, replaceHistory } from '../lib/history'
import {
  backupFileName,
  createBackup,
  parseBackupJson,
  serializeBackup,
} from '../lib/backup'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'
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

// Vercel Cron(Hobbyプランは1日1回まで)の制約により、送信時刻は
// 全ユーザー共通固定（vercel.jsonの設定で21時ごろJST、最大59分前後する）
const NOTIFY_HOUR_LABEL = '21時ごろ'

export function SettingsScreen({
  themeMode,
  onChangeTheme,
  onBack,
  onOpenPrivacy,
}: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [historyCleared, setHistoryCleared] = useState(false)
  const [importMessage, setImportMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  )
  const [notificationBusy, setNotificationBusy] = useState(false)

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

  function handleClearHistory() {
    if (
      !window.confirm(
        '学習履歴・統計・実績をすべて削除します。この操作は取り消せません。よろしいですか？',
      )
    ) {
      return
    }
    clearHistory()
    setHistoryCleared(true)
  }

  function handleExport() {
    const backup = createBackup(loadHistory(), loadSettings())
    const blob = new Blob([serializeBackup(backup)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName()
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportMessage(null)
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const text = await file.text()
    const result = parseBackupJson(text)
    if (!result.ok) {
      setImportMessage({ type: 'error', text: result.error })
      return
    }

    if (
      !window.confirm(
        `現在の学習履歴・設定を、バックアップファイルの内容（履歴${result.data.history.length}件）で上書きします。この操作は取り消せません。よろしいですか？`,
      )
    ) {
      return
    }

    replaceHistory(result.data.history)
    saveSettings(result.data.settings)
    setSettings(result.data.settings)
    onChangeTheme(result.data.settings.themeMode)
    setHistoryCleared(false)
    setImportMessage({
      type: 'success',
      text: 'インポートしました。トップ画面に戻ると反映されます。',
    })
  }

  async function handleToggleNotifications() {
    setNotificationBusy(true)
    setNotificationMessage(null)
    try {
      if (!settings.notificationsEnabled) {
        const result = await subscribeToPush()
        if (result.ok) {
          updateSettings({ notificationsEnabled: true })
        } else if (result.reason === 'permission-denied') {
          setNotificationMessage(
            '通知の使用が許可されていません。ブラウザの設定で通知への許可を有効にしてください。',
          )
        } else if (result.reason === 'unsupported') {
          setNotificationMessage('この端末・ブラウザは通知に対応していません。')
        } else {
          setNotificationMessage(
            '通知の設定に失敗しました。時間をおいて再度お試しください。改善しない場合は、パソコン・スマートフォン本体側の通知設定（OSの設定アプリ）でこのブラウザの通知が許可されているかもご確認ください。',
          )
        }
      } else {
        await unsubscribeFromPush()
        updateSettings({ notificationsEnabled: false })
      }
    } finally {
      setNotificationBusy(false)
    }
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

      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
            リマインド通知
          </span>
          <button
            type="button"
            onClick={handleToggleNotifications}
            disabled={notificationBusy || !isPushSupported()}
            className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              settings.notificationsEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {settings.notificationsEnabled ? 'オン' : 'オフ'}
          </button>
        </div>
        {!isPushSupported() && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            この端末・ブラウザは通知に対応していません（iOSはホーム画面に追加したアプリのみ対応しています）。
          </p>
        )}
        {isPushSupported() && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            その日にまだ1回もプレイしていない場合、毎日{NOTIFY_HOUR_LABEL}にリマインドを送ります（送信時刻は前後する場合があります）。
          </p>
        )}
        {notificationMessage && (
          <p
            role="status"
            className="text-xs text-amber-600 dark:text-amber-400"
          >
            {notificationMessage}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          データ
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          学習履歴・実績・設定はこの端末のブラウザ内にのみ保存されています。機種変更やブラウザデータの削除に備えて、定期的にバックアップすることをおすすめします。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ⬇️ バックアップを書き出す
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            ⬆️ バックアップから復元
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        {importMessage && (
          <p
            role="status"
            className={`text-xs ${
              importMessage.type === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {importMessage.text}
          </p>
        )}
        <button
          type="button"
          onClick={handleClearHistory}
          className="touch-manipulation self-start rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/30"
        >
          学習履歴をすべて削除
        </button>
        {historyCleared && (
          <p role="status" className="text-xs text-gray-500 dark:text-gray-400">
            削除しました。トップ画面に戻ると反映されます。
          </p>
        )}
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
