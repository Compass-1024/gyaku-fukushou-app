import type { Level, ToneQuestion } from '../types'

export const PAD_COUNT = 4
export const PAD_LABELS = ['赤', '青', '緑', '黄'] as const

const SEQUENCE_LENGTH: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }

export const TONE_LEVEL_LABELS: Record<Level, string> = {
  1: 'レベル1（3音）',
  2: 'レベル2（4音）',
  3: 'レベル3（5音）',
}

const QUESTIONS_PER_SET = 3

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * PAD_COUNT))
}

export function pickToneQuestionSet(level: Level): ToneQuestion[] {
  const length = SEQUENCE_LENGTH[level]
  const now = Date.now()
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => ({
    id: `${level}-${now}-${i}`,
    sequence: generateSequence(length),
  }))
}

export function isToneAnswerCorrect(
  tapped: number[],
  expected: number[],
): boolean {
  if (tapped.length !== expected.length) return false
  return tapped.every((pad, i) => pad === expected[i])
}

// パッドを1つずつ光らせる（音を鳴らす）際の表示時間と、パッド同士の間の空白時間
export const TONE_SHOWN_MS = 600
export const TONE_GAP_MS = 300

// レベル選択後、最初のパッドが光るまでの間を置く時間
export const READY_MS = 1000

// 系列が長いほどタップして答えるのに時間がかかるため、長さに応じて回答時間を伸ばす
const ANSWER_BASE_MS = 3000
const ANSWER_MS_PER_PAD = 2000

export function getAnswerTimeoutMs(length: number): number {
  return ANSWER_BASE_MS + length * ANSWER_MS_PER_PAD
}
