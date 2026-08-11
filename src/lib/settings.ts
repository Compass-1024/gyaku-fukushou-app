import type { AppSettings } from '../types'

const STORAGE_KEY = 'gyaku-fukushou:settings'

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  language: 'ja',
  speechRate: 0.95,
  voiceURI: null,
  soundEnabled: true,
  sfxVolume: 80,
  bgmEnabled: false,
  bgmVolume: 50,
  dailyGoal: 3,
  notificationsEnabled: false,
  focusModeEnabled: false,
  hapticsEnabled: false,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}
