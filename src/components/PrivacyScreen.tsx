import { useTranslation } from '../contexts/LanguageContext'

interface PrivacyScreenProps {
  onBack: () => void
}

export function PrivacyScreen({ onBack }: PrivacyScreenProps) {
  const t = useTranslation()
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
        {t.privacy.heading}
      </h1>

      <div className="flex flex-col gap-5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t.privacy.dataLocationTitle}
          </h2>
          <p>{t.privacy.dataLocationBody}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t.privacy.notificationsTitle}
          </h2>
          <p>{t.privacy.notificationsBody}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t.privacy.micTitle}
          </h2>
          <p>{t.privacy.micBody}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t.privacy.cookieTitle}
          </h2>
          <p>{t.privacy.cookieBody}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t.privacy.deletionTitle}
          </h2>
          <p>{t.privacy.deletionBody}</p>
          <p>{t.privacy.backupBody}</p>
        </section>

        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t.privacy.contactTitle}
          </h2>
          <p>{t.privacy.contactBody}</p>
        </section>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t.privacy.summaryNotice}
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="underline">
            {t.privacy.fullPolicyLink}
          </a>
          {t.privacy.fullPolicyLinkSuffix}
        </p>
      </div>
    </div>
  )
}
