import { useState } from 'react'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import type { ProgramProgress } from '../lib/program'
import { DailyChallengeCard } from './DailyChallengeCard'
import { XP_PER_MISSION } from '../lib/xp'
import { useTranslation } from '../contexts/LanguageContext'

interface TopEngagementChipsProps {
  missionLabel: string
  missionCompleted: boolean
  missionClickable: boolean
  onMissionClick: () => void
  challengeCompletedToday: boolean
  showProgramCard: boolean
  programProgress: ProgramProgress
}

type ExpandedCard = 'mission' | 'challenge' | 'program' | null

// fix③-6: 「今日のミッション」「本日のお題」「7日間チャレンジ」の
// コンパクトなチップ行＋展開パネルをTopScreen.tsxから切り出したもの。
// 開閉状態(expandedCard)もこのコンポーネントに閉じ込める
export function TopEngagementChips({
  missionLabel,
  missionCompleted,
  missionClickable,
  onMissionClick,
  challengeCompletedToday,
  showProgramCard,
  programProgress,
}: TopEngagementChipsProps) {
  const t = useTranslation()
  // ④-7: 毎回タップする手間を省くため、設定で選んだチップをホーム画面表示時に
  // 自動展開できるようにする。「7日間チャレンジ」は履歴が無いと展開できないため
  // showProgramCardがfalseの場合は自動展開しない
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(() => {
    const preferred = loadSettings().autoExpandChip
    if (preferred === 'none') return null
    if (preferred === 'program' && !showProgramCard) return null
    return preferred
  })

  function toggleExpandedCard(card: Exclude<ExpandedCard, null>) {
    if (loadSettings().soundEnabled) playButtonTap()
    setExpandedCard((current) => (current === card ? null : card))
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => toggleExpandedCard('mission')}
          aria-expanded={expandedCard === 'mission'}
          aria-label={t.missions.cardTitle}
          aria-controls="engagement-panel-mission"
          className={`touch-manipulation flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-center transition ${
            expandedCard === 'mission'
              ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30'
              : missionCompleted
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/60'
          }`}
        >
          <span aria-hidden="true" className="text-base">
            {missionCompleted ? '✅' : '🎯'}
          </span>
          <span className="line-clamp-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
            {t.missions.chipLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleExpandedCard('challenge')}
          aria-expanded={expandedCard === 'challenge'}
          aria-label={t.dailyChallenge.title}
          aria-controls="engagement-panel-challenge"
          className={`touch-manipulation flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-center transition ${
            expandedCard === 'challenge'
              ? 'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/30'
              : challengeCompletedToday
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/60'
          }`}
        >
          <span aria-hidden="true" className="text-base">
            {challengeCompletedToday ? '✅' : '📅'}
          </span>
          <span className="line-clamp-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
            {t.dailyChallenge.chipLabel}
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleExpandedCard('program')}
          aria-expanded={expandedCard === 'program'}
          aria-label={t.program.title}
          aria-controls="engagement-panel-program"
          disabled={!showProgramCard}
          className={`touch-manipulation flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
            expandedCard === 'program'
              ? 'border-fuchsia-400 bg-fuchsia-50 dark:border-fuchsia-500 dark:bg-fuchsia-900/30'
              : 'border-gray-200 bg-white hover:enabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:enabled:bg-gray-700/60'
          }`}
        >
          <span aria-hidden="true" className="text-base">
            🗓️
          </span>
          <span className="line-clamp-1 text-[10px] font-semibold text-gray-700 dark:text-gray-200">
            {showProgramCard
              ? t.program.chipProgress(programProgress.daysPlayed, programProgress.totalDays)
              : t.program.chipLabel}
          </span>
        </button>
      </div>

      {expandedCard === 'mission' && (
        <button
          type="button"
          id="engagement-panel-mission"
          disabled={!missionClickable}
          onClick={onMissionClick}
          className={`animate-pop touch-manipulation rounded-xl border px-4 py-3 text-left transition disabled:cursor-default ${
            missionCompleted
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
              : 'border-gray-200 bg-white hover:enabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:enabled:bg-gray-700/60'
          }`}
        >
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t.missions.cardTitle}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{missionLabel}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {missionCompleted
              ? t.missions.completedBadge
              : t.missions.xpReward(XP_PER_MISSION)}
          </p>
        </button>
      )}

      {expandedCard === 'challenge' && (
        <div id="engagement-panel-challenge">
          <DailyChallengeCard />
        </div>
      )}

      {expandedCard === 'program' && showProgramCard && (
        <div
          id="engagement-panel-program"
          className="animate-pop rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t.program.title}
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
            {t.program.progressLabel(programProgress.daysPlayed, programProgress.totalDays)}
          </p>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-500 transition-all"
              style={{
                width: `${Math.round((programProgress.daysPlayed / programProgress.totalDays) * 100)}%`,
              }}
            />
          </div>
          {programProgress.isComplete && (
            <p className="mt-1.5 text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">
              {t.program.completeMessage}
            </p>
          )}
        </div>
      )}
    </>
  )
}
