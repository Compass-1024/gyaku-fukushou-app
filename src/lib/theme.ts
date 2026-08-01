import type { ThemeMode } from '../types'

export function resolveIsDark(
  mode: ThemeMode,
  systemPrefersDark: boolean,
): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return systemPrefersDark
}
