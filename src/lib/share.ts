const APP_URL = 'https://gyaku-fukushou-app.vercel.app/'

export interface ShareStats {
  correctCount: number
  total: number
  streakDays: number
  achievementLabels: string[]
}

// 結果画面からシェアするテキストを組み立てる（DOM APIに依存しない純関数）
export function buildResultShareText(stats: ShareStats): string {
  const lines = [
    `逆復唱トレーニングで${stats.correctCount}/${stats.total}問正解しました！`,
  ]
  if (stats.streakDays >= 2) {
    lines.push(`🔥 ${stats.streakDays}日連続で挑戦中`)
  }
  if (stats.achievementLabels.length > 0) {
    lines.push(`🎉 新しい実績: ${stats.achievementLabels.join('、')}`)
  }
  lines.push(APP_URL)
  return lines.join('\n')
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unsupported'

// navigator.share（対応環境）を優先し、非対応またはクリップボード権限がない
// 場合はクリップボードへのコピーにフォールバックする
export async function shareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // navigator.shareが別の理由で失敗した場合はクリップボードにフォールバックする
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'unsupported'
    }
  }
  return 'unsupported'
}
