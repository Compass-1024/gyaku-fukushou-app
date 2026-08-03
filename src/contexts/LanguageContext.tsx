import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { TRANSLATIONS, type Translations } from '../lib/i18n'
import type { Language } from '../types'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    () => loadSettings().language,
  )

  // アクセシビリティ/SEOのため、切り替えのたびに<html lang>も更新する
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    saveSettings({ ...loadSettings(), language: next })
  }, [])

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: TRANSLATIONS[language] }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

function useLanguageContext(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage/useTranslation must be used within LanguageProvider')
  }
  return ctx
}

export function useLanguage() {
  const { language, setLanguage } = useLanguageContext()
  return { language, setLanguage }
}

export function useTranslation(): Translations {
  return useLanguageContext().t
}
