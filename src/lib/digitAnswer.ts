// すうじモード・順唱モード共通の数字文字列比較ロジック。
// 先頭が0の期待値に対し、入力側で先頭の0を打たないのは自然な入力なので、
// 比較時のみ0埋めして「325」と「0325」のような入力を正解として扱う
export function isDigitStringMatch(typed: string, expectedAnswer: string): boolean {
  if (typed.length === 0) return false
  return typed.padStart(expectedAnswer.length, '0') === expectedAnswer
}

// すうじ/順唱モードの出題重み付け（questionWeighting.ts）で使う系列パターンの
// 粗い分類。同じ数字が2回以上出現するかどうかで2分割する（数字の重複は
// 記憶時の混同・干渉が起きやすく、難易度に影響しうる特徴のため）
export function classifyDigitPattern(digits: number[]): string {
  return new Set(digits).size !== digits.length ? 'repeat' : 'unique'
}
