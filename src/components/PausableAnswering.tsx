import type { ReactNode } from 'react'
import { PauseOverlay } from './PauseOverlay'
import { useTranslation } from '../contexts/LanguageContext'

interface PausableAnsweringProps {
  paused: boolean
  onPause: () => void
  onResume: () => void
  prompt: string
  remainingSeconds: number
  children?: ReactNode
}

// ③-3: 回答フェーズの「指示文＋一時停止ボタン＋残り時間」ヘッダーと、
// 一時停止中のオーバーレイ切り替えを1箇所にまとめる。Digit/Spatial/Pattern/
// Tone/Randomの5画面でほぼ同一のJSXがコピーされていたのを共通化した
export function PausableAnswering({
  paused,
  onPause,
  onResume,
  prompt,
  remainingSeconds,
  children,
}: PausableAnsweringProps) {
  const t = useTranslation()

  if (paused) return <PauseOverlay onResume={onResume} />

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <span className="w-14" aria-hidden="true" />
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">{prompt}</p>
        <button
          type="button"
          onClick={onPause}
          className="touch-manipulation rounded-full px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {t.common.pauseButton}
        </button>
      </div>
      <p aria-hidden="true" className="text-2xl font-bold text-rose-500">
        {remainingSeconds}
      </p>
      {children}
    </>
  )
}
