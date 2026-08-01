interface ResultBadgeProps {
  correct: boolean
}

export function ResultBadge({ correct }: ResultBadgeProps) {
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
        {correct ? '正解' : '不正解'}
      </p>
    </>
  )
}
