import { useCallback, useEffect, useState } from 'react'
import { loadSettings, saveSettings } from '../lib/settings'
import { startBgm, stopBgm, applyBgmVolume, setBgmDucked } from '../lib/bgm'

// BGMの有効/音量設定をApp.tsxのトップレベルで保持し、再生・停止・音量反映を行う。
// themeMode（useThemeMode）と同じread-modify-writeパターン。App.tsxで1回だけ
// 使うことで、画面遷移をまたいで再生を継続する（ブラウザの自動再生ポリシー上、
// 実際に鳴り始めるのは最初のユーザー操作後）
export function useBackgroundMusic() {
  const [bgmEnabled, setBgmEnabledState] = useState(
    () => loadSettings().bgmEnabled,
  )
  const [bgmVolume, setBgmVolumeState] = useState(() => loadSettings().bgmVolume)

  useEffect(() => {
    if (bgmEnabled) startBgm()
    else stopBgm()
  }, [bgmEnabled])

  useEffect(() => {
    applyBgmVolume()
  }, [bgmVolume])

  const setBgmEnabled = useCallback((enabled: boolean) => {
    setBgmEnabledState(enabled)
    saveSettings({ ...loadSettings(), bgmEnabled: enabled })
  }, [])

  const setBgmVolume = useCallback((volume: number) => {
    setBgmVolumeState(volume)
    saveSettings({ ...loadSettings(), bgmVolume: volume })
  }, [])

  // 問題を解いている間（ゲーム画面表示中）はBGMを一時的に無音化し、
  // 集中を妨げないようにする。レベル選択・結果画面・トップ画面では鳴らす
  const setGameplayActive = useCallback((active: boolean) => {
    setBgmDucked(active)
  }, [])

  return { bgmEnabled, bgmVolume, setBgmEnabled, setBgmVolume, setGameplayActive }
}
