import { useEffect, useRef, useState } from 'react'
import { DIGIT_SHOWN_MS, DIGIT_GAP_MS } from '../lib/digits'
import { JUDGING_TIMEOUT_MS } from '../lib/opsSpan'
import type { OpsSpanTrial } from '../types'

export type OpsSpanTrialSubPhase = 'judging' | 'revealing' | 'gap'

interface UseOpsSpanTrialFlowArgs {
  active: boolean
  trials: OpsSpanTrial[]
  onComplete: (judgedCorrectCount: number) => void
}

interface UseOpsSpanTrialFlowResult {
  trialIndex: number
  subPhase: OpsSpanTrialSubPhase
  judge: (answer: boolean | null) => void
}

// 「処理記憶モード」の1問(=N試行)ぶんの出題演出を進行する。各試行は
// 「暗算の正誤判定(judging)→記憶する数字の表示(revealing)→間隔(gap)」の
// 3ステップで、judgingのみユーザーの応答(タップ、またはタイムアウト)を
// 待つ点がdigit/spatial/tone等が使うuseStepRevealと異なる。個別選択モード・
// ランダムモードの両方から同じ挙動で使えるよう、専用フックとして共通化した
export function useOpsSpanTrialFlow({
  active,
  trials,
  onComplete,
}: UseOpsSpanTrialFlowArgs): UseOpsSpanTrialFlowResult {
  const [trialIndex, setTrialIndex] = useState(0)
  const [subPhase, setSubPhase] = useState<OpsSpanTrialSubPhase>('judging')
  const judgedCorrectRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // activeになるたび（=新しい問題が始まるたび）先頭からやり直す
  useEffect(() => {
    if (!active) return
    setTrialIndex(0)
    setSubPhase('judging')
    judgedCorrectRef.current = 0
  }, [active, trials])

  function judge(answer: boolean | null) {
    const trial = trials[trialIndex]
    if (!trial) return
    if (answer !== null && answer === trial.judgmentCorrect) {
      judgedCorrectRef.current += 1
    }
    setSubPhase('revealing')
  }

  useEffect(() => {
    if (!active) return
    if (subPhase === 'judging') {
      const timeout = setTimeout(() => judge(null), JUDGING_TIMEOUT_MS)
      return () => clearTimeout(timeout)
    }
    if (subPhase === 'revealing') {
      const timeout = setTimeout(() => setSubPhase('gap'), DIGIT_SHOWN_MS)
      return () => clearTimeout(timeout)
    }
    const timeout = setTimeout(() => {
      if (trialIndex + 1 >= trials.length) {
        onCompleteRef.current(judgedCorrectRef.current)
      } else {
        setTrialIndex((i) => i + 1)
        setSubPhase('judging')
      }
    }, DIGIT_GAP_MS)
    return () => clearTimeout(timeout)
    // judge/onCompleteは毎レンダー再生成されるため、その変化ではタイマーを
    // 張り直さない（useStepRevealと同じ方針）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, subPhase, trialIndex, trials])

  return { trialIndex, subPhase, judge }
}
