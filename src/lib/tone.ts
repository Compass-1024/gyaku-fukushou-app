import type { Level, ToneQuestion } from '../types'
import { loadBucketStats, recordBucketAttempt, pickWeightedCandidate } from './questionWeighting'

export const PAD_COUNT = 4

const SEQUENCE_LENGTH: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }

const QUESTIONS_PER_SET = 3
const STATS_MODE = 'tone'

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * PAD_COUNT))
}

// 出題重み付け用の系列パターン分類。同じパッドが2回以上出現するかどうかで
// 2分割する（パッドの重複は記憶時の混同・干渉が起きやすい特徴のため）
function classifyToneSequence(sequence: number[]): string {
  return new Set(sequence).size !== sequence.length ? 'repeat' : 'unique'
}

// 誤答が多い系列パターンほど選ばれやすい重み付き抽選で出題する
export function pickToneQuestionSet(level: Level): ToneQuestion[] {
  const length = SEQUENCE_LENGTH[level]
  const now = Date.now()
  const stats = loadBucketStats(STATS_MODE)
  return Array.from({ length: QUESTIONS_PER_SET }, (_, i) => {
    const sequence = pickWeightedCandidate(
      () => generateSequence(length),
      (s) => `${level}:${classifyToneSequence(s)}`,
      stats,
    )
    return { id: `${level}-${now}-${i}`, sequence }
  })
}

export function recordToneAttempt(
  level: Level,
  sequence: number[],
  correct: boolean,
): void {
  recordBucketAttempt(STATS_MODE, `${level}:${classifyToneSequence(sequence)}`, correct)
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
