import { useEffect } from 'react'

// enabledがtrueの間、Enterキー押下でonEnterを実行する。
// 結果表示中に次の問題へ進める操作など、複数のゲーム画面で共通の
// キーボードショートカットを提供するために使う。
export function useEnterKey(enabled: boolean, onEnter: () => void) {
  useEffect(() => {
    if (!enabled) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onEnter()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onEnter])
}
