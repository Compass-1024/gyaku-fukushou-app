import { useEffect, useRef } from 'react'

// Android実装(TWA)を見据えた対応。長時間モード(Nバック30問等)の途中で
// 端末が自動スリープすると、タイムアウト側に不利益が偏ってしまう。
// Wake Lock API（非対応ブラウザでは単に無効化されるだけで害はない）で
// ゲーム画面表示中のみ画面消灯を防ぐ。App.tsxがBGMダッキング・集中モードと
// 同じ「-gameスクリーン表示中かどうか」の判定を使って呼び出す
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let cancelled = false

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
      } catch {
        /* 権限拒否・非対応・タブ非表示中など。Wake Lockは無くても機能に支障はない */
      }
    }

    // タブがバックグラウンドから復帰した際、Wake Lockは自動解放されているため
    // 再取得する（Wake Lock APIの仕様上の既定動作）
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [active])
}
