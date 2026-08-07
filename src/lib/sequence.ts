import type { Level, SequenceQuestion } from '../types'
import { isDigitStringMatch, classifyDigitPattern } from './digitAnswer'
import { loadBucketStats, recordBucketAttempt, pickWeightedCandidate } from './questionWeighting'

// すうじモード（逆から入力）と同じ桁数テーブルを使い、見た順そのままに
// 入力させる順唱（Forward Digit Span）課題
const DIGIT_LENGTH: Record<Level, number> = { 1: 3, 2: 5, 3: 7 }

const QUESTIONS_PER_SET = 3
const STATS_MODE = 'sequence'

function generateDigits(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

// 誤答が多い系列パターン（数字の重複あり/なし）ほど選ばれやすい重み付き抽選で出題する
export function pickSequenceQuestionSet(level: Level): SequenceQuestion[] {
  const length = DIGIT_LENGTH[level]
  const now = Date.now()
  const stats = loadBucketStats(STATS_MODE)
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => {
    const digits = pickWeightedCandidate(
      () => generateDigits(length),
      (d) => `${level}:${classifyDigitPattern(d)}`,
      stats,
    )
    return { id: `${level}-${now}-${i}`, digits }
  })
}

export function recordSequenceAttempt(
  level: Level,
  digits: number[],
  correct: boolean,
): void {
  recordBucketAttempt(STATS_MODE, `${level}:${classifyDigitPattern(digits)}`, correct)
}

export function expectedSequenceAnswer(digits: number[]): string {
  return digits.join('')
}

export function isSequenceAnswerCorrect(
  typed: string,
  expectedAnswer: string,
): boolean {
  return isDigitStringMatch(typed, expectedAnswer)
}

// 数字を1つずつ表示する際の、表示時間と表示の間の空白時間
export const DIGIT_SHOWN_MS = 700
export const DIGIT_GAP_MS = 250

// レベル選択後、最初の数字が表示されるまでの間を置く時間
export const READY_MS = 1000

// 桁数が多いほど思い出して入力するのに時間がかかるため、桁数に応じて回答時間を伸ばす
const ANSWER_BASE_MS = 2000
const ANSWER_MS_PER_DIGIT = 2000

export function getAnswerTimeoutMs(length: number): number {
  return ANSWER_BASE_MS + length * ANSWER_MS_PER_DIGIT
}
