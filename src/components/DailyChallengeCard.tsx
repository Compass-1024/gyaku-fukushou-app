import { useEffect, useState } from 'react'
import {
  getDailyChallengeDigits,
  reverseDigitsToString,
  hasCompletedTodayChallenge,
  recordTodayChallengeCompletion,
  loadDailyChallengeCompletions,
} from '../lib/dailyChallenge'
import { localDateKey } from '../lib/history'
import { isDigitStringMatch } from '../lib/digitAnswer'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { NumpadInput } from './NumpadInput'
import { useTranslation } from '../contexts/LanguageContext'
import type { Level } from '../types'

const SHOWING_MS = 2500

type ChallengePhase = 'idle' | 'showing' | 'answering' | 'result'

// ④-9: 話題性・習慣化のためのデイリーチャレンジ。既存モードの出題ロジック
// (重み付き抽選)には手を入れず、日付シードの決定的な数字列を使う独立した
// ミニチャレンジとしてホーム画面に埋め込む。難易度は開始前のみ選択可能
// （挑戦は1日1回のため、開始後に変えると別問題にすり替わってしまう）
export function DailyChallengeCard() {
  const t = useTranslation()
  const [phase, setPhase] = useState<ChallengePhase>('idle')
  const [difficulty, setDifficulty] = useState<Level>(2)
  const [typed, setTyped] = useState('')
  const [correct, setCorrect] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(() => hasCompletedTodayChallenge())

  const digits = getDailyChallengeDigits(difficulty)
  const expected = reverseDigitsToString(digits)

  useEffect(() => {
    if (phase !== 'showing') return
    const timeout = setTimeout(() => setPhase('answering'), SHOWING_MS)
    return () => clearTimeout(timeout)
  }, [phase])

  function handleStart() {
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped('')
    setPhase('showing')
  }

  function finalize(value: string) {
    const isCorrect = isDigitStringMatch(value, expected)
    setCorrect(isCorrect)
    if (loadSettings().soundEnabled) {
      if (isCorrect) playCorrectSound()
      else playIncorrectSound()
    }
    recordTodayChallengeCompletion(isCorrect)
    setAlreadyDone(true)
    setPhase('result')
  }

  function handleDigit(d: string) {
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => {
      const next = prev.length >= digits.length ? prev : prev + d
      if (next.length === digits.length) finalize(next)
      return next
    })
  }

  function handleBackspace() {
    if (loadSettings().soundEnabled) playButtonTap()
    setTyped((prev) => prev.slice(0, -1))
  }

  function handleSubmit() {
    if (typed.length > 0) finalize(typed)
  }

  const previousResult = loadDailyChallengeCompletions().find(
    (c) => c.dateKey === localDateKey(new Date()),
  )

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
        {t.dailyChallenge.title}
      </p>

      {phase === 'idle' && (
        <>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
            {t.dailyChallenge.description}
          </p>
          {alreadyDone ? (
            <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
              {t.dailyChallenge.completedBadge(previousResult?.correct ?? false)}
            </p>
          ) : (
            <>
              <div className="mt-2 flex gap-1" role="group" aria-label={t.dailyChallenge.difficultyLabel(difficulty)}>
                {([1, 2, 3] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setDifficulty(lv)}
                    aria-pressed={difficulty === lv}
                    className={`touch-manipulation flex-1 rounded-lg border px-2 py-1 text-xs font-semibold transition ${
                      difficulty === lv
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-900/30'
                    }`}
                  >
                    {t.dailyChallenge.difficultyLabel(lv)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="mt-2 touch-manipulation rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-400"
              >
                {t.dailyChallenge.startButton}
              </button>
            </>
          )}
        </>
      )}

      {(phase === 'showing' || phase === 'answering') && (
        <div className="mt-2 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {phase === 'showing'
              ? t.dailyChallenge.rememberPrompt
              : t.dailyChallenge.inputPrompt}
          </p>
          {phase === 'showing' ? (
            <p className="text-4xl font-bold tabular-nums text-amber-600 dark:text-amber-300">
              {digits.join('')}
            </p>
          ) : (
            <NumpadInput
              value={typed}
              maxLength={digits.length}
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}

      {phase === 'result' && (
        <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
          {t.dailyChallenge.completedBadge(correct)}
        </p>
      )}
    </div>
  )
}
