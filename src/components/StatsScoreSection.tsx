import { useTranslation } from '../contexts/LanguageContext'
import type { CategoryScoreResult, TrainingScores } from '../lib/trainingScore'
import type { Translations } from '../lib/i18n'

interface StatsScoreSectionProps {
  scores: TrainingScores
}

function ScoreCard({
  t,
  label,
  result,
  emphasized,
}: {
  t: Translations
  label: string
  result: CategoryScoreResult
  emphasized?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-3 text-center ${
        emphasized
          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <p className="truncate text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
      {result.score === null ? (
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {t.stats.scoreNotAttempted}
        </p>
      ) : (
        <>
          <p
            className={`mt-0.5 font-bold text-gray-900 dark:text-gray-100 ${
              emphasized ? 'text-2xl' : 'text-lg'
            }`}
          >
            {t.stats.scoreValue(result.score)}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            {result.delta === null
              ? t.stats.scoreNoComparisonYet
              : result.delta > 0
                ? t.stats.scoreDeltaUp(result.delta)
                : result.delta < 0
                  ? t.stats.scoreDeltaDown(result.delta)
                  : t.stats.scoreDeltaFlat}
          </p>
        </>
      )}
    </div>
  )
}

// 統計画面のシンプル化: 個別モードの日別/時系列グラフや9エリアのベンチマーク
// グリッドの代わりに、総合トレーニングスコア＋3カテゴリ（数字記憶/空間記憶/
// 注意制御）の数値だけを見せる。グラフは使わず、直近と以前の比較は
// 「前回比 +5pt」のような一言のテキストで示す
export function StatsScoreSection({ scores }: StatsScoreSectionProps) {
  const t = useTranslation()

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.scoreTitle}
      </h2>
      <ScoreCard
        t={t}
        label={t.stats.scoreCategoryLabels.overall}
        result={scores.overall}
        emphasized
      />
      <div className="grid grid-cols-3 gap-2">
        <ScoreCard t={t} label={t.stats.scoreCategoryLabels.numeric} result={scores.numeric} />
        <ScoreCard t={t} label={t.stats.scoreCategoryLabels.spatial} result={scores.spatial} />
        <ScoreCard
          t={t}
          label={t.stats.scoreCategoryLabels.attention}
          result={scores.attention}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t.stats.scoreDisclaimer}</p>
    </section>
  )
}
