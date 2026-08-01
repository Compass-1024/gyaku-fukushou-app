// カタカナ→ひらがな変換（音声認識の結果はカタカナで返ることがあるため）
function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  )
}

// 比較用に、空白・句読点を除去し、カタカナをひらがなに揃える
export function normalizeForCompare(text: string): string {
  const noPunctuation = text.replace(
    /[\s　、。！？「」・,.!?]/g,
    '',
  )
  return katakanaToHiragana(noPunctuation)
}

// 文字単位の編集距離（レーベンシュタイン距離）
function levenshteinDistance(a: string, b: string): number {
  const aChars = Array.from(a)
  const bChars = Array.from(b)
  const rows = aChars.length + 1
  const cols = bChars.length + 1
  const dp: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i][j] =
        aChars[i - 1] === bChars[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[rows - 1][cols - 1]
}

// 音声認識の聞き間違いを許容するため、完全一致ではなく編集距離での近似一致を判定する
export function isCloseMatch(a: string, b: string, maxDistance: number): boolean {
  return (
    levenshteinDistance(normalizeForCompare(a), normalizeForCompare(b)) <=
    maxDistance
  )
}

// 認識結果の候補（複数）のうち、期待する答えに近いものを1つ返す
export function findMatchingAlternative(
  alternatives: string[],
  expectedAnswer: string,
  tolerance: number,
): string | undefined {
  return alternatives.find(
    (alt) => alt.length > 0 && isCloseMatch(alt, expectedAnswer, tolerance),
  )
}
