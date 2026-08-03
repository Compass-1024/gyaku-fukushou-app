import { useTranslation } from '../contexts/LanguageContext'
import type { DigitGameType } from '../types'

interface DigitTypeSelectProps {
  onSelect: (gameType: DigitGameType) => void
  onBack: () => void
}

export function DigitTypeSelect({ onSelect, onBack }: DigitTypeSelectProps) {
  const t = useTranslation()
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="-m-2 touch-manipulation self-start p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        {t.common.backToModeSelect}
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t.digit.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t.digit.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => onSelect('reverse')}
          className="flex touch-manipulation flex-col items-start gap-1 rounded-xl bg-amber-500 px-5 py-4 text-left text-white shadow-sm transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          <span className="text-lg font-semibold">
            {t.digit.gameTypes.reverse.title}
          </span>
          <span className="text-sm opacity-90">
            {t.digit.gameTypes.reverse.description}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelect('sum')}
          className="flex touch-manipulation flex-col items-start gap-1 rounded-xl bg-rose-500 px-5 py-4 text-left text-white shadow-sm transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          <span className="text-lg font-semibold">
            {t.digit.gameTypes.sum.title}
          </span>
          <span className="text-sm opacity-90">
            {t.digit.gameTypes.sum.description}
          </span>
        </button>
      </div>
    </div>
  )
}
