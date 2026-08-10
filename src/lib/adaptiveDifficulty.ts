import type { Level } from '../types'

// ④-2: すうじ/空間/変化検出/音・色モードへのアダプティブ難易度拡張。
// Nバック系（generateNBackSequence等）は1セット内に多数の試行があるため
// 直近3試行の正誤ウィンドウで段階的にN値を昇降させる「階段法」を使えるが、
// これら4モードは1セット3問しかなく、ウィンドウ判定を待つ余地が無い。
// そのため、問題ごとに正解ならレベル+1・不正解ならレベル-1する
// シンプルな即時ステップ調整にしている（Level=1〜3の範囲でクランプ）
export function nextAdaptiveLevel(currentLevel: Level, correct: boolean): Level {
  if (correct) return Math.min(3, currentLevel + 1) as Level
  return Math.max(1, currentLevel - 1) as Level
}
