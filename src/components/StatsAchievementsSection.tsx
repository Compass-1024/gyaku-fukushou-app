import { useState } from 'react'
import { useTranslation } from '../contexts/LanguageContext'
import type { Achievement, AchievementId } from '../lib/achievements'
import type { HistoryEntry } from '../types'

interface StatsAchievementsSectionProps {
  history: HistoryEntry[]
  achievements: Achievement[]
  unlockedCount: number
  missionCompletionCount: number
}

export function StatsAchievementsSection({
  history,
  achievements,
  unlockedCount,
  missionCompletionCount,
}: StatsAchievementsSectionProps) {
  const t = useTranslation()
  // スマホではホバーできないため、タップした実績の説明をインラインで表示する
  const [selectedAchievementId, setSelectedAchievementId] =
    useState<AchievementId | null>(null)

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {t.stats.achievementsTitle}
        </h2>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t.stats.achievementsCountLabel(unlockedCount, achievements.length)}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
        {achievements.map((achievement) => {
          const unlocked = achievement.isUnlocked(history, missionCompletionCount)
          const copy = t.achievements[achievement.id]
          const isSelected = selectedAchievementId === achievement.id
          return (
            <button
              key={achievement.id}
              type="button"
              title={copy.description}
              aria-expanded={isSelected}
              onClick={() =>
                setSelectedAchievementId(isSelected ? null : achievement.id)
              }
              className={`touch-manipulation flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition ${
                unlocked
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                  : 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800/50'
              } ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
            >
              <span aria-hidden="true" className="text-xl">
                {achievement.icon}
              </span>
              <span className="line-clamp-1 text-[9px] leading-tight font-medium text-gray-700 dark:text-gray-200">
                {copy.label}
              </span>
              <span className="sr-only">
                {unlocked ? t.stats.achievementUnlocked : t.stats.achievementLocked}
                {copy.description}
              </span>
            </button>
          )
        })}
      </div>
      {selectedAchievementId &&
        (() => {
          const selected = achievements.find((a) => a.id === selectedAchievementId)
          if (!selected) return null
          const copy = t.achievements[selected.id]
          const unlocked = selected.isUnlocked(history, missionCompletionCount)
          return (
            <div
              role="status"
              className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                unlocked
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
              }`}
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  <span aria-hidden="true">{selected.icon} </span>
                  {copy.label}
                  <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                    {unlocked ? t.stats.achievementUnlocked : t.stats.achievementLocked}
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {copy.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAchievementId(null)}
                aria-label={t.stats.achievementCloseDetail}
                className="touch-manipulation rounded-full p-1 text-gray-400 hover:bg-gray-200/60 dark:text-gray-500 dark:hover:bg-gray-700/60"
              >
                ✕
              </button>
            </div>
          )
        })()}
    </section>
  )
}
