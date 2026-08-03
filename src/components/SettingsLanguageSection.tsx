import { useTranslation } from '../contexts/LanguageContext'
import type { Language } from '../types'

interface SettingsLanguageSectionProps {
  language: Language
  onChangeLanguage: (language: Language) => void
}

export function SettingsLanguageSection({
  language,
  onChangeLanguage,
}: SettingsLanguageSectionProps) {
  const t = useTranslation()
  const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
    { value: 'ja', label: t.settings.language.ja },
    { value: 'en', label: t.settings.language.en },
  ]
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.settings.language.title}
      </h2>
      <div className="flex gap-2">
        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChangeLanguage(opt.value)}
            className={`flex-1 touch-manipulation rounded-lg px-3 py-2 text-sm font-semibold transition ${
              language === opt.value
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </section>
  )
}
