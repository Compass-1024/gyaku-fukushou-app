import { getLevelStats } from './history'
import type { DigitGameType, HistoryEntry, Level, Mode } from '../types'

// 「到達済み」とみなす最低条件。1回のたまたまの正解で過大評価しないよう、
// 苦手分野判定（MIN_ATTEMPTS_FOR_RELIABLE_WEAKEST）と同じ考え方で
// 十分な挑戦回数を要求する
const MIN_ATTEMPTS = 2
const MASTERY_ACCURACY = 70

const ALL_LEVELS: readonly Level[] = [1, 2, 3]

export type BenchmarkBand = 'below' | 'average' | 'above'

export interface Benchmark {
  mode: 'digit' | 'spatial' | 'nback' | 'pattern'
  value: number
  band: BenchmarkBand
  referenceMin: number
  referenceMax: number
}

export function bandFor(
  value: number,
  referenceMin: number,
  referenceMax: number,
): BenchmarkBand {
  if (value < referenceMin) return 'below'
  if (value > referenceMax) return 'above'
  return 'average'
}

// 挑戦回数・正答率のしきい値を満たす最も高いレベルを返す（無ければnull）
export function getHighestMasteredLevel(
  history: HistoryEntry[],
  mode: Mode,
  gameType?: DigitGameType,
): Level | null {
  let highest: Level | null = null
  for (const level of ALL_LEVELS) {
    const stats = getLevelStats(history, level, mode, gameType)
    if (
      stats.attempts >= MIN_ATTEMPTS &&
      stats.accuracy !== null &&
      stats.accuracy >= MASTERY_ACCURACY
    ) {
      highest = level
    }
  }
  return highest
}

const DIGIT_SPAN: Record<Level, number> = { 1: 3, 2: 5, 3: 7 }
const DIGIT_SPAN_REFERENCE = { min: 4, max: 5 }

// すうじモード（逆から入力）＝逆唱スパン課題の到達桁数を、一般的な目安と比較する
export function getDigitSpanBenchmark(history: HistoryEntry[]): Benchmark | null {
  const level = getHighestMasteredLevel(history, 'digit', 'reverse')
  if (level === null) return null
  const value = DIGIT_SPAN[level]
  return {
    mode: 'digit',
    value,
    band: bandFor(value, DIGIT_SPAN_REFERENCE.min, DIGIT_SPAN_REFERENCE.max),
    referenceMin: DIGIT_SPAN_REFERENCE.min,
    referenceMax: DIGIT_SPAN_REFERENCE.max,
  }
}

const SPATIAL_SPAN: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }
const SPATIAL_SPAN_REFERENCE = { min: 4, max: 5 }

// 空間モード＝Corsi Block-Tapping課題の到達マス数を、一般的な目安と比較する
export function getSpatialSpanBenchmark(history: HistoryEntry[]): Benchmark | null {
  const level = getHighestMasteredLevel(history, 'spatial')
  if (level === null) return null
  const value = SPATIAL_SPAN[level]
  return {
    mode: 'spatial',
    value,
    band: bandFor(value, SPATIAL_SPAN_REFERENCE.min, SPATIAL_SPAN_REFERENCE.max),
    referenceMin: SPATIAL_SPAN_REFERENCE.min,
    referenceMax: SPATIAL_SPAN_REFERENCE.max,
  }
}

// N値ごとの正答率の一般的な目安（幅を持たせた大まかな範囲）
const NBACK_ACCURACY_REFERENCE: Record<Level, { min: number; max: number }> = {
  1: { min: 85, max: 100 },
  2: { min: 70, max: 90 },
  3: { min: 55, max: 80 },
}

// Nバックモード＝十分な挑戦回数がある最も高いN値での正答率を、
// そのN値の一般的な目安と比較する（レベルアップの成否ではなく正答率そのものを見る）
export function getNBackBenchmark(history: HistoryEntry[]): Benchmark | null {
  let targetLevel: Level | null = null
  let accuracy: number | null = null
  for (const level of ALL_LEVELS) {
    const stats = getLevelStats(history, level, 'nback')
    if (stats.attempts >= MIN_ATTEMPTS && stats.accuracy !== null) {
      targetLevel = level
      accuracy = stats.accuracy
    }
  }
  if (targetLevel === null || accuracy === null) return null
  const reference = NBACK_ACCURACY_REFERENCE[targetLevel]
  return {
    mode: 'nback',
    value: accuracy,
    band: bandFor(accuracy, reference.min, reference.max),
    referenceMin: reference.min,
    referenceMax: reference.max,
  }
}

const PATTERN_FILLED_COUNT: Record<Level, number> = { 1: 4, 2: 6, 3: 8 }
const PATTERN_CAPACITY_REFERENCE = { min: 3, max: 4 }

// 変化検出モード＝Cowanの視覚ワーキングメモリ容量の公式 K = N × (2p − 1) で
// 容量（K値）を推定する（変化あり/なしが等確率のため、正答率pのみから
// ヒット率・棄却率を仮定せずに算出できる）。十分な挑戦回数がある各レベルで
// 算出し、最も高いK値を採用する
export function getPatternCapacityBenchmark(
  history: HistoryEntry[],
): Benchmark | null {
  let best: number | null = null
  for (const level of ALL_LEVELS) {
    const stats = getLevelStats(history, level, 'pattern')
    if (stats.attempts < MIN_ATTEMPTS || stats.accuracy === null) continue
    const n = PATTERN_FILLED_COUNT[level]
    const p = stats.accuracy / 100
    const k = n * (2 * p - 1)
    if (best === null || k > best) best = k
  }
  if (best === null) return null
  const value = Math.round(best * 10) / 10
  return {
    mode: 'pattern',
    value,
    band: bandFor(value, PATTERN_CAPACITY_REFERENCE.min, PATTERN_CAPACITY_REFERENCE.max),
    referenceMin: PATTERN_CAPACITY_REFERENCE.min,
    referenceMax: PATTERN_CAPACITY_REFERENCE.max,
  }
}

export function getAllBenchmarks(history: HistoryEntry[]): Benchmark[] {
  return [
    getDigitSpanBenchmark(history),
    getSpatialSpanBenchmark(history),
    getNBackBenchmark(history),
    getPatternCapacityBenchmark(history),
  ].filter((b): b is Benchmark => b !== null)
}
