import { useEffect, useState } from 'react'

// Android実装(TWA)を見据えた対応。Service Workerによりオフラインでも
// アプリ自体は起動できるが、その旨のフィードバックが無いとユーザーが
// 「壊れている」と誤解しかねない。navigator.onLineとonline/offline
// イベントを監視するだけの軽量なフック（学習履歴はlocalStorageのため
// オフラインでも記録・閲覧に支障はない）
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
