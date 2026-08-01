import { useEffect, useState } from 'react'

// activeがtrueの間、totalMsを1秒刻みでカウントダウンし残り秒数(切り上げ)を返す。
// 時間切れになるとonExpireを1回呼び出す。回答フェーズの残り時間表示や
// タイムアウト自動採点など、複数のゲーム画面で共通の仕組みを提供する。
export function useCountdown(
  active: boolean,
  totalMs: number,
  onExpire: () => void,
): number {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    if (!active) return
    setRemainingSeconds(Math.ceil(totalMs / 1000))
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    const timeout = setTimeout(onExpire, totalMs)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // onExpireは呼び出し側で毎レンダー再生成されるため、その変化では
    // タイマーを張り直さない(intervalの秒表示が瞬断されるのを防ぐ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, totalMs])

  return remainingSeconds
}
