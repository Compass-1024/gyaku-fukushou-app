// サロゲートペア等を考慮し、文字（コードポイント）単位で反転する
export function reverseText(text: string): string {
  return Array.from(text).reverse().join('')
}
