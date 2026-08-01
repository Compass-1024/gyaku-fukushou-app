interface NumpadInputProps {
  value: string
  maxLength: number
  onDigit: (digit: string) => void
  onBackspace: () => void
  onSubmit: () => void
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
]

export function NumpadInput({
  value,
  maxLength,
  onDigit,
  onBackspace,
  onSubmit,
}: NumpadInputProps) {
  function handleDigit(d: string) {
    if (value.length >= maxLength) return
    onDigit(d)
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      <div className="min-h-12 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-center text-2xl font-bold tracking-widest text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
        {value || ' '}
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        {DIGIT_ROWS.flat().map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="touch-manipulation rounded-lg bg-gray-100 py-3 text-xl font-semibold text-gray-800 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={onBackspace}
          className="touch-manipulation rounded-lg bg-gray-200 py-3 text-lg font-semibold text-gray-700 transition hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="touch-manipulation rounded-lg bg-gray-100 py-3 text-xl font-semibold text-gray-800 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          0
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={value.length === 0}
          className="touch-manipulation rounded-lg bg-indigo-500 py-3 text-lg font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          決定
        </button>
      </div>
    </div>
  )
}
