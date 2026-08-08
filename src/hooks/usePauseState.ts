import { useEffect, useState } from 'react'

export interface UsePauseStateResult {
  paused: boolean
  pause: () => void
  resume: () => void
}

// ④-7: 回答フェーズ限定の一時停止状態。resetKeyが変わるたび（新しい問題が
// 始まる、レベルが変わる等）に自動的に一時停止を解除し、次の問題へ
// 一時停止状態を持ち越さないようにする
export function usePauseState(resetKey: unknown): UsePauseStateResult {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setPaused(false)
  }, [resetKey])

  return {
    paused,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  }
}
