import { useState } from 'react'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import { useTranslation } from '../contexts/LanguageContext'

interface SettingsNotificationSectionProps {
  notificationsEnabled: boolean
  onChange: (enabled: boolean) => void
}

export function SettingsNotificationSection({
  notificationsEnabled,
  onChange,
}: SettingsNotificationSectionProps) {
  const t = useTranslation()
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
          setMessage(t.settings.notifications.permissionDenied)
        } else if (result.reason === 'unsupported') {
          setMessage(t.settings.notifications.unsupportedResult)
        } else {
          setMessage(t.settings.notifications.genericError)
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
          {t.settings.notifications.title}
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
          {notificationsEnabled ? t.settings.on : t.settings.off}
        </button>
      </div>
      {!isPushSupported() && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.settings.notifications.unsupported}
        </p>
      )}
      {isPushSupported() && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.settings.notifications.supportedDescription}
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
