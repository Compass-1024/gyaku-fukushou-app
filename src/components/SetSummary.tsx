import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getStreakDays, getTodayCount, loadHistory } from '../lib/history'
import { buildResultShareText, shareText } from '../lib/share'
import { loadSettings } from '../lib/settings'
import { rollLuckyBonus } from '../lib/luckyBonus'
import { playAchievementUnlock } from '../lib/sound'
import { isInstallBannerDismissed } from '../lib/installPrompt'
import { InstallPromptBanner } from './InstallPromptBanner'
import { useTranslation } from '../contexts/LanguageContext'
import type { Achievement } from '../lib/achievements'

// ④-5: エンゲージメントが高まったタイミング（一定セット数をこなした後）で
// インストール促進バナーを表示する。毎回は出さない
const MIN_TOTAL_SETS_FOR_INSTALL_BANNER = 3

export interface SummaryItem {
  key: string
  label: string
  correct: boolean
}

export interface LevelSuggestion {
  label: string
  onSelect: () => void
}

interface SetSummaryProps {
  items: SummaryItem[]
  onRetry: () => void
  onChangeLevel: () => void
  suggestion?: LevelSuggestion
  newAchievements?: Achievement[]
  isNewBest?: boolean
  xpGained?: number
  leveledUp?: boolean
  newLevel?: number
  // ④-1: アダプティブNバックの到達最大Nなど、モード固有の補足情報を
  // スコア表示のすぐ下に差し込むための任意の拡張ポイント
  children?: ReactNode
}

export function SetSummary({
  items,
  onRetry,
  onChangeLevel,
  suggestion,
  newAchievements,
  isNewBest,
  xpGained,
  leveledUp,
  newLevel,
  children,
}: SetSummaryProps) {
  const t = useTranslation()
  const correctCount = items.filter((item) => item.correct).length
  const [shareStatus, setShareStatus] = useState<
    'idle' | 'shared' | 'copied' | 'error'
  >('idle')

  // 表示のたびにlocalStorageから読み直す（このセット自身の記録がまだ
  // 反映されていないタイミングで最初に描画されても、直後の再描画で正しい値になる）
  const dailyGoal = loadSettings().dailyGoal
  const historySnapshot = loadHistory()
  const todayCount = getTodayCount(historySnapshot)
  const showInstallBanner =
    historySnapshot.length >= MIN_TOTAL_SETS_FOR_INSTALL_BANNER &&
    !isInstallBannerDismissed()
  const goalProgress =
    dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0
  const goalReached = dailyGoal > 0 && todayCount >= dailyGoal

  // 低確率のサプライズ演出。マウント時に1回だけ判定し、以降の再描画
  // （実績バッジ表示に伴う再レンダー等）では再抽選しない。実績・統計・
  // レベル判定には一切影響しない完全に飾りの演出
  const [isLucky] = useState(() => rollLuckyBonus())
  useEffect(() => {
    if (isLucky && loadSettings().soundEnabled) playAchievementUnlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleShare() {
    const text = buildResultShareText({
      correctCount,
      total: items.length,
      streakDays: getStreakDays(loadHistory()),
      achievementLabels: (newAchievements ?? []).map(
        (a) => `${a.icon} ${t.achievements[a.id].label}`,
      ),
      isNewBest,
    }, t.share)
    const outcome = await shareText(text)
    if (outcome === 'shared') setShareStatus('shared')
    else if (outcome === 'copied') setShareStatus('copied')
    else if (outcome === 'unsupported') setShareStatus('error')
  }

  // 結果画面の最上部に表示される主要アクション（提案があればそれ、
  // なければ「同じレベルでもう一度」）をEnterキーでも実行できるようにする
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter') return
      e.preventDefault()
      if (suggestion) suggestion.onSelect()
      else onRetry()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [suggestion, onRetry])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.setSummary.resultLabel}
        </p>
        <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t.setSummary.scoreLabel(correctCount, items.length)}
        </p>
        {xpGained !== undefined && (
          <p
            className={`mt-1 text-sm font-semibold ${
              xpGained > 0
                ? 'text-indigo-500 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {xpGained > 0 ? t.setSummary.xpGained(xpGained) : t.setSummary.xpGainedZero}
          </p>
        )}
        {children}
        <button
          type="button"
          onClick={handleShare}
          className="mt-2 touch-manipulation text-sm text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t.setSummary.shareButton}
        </button>
        {shareStatus !== 'idle' && (
          <p
            role="status"
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {shareStatus === 'shared' && t.setSummary.shareStatusShared}
            {shareStatus === 'copied' && t.setSummary.shareStatusCopied}
            {shareStatus === 'error' && t.setSummary.shareStatusError}
          </p>
        )}
      </div>

      {isLucky && (
        <div className="animate-pop rounded-lg border border-fuchsia-300 bg-fuchsia-50 px-4 py-3 text-center dark:border-fuchsia-700 dark:bg-fuchsia-900/30">
          <p className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300">
            {t.setSummary.luckyBonus}
          </p>
        </div>
      )}

      {leveledUp && (
        <div className="animate-pop rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-center dark:border-indigo-700 dark:bg-indigo-900/30">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {t.setSummary.levelUp(newLevel ?? 1)}
          </p>
        </div>
      )}

      {isNewBest && (
        <div className="animate-pop rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-center dark:border-sky-700 dark:bg-sky-900/30">
          <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
            {t.setSummary.newBest}
          </p>
        </div>
      )}

      {newAchievements && newAchievements.length > 0 && (
        <div className="animate-pop rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-center dark:border-amber-700 dark:bg-amber-900/30">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {t.setSummary.newAchievementsTitle}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {newAchievements.map((a) => (
              <span
                key={a.id}
                className="rounded-full bg-white px-3 py-1 text-sm text-amber-700 shadow-sm dark:bg-gray-800 dark:text-amber-300"
              >
                {a.icon} {t.achievements[a.id].label}
              </span>
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={item.key}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
              item.correct
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30'
                : 'border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/30'
            }`}
          >
            <span className="text-gray-500 dark:text-gray-400">
              {t.setSummary.questionLabel(i + 1)}
              {item.label}
            </span>
            <span
              className={
                item.correct
                  ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                  : 'font-semibold text-rose-700 dark:text-rose-300'
              }
            >
              {item.correct ? t.common.correct : t.common.incorrect}
            </span>
          </li>
        ))}
      </ul>

      {dailyGoal > 0 && (
        <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.setSummary.dailyGoal(todayCount, dailyGoal)}
          </p>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          {goalReached && (
            <p className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {t.setSummary.dailyGoalReached}
            </p>
          )}
        </div>
      )}

      {showInstallBanner && <InstallPromptBanner />}

      <div className="flex flex-col gap-3">
        {suggestion && (
          <button
            type="button"
            onClick={suggestion.onSelect}
            className="touch-manipulation rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            {suggestion.label}
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
        >
          {t.setSummary.retry}
        </button>
        <button
          type="button"
          onClick={onChangeLevel}
          className="touch-manipulation rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {t.setSummary.changeLevel}
        </button>
      </div>
    </div>
  )
}
