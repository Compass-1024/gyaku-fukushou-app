// ④-10(代替): 初回オンボーディングガイドの表示済みフラグ。
// 「実際に確認した問題」レビューで指摘された「初回アクセス時の分かりやすさ」
// への対策。家族・コーチ向け共有ビュー（大規模なバックエンド拡張が必要）の
// 代わりに、既存の設計方針（バックエンドを持たないSPA）に沿う形で採用した。
const STORAGE_KEY = 'gyaku-fukushou:onboardingSeen'

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true // localStorage利用不可時は毎回表示しないよう既読扱いにする
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* localStorage unavailable (private mode, quota, etc.) */
  }
}
