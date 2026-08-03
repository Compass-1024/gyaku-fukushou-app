import type { DigitQuestion, Level } from '../types'

const DIGIT_LENGTH: Record<Level, number> = { 1: 3, 2: 5, 3: 7 }

const QUESTIONS_PER_SET = 3

function generateDigits(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10))
}

export function pickDigitQuestionSet(level: Level): DigitQuestion[] {
  const length = DIGIT_LENGTH[level]
  const now = Date.now()
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => ({
    id: `${level}-${now}-${i}`,
    digits: generateDigits(length),
  }))
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
  if (typed.length === 0) return false
  return typed.padStart(expectedAnswer.length, '0') === expectedAnswer
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
