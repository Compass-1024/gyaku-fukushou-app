import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { markInstallBannerDismissed } from '../lib/installPrompt'
import { useTranslation } from '../contexts/LanguageContext'

export function InstallPromptBanner() {
  const t = useTranslation()
  const { canInstall, isIosInstallable, promptInstall } = useInstallPrompt()
  const [dismissedNow, setDismissedNow] = useState(false)

  if (dismissedNow || (!canInstall && !isIosInstallable)) return null

  function handleDismiss() {
    markInstallBannerDismissed()
    setDismissedNow(true)
  }

  return (
    <div className="animate-pop relative rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t.installBanner.dismiss}
        className="absolute top-2 right-2 touch-manipulation rounded-full p-1 text-emerald-500 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
      >
        ✕
      </button>
      <p className="pr-6 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        {t.installBanner.title}
      </p>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
        {canInstall ? t.installBanner.body : t.installBanner.iosBody}
      </p>
      {canInstall && (
        <button
          type="button"
          onClick={async () => {
            await promptInstall()
          }}
          className="mt-2 touch-manipulation rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
        >
          {t.installBanner.installButton}
        </button>
      )}
    </div>
  )
}
