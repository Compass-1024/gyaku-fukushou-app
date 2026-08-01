import { getStreakDays, getTodayCount } from '../lib/history'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import type { HistoryEntry, Mode } from '../types'

interface TopScreenProps {
  history: HistoryEntry[]
  onSelect: (mode: Mode) => void
  onOpenSettings: () => void
  onOpenStats: () => void
}

export function TopScreen({
  history,
  onSelect,
  onOpenSettings,
  onOpenStats,
}: TopScreenProps) {
  const streakDays = getStreakDays(history)
  const todayCount = getTodayCount(history)
  const dailyGoal = loadSettings().dailyGoal
  const goalProgress =
    dailyGoal > 0 ? Math.min(100, Math.round((todayCount / dailyGoal) * 100)) : 0

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onOpenStats}
          aria-label="統計"
          className="touch-manipulation rounded-full p-2 text-xl text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
        >
          📊
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="設定"
          className="touch-manipulation rounded-full p-2 text-xl text-gray-500 hover:bg-gray-200/60 dark:text-gray-400 dark:hover:bg-gray-700/60"
        >
          ⚙️
        </button>
      </div>

      <div className="-mt-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          ワーキングメモリトレーニング
        </h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          聞いたり見たりしたものを、逆から答えて脳を鍛えましょう
        </p>
        {history.length > 0 && (
          <div className="mt-3 flex justify-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
            {streakDays > 0 && <span>🔥 {streakDays}日連続</span>}
            {todayCount > 0 && <span>今日 {todayCount}回挑戦</span>}
          </div>
        )}

        {dailyGoal > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              今日の目標: {todayCount} / {dailyGoal} セット
            </p>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('word')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-6 py-6 text-left text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <span className="text-4xl">🗣️</span>
          <p className="mt-2 text-xl font-bold">ことばモード</p>
          <p className="mt-1 text-sm opacity-90">
            言葉を聞いて、逆から声に出して答えるワーキングメモリトレーニングです。
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('digit')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-6 text-left text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <span className="text-4xl">🔢</span>
          <p className="mt-2 text-xl font-bold">すうじモード</p>
          <p className="mt-1 text-sm opacity-90">
            表示された数字を逆の順番で入力するワーキングメモリトレーニングです。
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (loadSettings().soundEnabled) playButtonTap()
            onSelect('nback')
          }}
          className="touch-manipulation rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 px-6 py-6 text-left text-white shadow-lg shadow-rose-500/20 transition hover:scale-[1.02] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          <span className="text-4xl">🧠</span>
          <p className="mt-2 text-xl font-bold">Nバックモード</p>
          <p className="mt-1 text-sm opacity-90">
            N個前と同じ数字が出たら反応する、科学的根拠のあるワーキングメモリトレーニングです。
          </p>
        </button>
      </div>
    </div>
  )
}
