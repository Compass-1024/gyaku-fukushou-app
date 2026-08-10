// Android実装(TWA)を見据えたハプティックフィードバック。navigator.vibrate()は
// TWA（実Chrome）上でもそのまま動作し、音を出しにくい環境でもネイティブアプリ
// らしい即時フィードバックが得られる。非対応環境（iOS Safari等）では
// navigator.vibrateが存在しないため何もしない（例外を投げない）

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return
  }
  try {
    navigator.vibrate(pattern)
  } catch {
    /* 一部ブラウザはユーザー操作起因でない呼び出しを拒否することがある */
  }
}

// 正解: 短い単発振動
export function playCorrectHaptic(): void {
  vibrate(30)
}

// 不正解: 短い二連続振動（誤りだとわかりやすいよう区別する）
export function playIncorrectHaptic(): void {
  vibrate([30, 60, 30])
}

// 実績解除・レベルアップ等の達成イベント用の長めの振動
export function playAchievementHaptic(): void {
  vibrate([20, 40, 20, 40, 60])
}
