import { useEffect, useState } from 'react'
import {
  getDeferredInstallEvent,
  isIosDevice,
  isStandaloneDisplay,
  subscribeInstallPrompt,
  triggerInstallPrompt,
} from '../lib/installPrompt'

export interface UseInstallPromptResult {
  // Android/ChromeOS/デスクトップ等、ブラウザ標準のインストールプロンプトを
  // 呼び出せる状態か
  canInstall: boolean
  // iOS Safariは`beforeinstallprompt`に対応しないため、代わりに
  // 「共有→ホーム画面に追加」の手順を案内する対象かどうか
  isIosInstallable: boolean
  promptInstall: () => Promise<void>
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [hasDeferredEvent, setHasDeferredEvent] = useState(
    () => getDeferredInstallEvent() !== null,
  )

  useEffect(
    () =>
      subscribeInstallPrompt(() => setHasDeferredEvent(getDeferredInstallEvent() !== null)),
    [],
  )

  const standalone = isStandaloneDisplay()

  return {
    canInstall: hasDeferredEvent && !standalone,
    isIosInstallable: isIosDevice() && !standalone && !hasDeferredEvent,
    promptInstall: async () => {
      await triggerInstallPrompt()
    },
  }
}
