import { useCallback, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'

// ④-6: themeMode/bgmEnabledと同じread-modify-writeパターン。画面遷移を
// またいでApp.tsxが1回だけこのフックを使い、ゲーム画面かどうかの判定と
// あわせて背景装飾の表示/非表示を切り替える
export function useFocusMode() {
  const [focusModeEnabled, setFocusModeEnabledState] = useState(
    () => loadSettings().focusModeEnabled,
  )

  const setFocusModeEnabled = useCallback((enabled: boolean) => {
    setFocusModeEnabledState(enabled)
    saveSettings({ ...loadSettings(), focusModeEnabled: enabled })
  }, [])

  return { focusModeEnabled, setFocusModeEnabled }
}
