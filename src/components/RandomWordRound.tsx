import { useEffect, useState, type FormEvent } from 'react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { REPEAT_SECONDS, getListenTimeoutMs, MATCH_TOLERANCE } from '../lib/phrases'
import { reverseText } from '../lib/reverse'
import { recordPhraseAttempt } from '../lib/phraseStats'
import { findMatchingAlternative, normalizeForCompare } from '../lib/kana'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { playCorrectHaptic, playIncorrectHaptic } from '../lib/haptics'
import { ResultBadge } from './ResultBadge'
import type { Phrase, QuestionPhase, QuestionResult } from '../types'

const MIC_ERROR_MESSAGES: Partial<Record<SpeechRecognitionErrorCode, string>> = {
  'not-allowed':
    'マイクの使用が許可されていません。ブラウザの設定でマイクへのアクセスを許可してください。',
  'service-not-allowed':
    'マイクの使用が許可されていません。ブラウザの設定でマイクへのアクセスを許可してください。',
  'audio-capture': 'マイクが見つかりません。マイクが接続されているか確認してください。',
}

interface RandomWordRoundProps {
  phrase: Phrase
  level: 1 | 2 | 3
  isLastRound: boolean
  onFinish: (outcome: { correct: boolean; heard: string; expectedAnswer: string }) => void
}

// ランダムモードのことばラウンド。単体のことばモード(GameScreen.tsx)と
// 同じ「読み上げ→復唱→聞き取り→結果」の流れを1問ぶんだけ独立に実行する。
// 音声合成/音声認識という他ラウンド（ready→showing→answering→result型）と
// 構造が大きく異なる入出力を扱うため、RandomGameScreenの共通の状態機には
// 統合せず、自己完結したコンポーネントとして切り出している
export function RandomWordRound({ phrase, level, isLastRound, onFinish }: RandomWordRoundProps) {
  const { supported: synthesisSupported, speak } = useSpeechSynthesis()
  const { listening, listenOnce, supported: recognitionSupported } = useSpeechRecognition()

  const [phase, setPhase] = useState<QuestionPhase>('reading')
  const [repeatRemaining, setRepeatRemaining] = useState(REPEAT_SECONDS[level])
  const [listenRemaining, setListenRemaining] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [result, setResult] = useState<QuestionResult | null>(null)

  const listenTimeoutMs = getListenTimeoutMs(phrase.text.length)

  useEffect(() => {
    let cancelled = false
    speak(phrase.text).then(() => {
      if (!cancelled) setPhase('repeat')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrase])

  useEffect(() => {
    if (phase !== 'repeat') return
    const seconds = REPEAT_SECONDS[level]
    setRepeatRemaining(seconds)
    const interval = setInterval(() => {
      setRepeatRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    const timeout = setTimeout(() => setPhase('listening'), seconds * 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [phase, level])

  useEffect(() => {
    if (phase !== 'listening') return
    setListenRemaining(Math.ceil(listenTimeoutMs / 1000))
    const interval = setInterval(() => {
      setListenRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, listenTimeoutMs])

  useEffect(() => {
    if (phase !== 'listening' || !recognitionSupported) return
    let cancelled = false
    listenOnce(listenTimeoutMs).then(({ transcript, alternatives, error }) => {
      if (cancelled) return
      const expectedAnswer = reverseText(phrase.text)
      const tolerance = MATCH_TOLERANCE[level]
      const matched = findMatchingAlternative(alternatives, expectedAnswer, tolerance)
      const correct = matched !== undefined
      if (loadSettings().soundEnabled) {
        if (correct) playCorrectSound()
        else playIncorrectSound()
      }
      if (loadSettings().hapticsEnabled) {
        if (correct) playCorrectHaptic()
        else playIncorrectHaptic()
      }
      setResult({
        phrase,
        expectedAnswer,
        heard: matched ?? transcript,
        correct,
        micError: error,
      })
      setPhase('result')
    })
    return () => {
      cancelled = true
    }
  }, [phase, phrase, listenTimeoutMs, listenOnce, level, recognitionSupported])

  function handleToggleCorrect() {
    setResult((prev) => (prev ? { ...prev, correct: !prev.correct } : prev))
  }

  function handleRetryListening() {
    setResult(null)
    setPhase('listening')
  }

  function handleSubmitTypedAnswer(e: FormEvent) {
    e.preventDefault()
    const expectedAnswer = reverseText(phrase.text)
    const correct =
      typedAnswer.length > 0 &&
      normalizeForCompare(typedAnswer) === normalizeForCompare(expectedAnswer)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    if (loadSettings().hapticsEnabled) {
      if (correct) playCorrectHaptic()
      else playIncorrectHaptic()
    }
    setResult({ phrase, expectedAnswer, heard: typedAnswer, correct, micError: null })
    setPhase('result')
  }

  function handleNext() {
    if (!result) return
    if (loadSettings().soundEnabled) playButtonTap()
    recordPhraseAttempt(result.phrase.id, result.correct)
    onFinish({ correct: result.correct, heard: result.heard, expectedAnswer: result.expectedAnswer })
  }

  return (
    <>
      {phase === 'reading' && (
        <>
          <span className="animate-pop text-5xl">🔊</span>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            よく聞いてください
          </p>
          {!synthesisSupported && (
            <p className="text-2xl font-bold tracking-wide text-gray-900 dark:text-gray-100">
              {phrase.text}
            </p>
          )}
        </>
      )}

      {phase === 'repeat' && (
        <>
          <span className="text-5xl">🗣️</span>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            声に出して復唱してください
          </p>
          <p aria-hidden="true" className="text-3xl font-bold text-indigo-500">
            {repeatRemaining}
          </p>
        </>
      )}

      {phase === 'listening' && recognitionSupported && (
        <>
          <span className={`text-5xl ${listening ? 'animate-pop' : ''}`}>🎤</span>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            今度は反対から言ってください
          </p>
          <p aria-hidden="true" className="text-3xl font-bold text-rose-500">
            {listenRemaining}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">聞き取っています…</p>
        </>
      )}

      {phase === 'listening' && !recognitionSupported && (
        <form
          onSubmit={handleSubmitTypedAnswer}
          className="flex w-full max-w-xs flex-col items-center gap-3"
        >
          <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
            今度は反対から入力してください
          </p>
          <input
            type="text"
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            autoFocus
            aria-label="逆から読んだ答え"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-center text-2xl font-bold tracking-widest text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={typedAnswer.length === 0}
            className="touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            決定
          </button>
        </form>
      )}

      {phase === 'result' && result && (
        <>
          <ResultBadge correct={result.correct} />
          <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
            <p>出題: {result.phrase.text}</p>
            <p>正しい逆さ言葉: {result.expectedAnswer}</p>
            {result.micError && MIC_ERROR_MESSAGES[result.micError] ? (
              <p className="text-amber-600 dark:text-amber-400">
                {MIC_ERROR_MESSAGES[result.micError]}
              </p>
            ) : (
              <p>あなたの回答: {result.heard || '（認識できませんでした）'}</p>
            )}
          </div>
          {result.heard.length === 0 && (
            <button
              type="button"
              onClick={handleRetryListening}
              className="touch-manipulation rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              🎤 もう一度録音する
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleCorrect}
            className="touch-manipulation text-xs text-gray-400 underline decoration-dotted underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {result.correct ? '実際は不正解だった場合はこちら' : '実際は正解していた場合はこちら'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            {isLastRound ? '結果を見る' : '次へ'}
          </button>
        </>
      )}
    </>
  )
}
