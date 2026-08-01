interface GameHeaderProps {
  backLabel: string
  onBack: () => void
  currentIndex: number
  total: number
}

export function GameHeader({
  backLabel,
  onBack,
  currentIndex,
  total,
}: GameHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="-m-2 touch-manipulation p-2 text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          {backLabel}
        </button>
        <div aria-hidden="true" className="flex gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i < currentIndex
                  ? 'bg-indigo-500'
                  : i === currentIndex
                    ? 'bg-indigo-300'
                    : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        問題 {currentIndex + 1} / {total}
      </p>
    </>
  )
}
