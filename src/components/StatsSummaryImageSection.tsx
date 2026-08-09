import { useMemo, useRef, useState } from 'react'
import { computeLearningSummary } from '../lib/summaryStats'
import { drawSummaryImage, downloadCanvasAsPng, summaryImageFileName } from '../lib/summaryImage'
import { useTranslation } from '../contexts/LanguageContext'
import type { SummaryPeriod } from '../lib/summaryStats'
import type { HistoryEntry } from '../types'

interface StatsSummaryImageSectionProps {
  history: HistoryEntry[]
}

// ④-4: 週間/月間の学習サマリーをSNSシェア向けの画像として保存できる機能。
// 集計はsummaryStats.ts、描画はsummaryImage.ts（canvas依存のため単体テスト対象外）
export function StatsSummaryImageSection({ history }: StatsSummaryImageSectionProps) {
  const t = useTranslation()
  const [period, setPeriod] = useState<SummaryPeriod>('week')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const summary = useMemo(
    () => computeLearningSummary(history, period),
    [history, period],
  )

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    drawSummaryImage(canvas, summary, t)
    downloadCanvasAsPng(canvas, summaryImageFileName(period))
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.summaryImage.title}
      </h2>
      <div className="flex items-center gap-2">
        <div className="flex gap-1" role="group" aria-label={t.stats.summaryImage.title}>
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`touch-manipulation rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                period === p
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {p === 'week' ? t.stats.summaryImage.periodWeek : t.stats.summaryImage.periodMonth}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={summary.totalSets === 0}
          className="touch-manipulation rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {t.stats.summaryImage.downloadButton}
        </button>
      </div>
      {summary.totalSets === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.stats.summaryImage.noDataMessage}
        </p>
      )}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </section>
  )
}
