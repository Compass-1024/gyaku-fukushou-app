import { useEffect, useState } from 'react'

interface UseStepRevealOptions {
  active: boolean
  itemCount: number
  shownMs: number
  gapMs: number
  onItemShown?: (index: number) => void
  onComplete: () => void
}

// activeの間、itemCount個の項目を「表示→間隔」の順に1つずつ進める。
// 全項目の表示が終わるとonCompleteを呼ぶ。Digit/Spatial/Tone/NBackモードの
// 出題演出（数字・マス・パッドなどを1つずつ順番に表示する）で共通に使う。
export function useStepReveal({
  active,
  itemCount,
  shownMs,
  gapMs,
  onItemShown,
  onComplete,
}: UseStepRevealOptions) {
  // 表示ステップ: 偶数=項目を表示、奇数=項目と項目の間の空白。
  // index/isGapはこの値から導出する
  const [step, setStep] = useState(0)
  const index = Math.floor(step / 2)
  const isGap = step % 2 === 1

  // activeでなくなったら次回のために先頭へ戻す
  useEffect(() => {
    if (!active) setStep(0)
  }, [active])

  useEffect(() => {
    if (!active) return
    if (index >= itemCount) {
      onComplete()
      return
    }
    if (!isGap) onItemShown?.(index)
    const duration = isGap ? gapMs : shownMs
    const timeout = setTimeout(() => setStep((s) => s + 1), duration)
    return () => clearTimeout(timeout)
    // onComplete/onItemShownは呼び出し側で毎レンダー再生成されるため、
    // その変化ではタイマーを張り直さない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, index, isGap, itemCount, shownMs, gapMs])

  return { index, isGap }
}
