import { useTranslation } from '../contexts/LanguageContext'
import type { Benchmark } from '../lib/benchmarks'
import type { Translations } from '../lib/i18n'

interface StatsBenchmarkSectionProps {
  benchmarks: Benchmark[]
}

function benchmarkCopy(t: Translations, benchmark: Benchmark) {
  return t.benchmarks[benchmark.mode]
}

const BAND_CLASSES: Record<Benchmark['band'], string> = {
  below: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50',
  average:
    'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30',
  above:
    'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/30',
}

const BAND_TEXT_CLASSES: Record<Benchmark['band'], string> = {
  below: 'text-gray-600 dark:text-gray-300',
  average: 'text-emerald-700 dark:text-emerald-300',
  above: 'text-indigo-700 dark:text-indigo-300',
}

const BAND_ARROWS: Record<Benchmark['band'], string> = {
  below: '↓',
  average: '→',
  above: '↑',
}

export function StatsBenchmarkSection({ benchmarks }: StatsBenchmarkSectionProps) {
  const t = useTranslation()
  if (benchmarks.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.benchmarks.title}
      </h2>
      <ul className="grid grid-cols-2 gap-2">
        {benchmarks.map((benchmark) => {
          const copy = benchmarkCopy(t, benchmark)
          return (
            <li
              key={benchmark.mode}
              title={`${t.benchmarks.previousLabel(benchmark.previousValue)} / ${t.benchmarks.recentLabel(benchmark.value)}`}
              className={`rounded-lg border px-3 py-2 text-xs ${BAND_CLASSES[benchmark.band]}`}
            >
              <p className="truncate font-medium text-gray-700 dark:text-gray-200">
                {copy.label}
              </p>
              <p
                className={`mt-0.5 text-sm font-semibold ${BAND_TEXT_CLASSES[benchmark.band]}`}
              >
                {BAND_ARROWS[benchmark.band]} {benchmark.value}%
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {t.benchmarks.bandLabels[benchmark.band]}
              </p>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.benchmarks.disclaimer}
      </p>
    </section>
  )
}
