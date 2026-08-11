import {
  getDailyMissionTarget,
  getDailyMissionProgress,
  isDailyMissionComplete,
  DAILY_MISSION_REQUIRED_SETS,
} from '../lib/dailyMission'
import type { DailyMissionTarget } from '../lib/dailyMission'
import { XP_PER_MISSION } from '../lib/xp'
import { LEVEL_LABELS } from '../lib/phrases'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { Translations } from '../lib/i18n'
import type { HistoryEntry } from '../types'

interface DailyMissionScreenProps {
  history: HistoryEntry[]
  onStart: (target: DailyMissionTarget) => void
  onBack: () => void
}

function areaKeyFor(target: DailyMissionTarget): keyof Translations['common']['areaLabels'] {
  if (target.mode === 'digit') {
    return target.gameType === 'sum' ? 'digit-sum' : 'digit-reverse'
  }
  return target.mode
}

function levelLabelFor(t: Translations, target: DailyMissionTarget): string {
  switch (target.mode) {
    case 'word':
      return LEVEL_LABELS[target.level]
    case 'digit':
      return t.digit.levelLabel(target.level)
    case 'nback':
      return t.nback.levelLabel(target.level)
    case 'dual-nback':
      return t.dualNback.levelLabel(target.level)
    case 'spatial':
      return t.spatial.levelLabel(target.level)
    case 'pattern':
      return t.pattern.levelLabel(target.level)
    case 'tone':
      return t.tone.levelLabel(target.level)
    case 'random':
      return t.random.levelLabel(target.level)
  }
}

// ホーム画面の「今日のミッション」ボタンから入る専用画面。過去の正答率から
// 自動選定した弱点モード・レベル（dailyMission.ts）を表示し、そのまま
// ゲーム画面へ直接遷移できる。3セット達成済みならグレーアウト表示にする
export function DailyMissionScreen({ history, onStart, onBack }: DailyMissionScreenProps) {
  const t = useTranslation()
  const { language } = useLanguage()
  const target = getDailyMissionTarget(history, language)
  const progress = getDailyMissionProgress(history, target)
  const completed = isDailyMissionComplete(history, target)
  const areaLabel = t.common.areaLabels[areaKeyFor(target)]
  const levelLabel = levelLabelFor(t, target)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        {t.common.backToHome}
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t.dailyMission.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t.dailyMission.subtitle}
        </p>
      </div>

      <div
        className={`rounded-2xl border px-5 py-8 text-center transition ${
          completed
            ? 'border-gray-200 bg-gray-50 grayscale dark:border-gray-700 dark:bg-gray-800/60'
            : 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
        }`}
      >
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{areaLabel}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{levelLabel}</p>
        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {t.dailyMission.progressLabel(
            Math.min(progress, DAILY_MISSION_REQUIRED_SETS),
            DAILY_MISSION_REQUIRED_SETS,
          )}
        </p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {t.dailyMission.xpReward(XP_PER_MISSION)}
        </p>

        {completed ? (
          <p className="mt-5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t.dailyMission.completedLabel}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => onStart(target)}
            className="mt-5 touch-manipulation rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            {t.dailyMission.startButton}
          </button>
        )}
      </div>
    </div>
  )
}
