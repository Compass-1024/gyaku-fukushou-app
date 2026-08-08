import { findPhraseById } from '../lib/phrases'
import { useTranslation } from '../contexts/LanguageContext'
import type { WeakPhraseEntry } from '../lib/phraseStats'

interface StatsWeakPhrasesSectionProps {
  weakPhrases: WeakPhraseEntry[]
}

export function StatsWeakPhrasesSection({
  weakPhrases,
}: StatsWeakPhrasesSectionProps) {
  const t = useTranslation()
  if (weakPhrases.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
        {t.stats.weakPhrasesTitle}
      </h2>
      <ul className="flex flex-col gap-2">
        {weakPhrases.map((wp) => {
          const phrase = findPhraseById(wp.phraseId)
          if (!phrase) return null
          return (
            <li
              key={wp.phraseId}
              className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-900/30"
            >
              <span className="text-gray-700 dark:text-gray-200">{phrase.text}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {t.stats.weakPhraseStat(wp.accuracyPercent, wp.total, wp.correct)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
