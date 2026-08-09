import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useEnterKey } from '../hooks/useEnterKey'
import { useSetCompletionRecorder } from '../hooks/useSetCompletionRecorder'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import {
  pickQuestionSet,
  REPEAT_SECONDS,
  getListenTimeoutMs,
  MATCH_TOLERANCE,
  LEVEL_LABELS,
} from '../lib/phrases'
import { reverseText } from '../lib/reverse'
import { loadPhraseStats, recordPhraseAttempt } from '../lib/phraseStats'
import { findMatchingAlternative, normalizeForCompare } from '../lib/kana'
import { confirmExit } from '../lib/confirmExit'
import { getSuggestedLevel } from '../lib/difficulty'
import { loadSettings } from '../lib/settings'
import { playCorrectSound, playIncorrectSound, playButtonTap } from '../lib/sound'
import { SetSummary } from './SetSummary'
import { GameHeader } from './GameHeader'
import { ResultBadge } from './ResultBadge'
import type {
  BaseGameScreenProps,
  Phrase,
  QuestionPhase,
  QuestionResult,
} from '../types'

const MIC_ERROR_MESSAGES: Partial<Record<SpeechRecognitionErrorCode, string>> =
  {
    'not-allowed':
      'マイクの使用が許可されていません。ブラウザの設定でマイクへのアクセスを許可してください。',
    'service-not-allowed':
      'マイクの使用が許可されていません。ブラウザの設定でマイクへのアクセスを許可してください。',
    'audio-capture':
      'マイクが見つかりません。マイクが接続されているか確認してください。',
  }

type GameScreenProps = BaseGameScreenProps

