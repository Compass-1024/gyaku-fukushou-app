import { useMemo, useState } from 'react'
import { getWeakestBucket, loadBucketStats } from '../lib/questionWeighting'
import { useTranslation } from '../contexts/LanguageContext'
import type { AreaStats } from '../lib/history'

interface StatsAreaAccuracySectionProps {
  areaGroups: [string, AreaStats[]][]
  weakestKeys: Set<string>
}

function areaKey(area: AreaStats): string {
  return area.gameType ? `${area.mode}-${area.gameType}` : area.mode
}

// ④-3: 出題重み付け(questionWeighting.ts)が内部で蓄積しているバケット統計
// （数字の重複有無・マス移動の隣接有無など）を、ユーザー自身への「誤答傾向」
// フィードバックとして二次利用する。この4モードのみ`questionStats:<mode>`を
// 持つ（ことばモードはphraseStats.ts、他モードは重み付け対象外のため無し）。
// digit-reverse/digit-sumは出題ロジック上同じ'digit'ストアを共有する
const GROUP_TO_QUESTION_STATS_MODE: Record<string, string> = {
  'digit-reverse': 'digit',
  'digit-sum': 'digit',
  spatial: 'spatial',
  pattern: 'pattern',
  tone: 'tone',
}

export function StatsAreaAccuracySection({
  areaGroups,
  weakestKeys,
}: StatsAreaAccuracySectionProps) {
  const t = useTranslation()
  // モード数が多く縦に長くなるため、常時全件表示せずプルダウンで選んだ
  // 1モード分だけを表示する形に格納する
  const [selectedGroupKey, setSelectedGroupKey] = useState(
    () => areaGroups[0]?.[0] ?? '',
  )

  const weaknessByGroup = useMemo(() => {
    const result = new Map<string, ReturnType<typeof getWeakestBucket>>()
    for (const [groupKey] of areaGroups) {
      const statsMode = GROUP_TO_QUESTION_STATS_MODE[groupKey]
      if (!statsMode) continue
      result.set(groupKey, getWeakestBucket(loadBucketStats(statsMode)))
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaGroups])

  const selected = areaGroups.find(([groupKey]) => groupKey === selectedGroupKey)

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.areaAccuracyTitle}
      </h2>
      <select
        value={selectedGroupKey}
        onChange={(e) => setSelectedGroupKey(e.target.value)}
        className="touch-manipulation rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        {areaGroups.map(([groupKey]) => (
          <option key={groupKey} value={groupKey}>
            {t.common.areaLabels[groupKey as keyof typeof t.common.areaLabels]}
          </option>
        ))}
      </select>
      {selected &&
        (() => {
          const [groupKey, levels] = selected
          const label =
            t.common.areaLabels[groupKey as keyof typeof t.common.areaLabels]
          const weakness = weaknessByGroup.get(groupKey)
          const weaknessLabel = weakness
            ? t.stats.bucketWeaknessLabels[
                `${GROUP_TO_QUESTION_STATS_MODE[groupKey]}:${weakness.bucket}`
              ]
            : undefined
          return (
            <div className="flex flex-col gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-700 dark:text-gray-200">{label}</span>
                <span className="flex gap-1.5">
                  {levels.map((area) => {
                    const isWeak = weakestKeys.has(`${areaKey(area)}-${area.level}`)
                    return (
                      <span
                        key={area.level}
                        title={t.stats.areaLabel(label, area.level)}
                        className={`min-w-12 rounded-md px-1.5 py-1 text-center text-xs font-medium ${
                          isWeak
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : area.stats.accuracy !== null
                              ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        <span className="block leading-tight">Lv{area.level}</span>
                        <span className="block leading-tight">
                          {area.stats.accuracy !== null ? `${area.stats.accuracy}%` : '−'}
                        </span>
                      </span>
                    )
                  })}
                </span>
              </div>
              {weakness && weaknessLabel && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t.stats.bucketWeaknessSummary(weaknessLabel, weakness.accuracyPercent)}
                </p>
              )}
            </div>
          )
        })()}
    </section>
  )
}
