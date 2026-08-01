import { useCallback, useEffect, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { resolveIsDark } from '../lib/theme'
import type { ThemeMode } from '../types'

export function useThemeMode() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    () => loadSettings().themeMode,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme() {
      const isDark = resolveIsDark(themeMode, mediaQuery.matches)
      document.documentElement.classList.toggle('dark', isDark)
    }

    applyTheme()
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [themeMode])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    saveSettings({ ...loadSettings(), themeMode: mode })
  }, [])

  return { themeMode, setThemeMode }
}
