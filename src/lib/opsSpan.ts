import type { Level, OpsSpanQuestion, OpsSpanTrial } from '../types'
import { isDigitStringMatch } from './digitAnswer'

// レベルが上がるほど「処理→記憶」の試行数が増える（空間/音・色モードと同じ
// 3/4/5の刻み）
const TRIAL_COUNT: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }

const QUESTIONS_PER_SET = 3

function generateTrial(): OpsSpanTrial {
  const a = 1 + Math.floor(Math.random() * 9)
  const b = 1 + Math.floor(Math.random() * 9)
  const actualSum = a + b
  // 半分程度の確率でわざと間違った合計を提示し、処理課題（暗算の正誤判定）
  // として機能させる。ずれ幅は±1〜3のランダム
  const judgmentCorrect = Math.random() < 0.5
  const offsetMagnitude = 1 + Math.floor(Math.random() * 3)
  const offset = offsetMagnitude * (Math.random() < 0.5 ? -1 : 1)
  const shownSum = judgmentCorrect ? actualSum : actualSum + offset
  const memoryDigit = Math.floor(Math.random() * 10)
  return { a, b, shownSum, judgmentCorrect, memoryDigit }
}

function generateTrials(count: number): OpsSpanTrial[] {
  return Array.from({ length: count }, generateTrial)
}

function memoryDigits(trials: OpsSpanTrial[]): number[] {
  return trials.map((t) => t.memoryDigit)
}

// 直前に中断したセットで表示済みだった記憶数字列(exclude)と一致しなくなるまで
// 再生成する。digits.ts/spatial.ts等と同じ「モードを途中でやめて再挑戦した際、
// 同じ問題が出ないようにする」ための仕組み
export function pickOpsSpanQuestion(
  level: Level,
  idSuffix: string | number = 0,
  exclude: number[][] = [],
): OpsSpanQuestion {
  const count = TRIAL_COUNT[level]
  let trials = generateTrials(count)
  let guard = 0
  while (
    exclude.some((shape) => shape.join(',') === memoryDigits(trials).join(',')) &&
    guard < 20
  ) {
    trials = generateTrials(count)
    guard += 1
  }
  return { id: `${level}-${Date.now()}-${idSuffix}`, trials }
}

export function pickOpsSpanQuestionSet(
  level: Level,
  exclude: number[][] = [],
): OpsSpanQuestion[] {
  const used = [...exclude]
  const picked: OpsSpanQuestion[] = []
  for (let i = 0; i < QUESTIONS_PER_SET; i++) {
    const question = pickOpsSpanQuestion(level, i, used)
    picked.push(question)
    used.push(memoryDigits(question.trials))
  }
  return picked
}

// 記憶課題の正解は、提示された順のまま数字を並べたもの（すうじモードの
// 「逆から入力」とは異なり、処理記憶モードでは提示順のまま思い出す）
export function getOpsSpanExpectedAnswer(question: OpsSpanQuestion): string {
  return memoryDigits(question.trials).join('')
}

export function isOpsSpanAnswerCorrect(typed: string, expectedAnswer: string): boolean {
  return isDigitStringMatch(typed, expectedAnswer)
}

// 暗算の正誤判定(processing task)にどれだけ正しく答えられたかを数える。
// unanswered(タイムアウト)はjudgedにnullを渡す
export function countJudgedCorrect(
  trials: OpsSpanTrial[],
  judged: (boolean | null)[],
): number {
  return trials.reduce(
    (sum, trial, i) => sum + (judged[i] === trial.judgmentCorrect ? 1 : 0),
    0,
  )
}

// 暗算の正誤判定1試行あたりの制限時間
export const JUDGING_TIMEOUT_MS = 3000

// レベル選択後、最初の試行が始まるまでの間を置く時間（他モードと合わせる）
export const READY_MS = 1000
