import type { DigitGameType, HistoryEntry, Mode } from '../types'

// 一般的な心理学的目安（母集団基準）ではなく、ユーザー自身の過去の正答率と
// 比較する自己ベンチマーク方式。対象モードの挑戦履歴を古い順に並べて前半/後半に
// 分割し、それぞれの正答率を比較することで「向上している/横ばい/低下している」を
// 判定する。個人差の大きい母集団基準より、継続のモチベーションになりやすい

// 前半・後半それぞれに最低限必要な挑戦回数（1回のたまたまの結果で
// 過大評価しないよう、苦手分野判定と同じ考え方で複数回を要求する）
const MIN_ATTEMPTS_PER_HALF = 2
// この差（パーセントポイント）以上を「向上/低下」とみなす。誤差レベルの
// 揺らぎを「同程度」として吸収するための閾値
const CHANGE_THRESHOLD = 5

export type BenchmarkBand = 'below' | 'average' | 'above'

export interface Benchmark {
  mode: 'digit' | 'spatial' | 'nback' | 'pattern'
  // 直近期間の正答率（%）
  value: number
  // それ以前の期間の正答率（%）。valueとの比較でbandが決まる
  previousValue: number
  // 'above'=向上している / 'average'=同程度 / 'below'=低下している
  band: BenchmarkBand
}

function accuracyOf(entries: HistoryEntry[]): number {
  const correctSum = entries.reduce((sum, e) => sum + e.correct, 0)
  const totalSum = entries.reduce((sum, e) => sum + e.total, 0)
  return totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : 0
}

function bandForChange(current: number, previous: number): BenchmarkBand {
  if (current >= previous + CHANGE_THRESHOLD) return 'above'
  if (current <= previous - CHANGE_THRESHOLD) return 'below'
  return 'average'
}

// 対象モードの挑戦履歴を古い順に並べ、前半/後半に分割する。
// どちらかの件数が不足していれば比較不能としてnullを返す
function splitByTime(
  history: HistoryEntry[],
  mode: Mode,
  gameType?: DigitGameType,
): { earlier: HistoryEntry[]; later: HistoryEntry[] } | null {
  const relevant = history
    .filter((e) => e.mode === mode && e.gameType === gameType)
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  if (relevant.length < MIN_ATTEMPTS_PER_HALF * 2) return null
  const mid = Math.floor(relevant.length / 2)
  const earlier = relevant.slice(0, mid)
  const later = relevant.slice(mid)
  if (earlier.length < MIN_ATTEMPTS_PER_HALF || later.length < MIN_ATTEMPTS_PER_HALF) {
    return null
  }
  return { earlier, later }
}

function buildSelfBenchmark(
  history: HistoryEntry[],
  benchmarkMode: Benchmark['mode'],
  historyMode: Mode,
  gameType?: DigitGameType,
): Benchmark | null {
  const halves = splitByTime(history, historyMode, gameType)
  if (!halves) return null
  const previousValue = accuracyOf(halves.earlier)
  const value = accuracyOf(halves.later)
  return {
    mode: benchmarkMode,
    value,
    previousValue,
    band: bandForChange(value, previousValue),
  }
}

// すうじモード（逆から入力）: 過去の前半/後半で正答率を比較する
export function getDigitSpanBenchmark(history: HistoryEntry[]): Benchmark | null {
  return buildSelfBenchmark(history, 'digit', 'digit', 'reverse')
}

// 空間モード: 過去の前半/後半で正答率を比較する
export function getSpatialSpanBenchmark(history: HistoryEntry[]): Benchmark | null {
  return buildSelfBenchmark(history, 'spatial', 'spatial')
}

// Nバックモード: 過去の前半/後半で正答率を比較する
export function getNBackBenchmark(history: HistoryEntry[]): Benchmark | null {
  return buildSelfBenchmark(history, 'nback', 'nback')
}

// 変化検出モード: 過去の前半/後半で正答率を比較する
export function getPatternCapacityBenchmark(
  history: HistoryEntry[],
): Benchmark | null {
  return buildSelfBenchmark(history, 'pattern', 'pattern')
}

export function getAllBenchmarks(history: HistoryEntry[]): Benchmark[] {
  return [
    getDigitSpanBenchmark(history),
    getSpatialSpanBenchmark(history),
    getNBackBenchmark(history),
    getPatternCapacityBenchmark(history),
  ].filter((b): b is Benchmark => b !== null)
}
