import { useState } from 'react'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'

// Vercel Cron（Hobbyプランは1日1回まで）の制約により、送信時刻は
// 全ユーザー共通固定（vercel.jsonの設定で21時ごろJST、最大59分前後する）
const NOTIFY_HOUR_LABEL = '21時ごろ'

interface SettingsNotificationSectionProps {
  notificationsEnabled: boolean
  onChange: (enabled: boolean) => void
}

export function SettingsNotificationSection({
  notificationsEnabled,
  onChange,
}: SettingsNotificationSectionProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleToggle() {
    setBusy(true)
    setMessage(null)
    try {
      if (!notificationsEnabled) {
        const result = await subscribeToPush()
        if (result.ok) {
          onChange(true)
        } else if (result.reason === 'permission-denied') {
          setMessage(
            '通知の使用が許可されていません。ブラウザの設定で通知への許可を有効にしてください。',
          )
        } else if (result.reason === 'unsupported') {
          setMessage('この端末・ブラウザは通知に対応していません。')
        } else {
          setMessage(
            '通知の設定に失敗しました。時間をおいて再度お試しください。改善しない場合は、パソコン・スマートフォン本体側の通知設定（OSの設定アプリ）でこのブラウザの通知が許可されているかもご確認ください。',
          )
        }
      } else {
        await unsubscribeFromPush()
        onChange(false)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          リマインド通知
        </span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || !isPushSupported()}
          className={`touch-manipulation rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            notificationsEnabled
              ? 'bg-emerald-700 text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {notificationsEnabled ? 'オン' : 'オフ'}
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
      {message && (
        <p role="status" className="text-xs text-amber-600 dark:text-amber-400">
          {message}
        </p>
      )}
    </section>
  )
}