export function GameScreen({ level, onExit, onSelectLevel }: GameScreenProps) {
  const { supported: synthesisSupported, speak } = useSpeechSynthesis()
  const { listening, listenOnce, supported: recognitionSupported } =
    useSpeechRecognition()

  const [questions, setQuestions] = useState<Phrase[]>(() =>
    pickQuestionSet(level, loadPhraseStats()),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<QuestionPhase>('reading')
  const [repeatRemaining, setRepeatRemaining] = useState(
    REPEAT_SECONDS[level],
  )
  const [typedAnswer, setTypedAnswer] = useState('')
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(
    null,
  )
  const [results, setResults] = useState<QuestionResult[]>([])
  const [finished, setFinished] = useState(false)
  const [listenRemaining, setListenRemaining] = useState(0)

  const currentPhrase = questions[currentIndex]
  // 依存配列にはこのフレーズの「実体」を表す questions/currentIndex を使う。
  // Phrase オブジェクトは PHRASES 内で使い回されるため、リトライで偶然同じ
  // オブジェクト参照が選ばれると currentPhrase 自体を依存に使う effect が
  // 変化なしと判定され再実行されない（画面がフリーズする）ことがあるため。
  const listenTimeoutMs = useMemo(
    () => getListenTimeoutMs(currentPhrase.text.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, questions],
  )

  // 読み上げフェーズ: 問題が変わるたびに音声で出題する
  useEffect(() => {
    let cancelled = false
    setPhase('reading')
    setCurrentResult(null)
    setTypedAnswer('')
    speak(currentPhrase.text).then(() => {
      if (!cancelled) setPhase('repeat')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions, speak])

  // 復唱フェーズ: 声に出して覚え直すための時間をカウントダウン
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

  // 聞き取りの残り時間を表示用にカウントダウンする
  useEffect(() => {
    if (phase !== 'listening') return
    setListenRemaining(Math.ceil(listenTimeoutMs / 1000))
    const interval = setInterval(() => {
      setListenRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, listenTimeoutMs])

  // 逆復唱フェーズ: 音声認識で回答を受け取り正誤判定する
  // （非対応ブラウザではテキスト入力フォームでの回答に切り替えるため、ここでは何もしない）
  useEffect(() => {
    if (phase !== 'listening' || !recognitionSupported) return
    let cancelled = false
    listenOnce(listenTimeoutMs).then(
      ({ transcript, alternatives, error }) => {
        if (cancelled) return
        const expectedAnswer = reverseText(currentPhrase.text)
        const tolerance = MATCH_TOLERANCE[level]
        // 認識結果の候補のいずれかが近ければ正解とし、実際に一致した候補を表示する
        const matched = findMatchingAlternative(
          alternatives,
          expectedAnswer,
          tolerance,
        )
        const correct = matched !== undefined
        if (loadSettings().soundEnabled) {
          if (correct) playCorrectSound()
          else playIncorrectSound()
        }
        setCurrentResult({
          phrase: currentPhrase,
          expectedAnswer,
          heard: matched ?? transcript,
          correct,
          micError: error,
        })
        setPhase('result')
      },
    )
    return () => {
      cancelled = true
    }
  }, [phase, currentPhrase, listenTimeoutMs, listenOnce, level, recognitionSupported])

  // 3問セットが完了するたびに結果を記録し、新規実績の解除やレベルアップを演出する
  const { newAchievements, isNewBest, isNewTodayBest, xpGained, leveledUp, newLevel } = useSetCompletionRecorder({
    trigger: finished,
    mode: 'word',
    level,
    correctCount: results.filter((r) => r.correct).length,
    total: results.length,
  })

  function handleNext() {
    if (!currentResult) return
    if (loadSettings().soundEnabled) playButtonTap()
    recordPhraseAttempt(currentResult.phrase.id, currentResult.correct)
    const updated = [...results, currentResult]
    setResults(updated)
    if (currentIndex + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleToggleCorrect() {
    setCurrentResult((prev) =>
      prev ? { ...prev, correct: !prev.correct } : prev,
    )
  }

  function handleRetryListening() {
    setCurrentResult(null)
    setPhase('listening')
  }

  // 音声認識非対応ブラウザ向け: テキスト入力での回答を判定する
  function handleSubmitTypedAnswer(e: FormEvent) {
    e.preventDefault()
    const expectedAnswer = reverseText(currentPhrase.text)
    const correct =
      typedAnswer.length > 0 &&
      normalizeForCompare(typedAnswer) === normalizeForCompare(expectedAnswer)
    if (loadSettings().soundEnabled) {
      if (correct) playCorrectSound()
      else playIncorrectSound()
    }
    setCurrentResult({
      phrase: currentPhrase,
      expectedAnswer,
      heard: typedAnswer,
      correct,
      micError: null,
    })
    setPhase('result')
  }

  // 結果表示中はEnterキーでも次の問題へ進めるようにし、テンポよく周回できるようにする。
  // finished後もこれが有効だと、SetSummary自身のEnterハンドラと二重に発火し
  // 履歴が二重記録されてしまうため、finished中は無効化する
  useEnterKey(phase === 'result' && !finished, handleNext)

  function handleRetry() {
    setQuestions(pickQuestionSet(level, loadPhraseStats()))
    setCurrentIndex(0)
    setResults([])
    setCurrentResult(null)
    setFinished(false)
  }

  if (finished) {
    const correctCount = results.filter((r) => r.correct).length
    const accuracyPercent =
      results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
    const suggestedLevel = getSuggestedLevel(level, accuracyPercent)
    return (
      <SetSummary
        items={results.map((r) => ({
          key: r.phrase.id,
          label: r.phrase.text,
          correct: r.correct,
        }))}
        onRetry={handleRetry}
        onChangeLevel={onExit}
        newAchievements={newAchievements}
        isNewBest={isNewBest}
        isNewTodayBest={isNewTodayBest}
        xpGained={xpGained}
        leveledUp={leveledUp}
        newLevel={newLevel}
        suggestion={
          suggestedLevel
            ? {
                label:
                  suggestedLevel > level
                    ? `🎉 ${LEVEL_LABELS[suggestedLevel]}に挑戦する`
                    : `${LEVEL_LABELS[suggestedLevel]}に戻って練習する`,
                onSelect: () => onSelectLevel(suggestedLevel),
              }
            : undefined
        }
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12">
      <GameHeader
        backLabel="← レベル選択"
        onBack={() =>
          confirmExit(results.length > 0 || currentResult !== null, onExit)
        }
        currentIndex={currentIndex}
        total={questions.length}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center shadow-sm sm:min-h-64 sm:px-6 sm:py-10 dark:border-gray-700 dark:bg-gray-800"
      >
        {phase === 'reading' && (
          <>
            <span className="animate-pop text-5xl">🔊</span>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              よく聞いてください
            </p>
            {!synthesisSupported && (
              <p className="text-2xl font-bold tracking-wide text-gray-900 dark:text-gray-100">
                {currentPhrase.text}
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
            <p
              aria-hidden="true"
              className="text-3xl font-bold text-indigo-500"
            >
              {repeatRemaining}
            </p>
          </>
        )}

        {phase === 'listening' && recognitionSupported && (
          <>
            <span
              className={`text-5xl ${listening ? 'animate-pop' : ''}`}
            >
              🎤
            </span>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
              今度は反対から言ってください
            </p>
            <p aria-hidden="true" className="text-3xl font-bold text-rose-500">
              {listenRemaining}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              聞き取っています…
            </p>
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

        {phase === 'result' && currentResult && (
          <>
            <ResultBadge correct={currentResult.correct} />
            <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
              <p>出題: {currentResult.phrase.text}</p>
              <p>正しい逆さ言葉: {currentResult.expectedAnswer}</p>
              {currentResult.micError &&
              MIC_ERROR_MESSAGES[currentResult.micError] ? (
                <p className="text-amber-600 dark:text-amber-400">
                  {MIC_ERROR_MESSAGES[currentResult.micError]}
                </p>
              ) : (
                <p>
                  あなたの回答:{' '}
                  {currentResult.heard || '（認識できませんでした）'}
                </p>
              )}
            </div>
            {currentResult.heard.length === 0 && (
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
              {currentResult.correct
                ? '実際は不正解だった場合はこちら'
                : '実際は正解していた場合はこちら'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 touch-manipulation rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-400"
            >
              {currentIndex + 1 >= questions.length ? '結果を見る' : '次へ'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
