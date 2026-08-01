import { useEffect } from 'react'
import type { Achievement } from '../lib/achievements'

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
}

export function SetSummary({
  items,
  onRetry,
  onChangeLevel,
  suggestion,
  newAchievements,
  isNewBest,
}: SetSummaryProps) {
  const correctCount = items.filter((item) => item.correct).length

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
        <p className="text-sm text-gray-500 dark:text-gray-400">結果</p>
        <p className="mt-1 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {correctCount} / {items.length} 問正解
        </p>
      </div>

      {isNewBest && (
        <div className="animate-pop rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-center dark:border-sky-700 dark:bg-sky-900/30">
          <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
            🏅 自己ベスト更新！
          </p>
        </div>
      )}

      {newAchievements && newAchievements.length > 0 && (
        <div className="animate-pop rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-center dark:border-amber-700 dark:bg-amber-900/30">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            🎉 新しい実績を獲得しました！
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {newAchievements.map((a) => (
              <span
                key={a.id}
                className="rounded-full bg-white px-3 py-1 text-sm text-amber-700 shadow-sm dark:bg-gray-800 dark:text-amber-300"
              >
                {a.icon} {a.label}
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
              問題{i + 1}: {item.label}
            </span>
            <span
              className={
                item.correct
                  ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                  : 'font-semibold text-rose-700 dark:text-rose-300'
              }
            >
              {item.correct ? '正解' : '不正解'}
            </span>
          </li>
        ))}
      </ul>

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
          同じレベルでもう一度
        </button>
        <button
          type="button"
          onClick={onChangeLevel}
          className="touch-manipulation rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          レベル選択に戻る
        </button>
      </div>
    </div>
  )
}
