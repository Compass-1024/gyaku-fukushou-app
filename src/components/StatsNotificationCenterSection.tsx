import { useMemo, useState } from 'react'
import { getCombinedNotificationLog, findMissionDefinition } from '../lib/notifications'
import { ACHIEVEMENTS } from '../lib/achievements'
import { localDateKey } from '../lib/history'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { Translations } from '../lib/i18n'
import type { NotificationEntry } from '../lib/notifications'
import type { HistoryEntry } from '../types'

interface StatsNotificationCenterSectionProps {
  history: HistoryEntry[]
  missionCompletionCount: number
}

const INITIAL_VISIBLE_COUNT = 5

function missionLabelFor(t: Translations, missionId: string): string {
  const mission = findMissionDefinition(missionId)
  if (!mission) return missionId
  if (mission.spec.kind === 'accuracy') {
    return t.missions.accuracyLabel(mission.spec.percent)
  }
  const areaKey = mission.spec.mode === 'digit' ? 'digit-reverse' : mission.spec.mode
  return t.missions.playCountLabel(
    t.common.areaLabels[areaKey as keyof typeof t.common.areaLabels],
    mission.spec.count,
  )
}

function entryText(t: Translations, entry: NotificationEntry): string {
  if (entry.kind === 'achievement') {
    const icon = ACHIEVEMENTS.find((a) => a.id === entry.achievementId)?.icon ?? ''
    return t.stats.notificationAchievementLabel(icon, t.achievements[entry.achievementId].label)
  }
  return t.stats.notificationMissionLabel(missionLabelFor(t, entry.missionId))
}

function entryDateKey(entry: NotificationEntry): string {
  return entry.kind === 'achievement' ? localDateKey(new Date(entry.timestamp)) : entry.dateKey
}

// ④-10: 実績・達成の通知センター。実績・ミッションとも「解除済みフラグ」は
// 保存しない設計のため、いつ解除されたかも履歴から都度再構築する
// （notifications.tsのgetCombinedNotificationLog参照）
export function StatsNotificationCenterSection({
  history,
  missionCompletionCount,
}: StatsNotificationCenterSectionProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const [showAll, setShowAll] = useState(false)

  const log = useMemo(
    () => getCombinedNotificationLog(history, missionCompletionCount),
    [history, missionCompletionCount],
  )
  // 英語版ではことばモード関連の実績を表示しない（実績グリッドと同じ方針）
  const visibleLog = useMemo(
    () =>
      log.filter(
        (e) =>
          language === 'ja' ||
          e.kind !== 'achievement' ||
          !ACHIEVEMENTS.find((a) => a.id === e.achievementId)?.requiresWordMode,
      ),
    [log, language],
  )

  if (visibleLog.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {t.stats.notificationCenterTitle}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.stats.notificationCenterEmpty}
        </p>
      </section>
    )
  }

  const shown = showAll ? visibleLog : visibleLog.slice(0, INITIAL_VISIBLE_COUNT)

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.notificationCenterTitle}
      </h2>
      <ul className="flex flex-col gap-1.5">
        {shown.map((entry, i) => (
          <li
            key={`${entry.kind}-${entry.kind === 'achievement' ? entry.achievementId : entry.missionId}-${i}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <span className="text-gray-700 dark:text-gray-200">{entryText(t, entry)}</span>
            <span className="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
              {entryDateKey(entry)}
            </span>
          </li>
        ))}
      </ul>
      {!showAll && visibleLog.length > INITIAL_VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="touch-manipulation self-start text-xs text-indigo-600 hover:underline dark:text-indigo-300"
        >
          {t.stats.notificationShowMoreButton}
        </button>
      )}
    </section>
  )
}
