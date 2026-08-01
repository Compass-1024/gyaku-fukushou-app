// サプライズ演出（可変報酬）。実績システムのような「達成すれば必ずもらえる」
// 確定報酬とは別に、低確率で完全にランダムな「ラッキー」演出を挟むことで
// 変化に富んだ動機付けを狙う。実績・統計・レベル判定など、いかなる評価軸にも
// 一切影響しない完全に飾りの演出であり、既存の実績システムの価値を
// 損なわないよう意図的に設計している。

const LUCKY_BONUS_PROBABILITY = 0.12

export function rollLuckyBonus(): boolean {
  return Math.random() < LUCKY_BONUS_PROBABILITY
}
