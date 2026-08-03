// 翻訳キーの型定義。ja.ts/en.tsの両方がこの型を満たすことを
// TypeScriptの型チェック（tsc -b、npm run build/verifyに含まれる）で
// 保証する。値は固定文字列のほか、埋め込みが必要なものは関数にする。
export interface Translations {
  common: {
    back: string
    loading: string
    stats: string
    settings: string
    privacyPolicy: string
  }
}
