const APP_URL = 'https://gyaku-fukushou-app.vercel.app/'

export interface ShareStats {
  correctCount: number
  total: number
  streakDays: number
  achievementLabels: string[]
}

export interface ShareTemplates {
  resultLine: (correct: number, total: number) => string
  streakLine: (days: number) => string
  achievementsLine: (labels: string[]) => string
}

// 日本語版の文言。i18n辞書（src/lib/i18n/ja.ts）からも同じものを参照する
export const JA_SHARE_TEMPLATES: ShareTemplates = {
  resultLine: (correct, total) =>
    `逆復唱トレーニングで${correct}/${total}問正解しました！`,
  streakLine: (days) => `🔥 ${days}日連続で挑戦中`,
  achievementsLine: (labels) => `🎉 新しい実績: ${labels.join('、')}`,
}

// 結果画面からシェアするテキストを組み立てる（DOM APIに依存しない純関数）。
// templatesを省略すると日本語版になる
export function buildResultShareText(
  stats: ShareStats,
  templates: ShareTemplates = JA_SHARE_TEMPLATES,
): string {
  const lines = [templates.resultLine(stats.correctCount, stats.total)]
  if (stats.streakDays >= 2) {
    lines.push(templates.streakLine(stats.streakDays))
  }
  if (stats.achievementLabels.length > 0) {
    lines.push(templates.achievementsLine(stats.achievementLabels))
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
