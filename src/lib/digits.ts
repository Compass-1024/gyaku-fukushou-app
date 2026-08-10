import type { DigitQuestion, Level } from '../types'
import { isDigitStringMatch, classifyDigitPattern } from './digitAnswer'
import { loadBucketStats, recordBucketAttempt, pickWeightedCandidate } from './questionWeighting'

const DIGIT_LENGTH: Record<Level, number> = { 1: 3, 2: 5, 3: 7 }

const QUESTIONS_PER_SET = 3
const STATS_MODE = 'digit'

function generateDigits(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

// 誤答が多い系列パターン（数字の重複あり/なし）ほど選ばれやすい重み付き抽選で
// 1問だけ生成する。src/lib/questionWeighting.tsのバケット単位統計に基づく
// （固定候補プールを持たないモードのため、候補を複数生成して選ぶ方式）。
// ④-2: アダプティブ難易度モードは問題ごとにレベルが変わりうるため、
// 3問セットの一括生成(pickDigitQuestionSet)とは別に1問単位の生成が必要
export function pickDigitQuestion(
  level: Level,
  idSuffix: string | number = 0,
  exclude: number[][] = [],
): DigitQuestion {
  const length = DIGIT_LENGTH[level]
  const stats = loadBucketStats(STATS_MODE)
  const digits = pickWeightedCandidate(
    () => generateDigits(length),
    (d) => `${level}:${classifyDigitPattern(d)}`,
    stats,
    undefined,
    exclude,
  )
  return { id: `${level}-${Date.now()}-${idSuffix}`, digits }
}

// exclude: 直前に中断したセットで実際に表示済みだった数字列（モードを途中で
// やめて再挑戦した際、同じ問題が出ないようにする）に加え、同一セット内で
// 既に選んだ数字列も除外することで、1セット3問の中で同じ問題が重複して
// 出題されないようにする
export function pickDigitQuestionSet(level: Level, exclude: number[][] = []): DigitQuestion[] {
  const used = [...exclude]
  const picked: DigitQuestion[] = []
  for (let i = 0; i < QUESTIONS_PER_SET; i++) {
    const question = pickDigitQuestion(level, i, used)
    picked.push(question)
    used.push(question.digits)
  }
  return picked
}

export function recordDigitAttempt(
  level: Level,
  digits: number[],
  correct: boolean,
): void {
  recordBucketAttempt(STATS_MODE, `${level}:${classifyDigitPattern(digits)}`, correct)
}

export function reverseDigits(digits: number[]): string {
  return digits.slice().reverse().join('')
}

export function sumDigits(digits: number[]): string {
  return digits.reduce((sum, d) => sum + d, 0).toString()
}

// 逆から入力モードでは元の数列の末尾が0だと逆順の先頭が0になり得るが、
// 数字を入力する際に先頭の0を打たないのは自然な入力なので、比較時のみ
// 0埋めして「325」と「0325」のような入力を正解として扱う
export function isDigitAnswerCorrect(
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
