import { useEffect, useRef, useState } from 'react'

// activeがtrueの間、totalMsを1秒刻みでカウントダウンし残り秒数(切り上げ)を返す。
// 時間切れになるとonExpireを1回呼び出す。回答フェーズの残り時間表示や
// タイムアウト自動採点など、複数のゲーム画面で共通の仕組みを提供する。
//
// ④-7: pausedをtrueにすると、その時点の残り時間を保持したままカウントダウンを
// 止める（onExpireは呼ばれない）。falseに戻すと保持していた残り時間から
// 再開する。省略時はfalse固定（既存の呼び出し元は挙動が変わらない）。
export function useCountdown(
  active: boolean,
  totalMs: number,
  onExpire: () => void,
  paused: boolean = false,
): number {
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  // 一時停止中も含め、現時点で残っているミリ秒数を保持する「真実の情報源」。
  // 表示用のremainingSecondsとは別に持つことで、一時停止→再開のたびに
  // 満タンへリセットされてしまうのを防ぐ
  const remainingMsRef = useRef(totalMs)

  // フェーズが新しく始まったとき（activeがtrueになった、または出題が
  // 変わってtotalMsが変わった）だけ残り時間を満タンにリセットする
  useEffect(() => {
    if (!active) return
    remainingMsRef.current = totalMs
    setRemainingSeconds(Math.ceil(totalMs / 1000))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, totalMs])

  useEffect(() => {
    if (!active || paused) return
    const startedAt = Date.now()
    const msAtStart = remainingMsRef.current
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt
      setRemainingSeconds(Math.max(0, Math.ceil((msAtStart - elapsed) / 1000)))
    }, 1000)
    const timeout = setTimeout(() => {
      remainingMsRef.current = 0
      onExpire()
    }, msAtStart)
    return () => {
      // 一時停止・アンマウント等でこの区間が終わるとき、経過分を差し引いた
      // 残り時間を保存しておく（一時停止中の表示凍結・再開時の起点になる）
      remainingMsRef.current = Math.max(0, msAtStart - (Date.now() - startedAt))
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // onExpireは呼び出し側で毎レンダー再生成されるため、その変化では
    // タイマーを張り直さない(intervalの秒表示が瞬断されるのを防ぐ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, totalMs])

  return remainingSeconds
}
