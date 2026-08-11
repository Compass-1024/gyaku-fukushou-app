import type { LearningSummary } from './summaryStats'
import { summaryDateRangeLabel } from './summaryStats'
import type { Translations } from './i18n/types'

// ④-4: 週間/月間の学習サマリー画像エクスポート。canvas描画部分はブラウザAPI
// (CanvasRenderingContext2D)に依存し、Vitestのnode環境ではJSDOMでも
// getContext('2d')の描画結果を検証できないため、意図的に単体テスト対象外とし
// 「何を表示するか」の集計ロジック（summaryStats.ts）だけを分離してテストする。
// 見た目の検証はE2Eのdownloadイベントで代替する

const WIDTH = 800
const HEIGHT = 800
const ACCENT = '#f59e0b' // amber-500、デイリーチャレンジ・実績解除等と同系統

export function drawSummaryImage(
  canvas: HTMLCanvasElement,
  summary: LearningSummary,
  t: Translations,
): void {
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  bg.addColorStop(0, '#fffbeb')
  bg.addColorStop(1, '#fef3c7')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#78350f'

  // アプリ名
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(t.stats.summaryImage.appTitle, WIDTH / 2, 90)

  // 見出し（週間/月間サマリー）
  ctx.fillStyle = ACCENT
  ctx.font = 'bold 44px sans-serif'
  const periodLabel =
    summary.period === 'week'
      ? t.stats.summaryImage.periodWeek
      : t.stats.summaryImage.periodMonth
  ctx.fillText(`${periodLabel} ${t.stats.heading}`, WIDTH / 2, 160)

  // 期間ラベル
  ctx.fillStyle = '#92400e'
  ctx.font = '24px sans-serif'
  const rangeLabel = summaryDateRangeLabel(new Date(), summary.days)
  ctx.fillText(t.stats.summaryImage.dateRangeLabel(rangeLabel), WIDTH / 2, 210)

  // 指標カード群
  const lines = [
    t.stats.summaryImage.setsLabel(summary.totalSets),
    summary.accuracyPercent === null
      ? t.stats.summaryImage.accuracyNoDataLabel
      : t.stats.summaryImage.accuracyLabel(summary.accuracyPercent),
    t.stats.summaryImage.streakLabel(summary.streakDays),
  ]
  if (summary.topModes.length > 0) {
    const top = summary.topModes[0]
    lines.push(
      t.stats.summaryImage.topModeLabel(t.common.modeLabels[top.mode], top.sets),
    )
  }

  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 30px sans-serif'
  let y = 320
  const lineHeight = 90
  for (const line of lines) {
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, WIDTH / 2 - 300, y - 45, 600, 66, 16)
    ctx.fill()
    ctx.fillStyle = '#1f2937'
    ctx.fillText(line, WIDTH / 2, y)
    y += lineHeight
  }

  // フッター
  ctx.fillStyle = '#b45309'
  ctx.font = '18px sans-serif'
  ctx.fillText('oboetore.vercel.app', WIDTH / 2, HEIGHT - 40)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

export function summaryImageFileName(period: 'week' | 'month', date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `oboetore-summary-${period}-${y}${m}${d}.png`
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, fileName: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
