import { useTranslation } from '../contexts/LanguageContext'

interface PauseOverlayProps {
  onResume: () => void
}

// ④-7: 回答フェーズ中に一時停止すると、入力UIの代わりにこれを表示する。
// 「showing」フェーズ（出題の記憶中）は一時停止を許可しないため、この
// コンポーネントはanswering中のみ使われる
export function PauseOverlay({ onResume }: PauseOverlayProps) {
  const t = useTranslation()
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {t.common.pausedMessage}
      </p>
      <button
        type="button"
        onClick={onResume}
        className="touch-manipulation rounded-lg bg-indigo-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
      >
        {t.common.resumeButton}
      </button>
    </div>
  )
}
