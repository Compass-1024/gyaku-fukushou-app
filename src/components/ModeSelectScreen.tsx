import { getAllBenchmarks } from '../lib/benchmarks'
import type { Benchmark } from '../lib/benchmarks'
import { getModeCards } from '../lib/modeCardsConfig'
import type { TopModeSelection } from '../lib/modeCardsConfig'
import { loadSettings } from '../lib/settings'
import { playButtonTap } from '../lib/sound'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import type { HistoryEntry } from '../types'

// ベンチマークのモードキーとホームカードの選択キーの対応
// （すうじの逆から入力のみキーが異なる: 'digit' → 'digit-reverse'）
const BENCHMARK_MODE_TO_CARD_MODE: Record<Benchmark['mode'], TopModeSelection> = {
  digit: 'digit-reverse',
  'digit-sum': 'digit-sum',
  spatial: 'spatial',
  nback: 'nback',
  pattern: 'pattern',
  'dual-nback': 'dual-nback',
  random: 'random',
  word: 'word',
  tone: 'tone',
}

interface ModeSelectScreenProps {
  history: HistoryEntry[]
  onSelect: (mode: TopModeSelection) => void
  onBack: () => void
}

// ホーム画面の「個別選択モード」ボタンから入る、9モードカードグリッド。
// 旧TopScreen.tsxの3×3グリッドをそのまま切り出したもの（ランダムモードは
// ホーム画面に専用ボタンがあるため、ここでは対象外にする）
export function ModeSelectScreen({ history, onSelect, onBack }: ModeSelectScreenProps) {
  const t = useTranslation()
  const { language } = useLanguage()

  const modeCards = getModeCards(t).filter(
    (card) => card.mode !== 'random' && (card.mode !== 'word' || language === 'ja'),
  )

  // 「ワーキングメモリの伸び」で正答率が向上中（band: 'above'）のモードには、
  // 統計画面を開かなくても気づけるようホームカードに🌱バッジを表示する
  const growingCardModes = new Set(
    getAllBenchmarks(history)
      .filter((b) => b.band === 'above')
      .map((b) => BENCHMARK_MODE_TO_CARD_MODE[b.mode]),
  )

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        {t.common.backToHome}
      </button>

      <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t.top.modeSelectTitle}
      </h1>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {modeCards.map((card) => (
          <button
            key={card.mode}
            type="button"
            onClick={() => {
              if (loadSettings().soundEnabled) playButtonTap()
              onSelect(card.mode)
            }}
            aria-label={
              growingCardModes.has(card.mode)
                ? `${card.title}: ${card.description} (${t.top.growingBadgeLabel})`
                : `${card.title}: ${card.description}`
            }
            className={`relative touch-manipulation flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br ${card.gradient} p-2 text-center text-white shadow-md ring-1 ring-white/10 transition hover:scale-[1.04] hover:shadow-lg active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:p-3`}
          >
            {growingCardModes.has(card.mode) && (
              <span
                aria-hidden="true"
                title={t.top.growingBadgeLabel}
                className="absolute top-1 right-1 text-xs drop-shadow"
              >
                🌱
              </span>
            )}
            <span className="text-2xl sm:text-3xl" aria-hidden="true">
              {card.icon}
            </span>
            <span className="text-[11px] leading-tight font-bold sm:text-xs">
              {card.title}
            </span>
            <span className="line-clamp-1 w-full text-[9px] leading-snug opacity-90 sm:text-[10px]">
              {card.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
