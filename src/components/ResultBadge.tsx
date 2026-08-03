import { useTranslation } from '../contexts/LanguageContext'

interface ResultBadgeProps {
  correct: boolean
}

export function ResultBadge({ correct }: ResultBadgeProps) {
  const t = useTranslation()
  return (
    <>
      <span aria-hidden="true" className="animate-pop text-5xl">
        {correct ? '⭕' : '❌'}
      </span>
      <p
        className={`text-2xl font-bold ${
          correct ? 'text-emerald-500' : 'text-rose-500'
        }`}
      >
        {correct ? t.common.correct : t.common.incorrect}
      </p>
    </>
  )
}
