import { describe, expect, it } from 'vitest'
import {
  getDigitSpanBenchmark,
  getSpatialSpanBenchmark,
  getNBackBenchmark,
  getPatternCapacityBenchmark,
  getDualNBackBenchmark,
  getRandomBenchmark,
  getWordBenchmark,
  getToneBenchmark,
  getAllBenchmarks,
} from './benchmarks'
import type { HistoryEntry, Level, Mode, DigitGameType } from '../types'

// 指定件数分のエントリを、古い順になるようタイムスタンプをずらして生成する
function entriesAt(
  mode: Mode,
  level: Level,
  count: number,
  correct: number,
  total: number,
  startHoursAgo: number,
  gameType?: DigitGameType,
): HistoryEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    mode,
    gameType,
    level,
    correct,
    total,
    timestamp: new Date(
      Date.now() - (startHoursAgo - i) * 3600_000,
    ).toISOString(),
  }))
}

describe('getDigitSpanBenchmark', () => {
  it('挑戦回数が前半/後半それぞれ2回に満たなければnull', () => {
    const history = entriesAt('digit', 1, 3, 2, 3, 10, 'reverse')
    expect(getDigitSpanBenchmark(history)).toBeNull()
  })

  it('後半の正答率が前半より十分高ければaboveと判定される', () => {
    const history = [
      ...entriesAt('digit', 1, 2, 1, 3, 20, 'reverse'), // 古い方: 正答率33%
      ...entriesAt('digit', 1, 2, 3, 3, 5, 'reverse'), // 新しい方: 正答率100%
    ]
    const result = getDigitSpanBenchmark(history)
    expect(result?.previousValue).toBe(33)
    expect(result?.value).toBe(100)
    expect(result?.band).toBe('above')
  })

  it('前半・後半の正答率がほぼ同じならaverageと判定される', () => {
    const history = [
      ...entriesAt('digit', 1, 2, 2, 3, 20, 'reverse'),
      ...entriesAt('digit', 1, 2, 2, 3, 5, 'reverse'),
    ]
    const result = getDigitSpanBenchmark(history)
    expect(result?.band).toBe('average')
  })

  it('後半の正答率が前半より十分低ければbelowと判定される', () => {
    const history = [
      ...entriesAt('digit', 1, 2, 3, 3, 20, 'reverse'),
      ...entriesAt('digit', 1, 2, 1, 3, 5, 'reverse'),
    ]
    const result = getDigitSpanBenchmark(history)
    expect(result?.band).toBe('below')
  })

  it('gameTypeが一致する記録のみ対象にする', () => {
    const history = entriesAt('digit', 2, 4, 3, 3, 10, 'sum')
    expect(getDigitSpanBenchmark(history)).toBeNull()
  })
})

describe('getSpatialSpanBenchmark / getNBackBenchmark / getPatternCapacityBenchmark', () => {
  it('データ不足ならnull', () => {
    expect(getSpatialSpanBenchmark([])).toBeNull()
    expect(getNBackBenchmark([])).toBeNull()
    expect(getPatternCapacityBenchmark([])).toBeNull()
  })

  it('十分なデータがあれば比較結果を返す', () => {
    const spatial = [
      ...entriesAt('spatial', 1, 2, 2, 3, 20),
      ...entriesAt('spatial', 1, 2, 2, 3, 5),
    ]
    expect(getSpatialSpanBenchmark(spatial)?.band).toBe('average')

    const nback = [
      ...entriesAt('nback', 1, 2, 10, 15, 20),
      ...entriesAt('nback', 1, 2, 10, 15, 5),
    ]
    expect(getNBackBenchmark(nback)?.band).toBe('average')

    const pattern = [
      ...entriesAt('pattern', 1, 2, 3, 4, 20),
      ...entriesAt('pattern', 1, 2, 3, 4, 5),
    ]
    expect(getPatternCapacityBenchmark(pattern)?.band).toBe('average')
  })
})

describe('getDualNBackBenchmark / getRandomBenchmark / getWordBenchmark / getToneBenchmark', () => {
  it('データ不足ならnull', () => {
    expect(getDualNBackBenchmark([])).toBeNull()
    expect(getRandomBenchmark([])).toBeNull()
    expect(getWordBenchmark([])).toBeNull()
    expect(getToneBenchmark([])).toBeNull()
  })

  it('十分なデータがあれば比較結果を返す', () => {
    const dualNback = [
      ...entriesAt('dual-nback', 1, 2, 20, 40, 20),
      ...entriesAt('dual-nback', 1, 2, 30, 40, 5),
    ]
    expect(getDualNBackBenchmark(dualNback)?.band).toBe('above')

    const random = [
      ...entriesAt('random', 1, 2, 2, 5, 20),
      ...entriesAt('random', 1, 2, 2, 5, 5),
    ]
    expect(getRandomBenchmark(random)?.band).toBe('average')

    const word = [
      ...entriesAt('word', 1, 2, 3, 3, 20),
      ...entriesAt('word', 1, 2, 1, 3, 5),
    ]
    expect(getWordBenchmark(word)?.band).toBe('below')

    const tone = [
      ...entriesAt('tone', 1, 2, 2, 3, 20),
      ...entriesAt('tone', 1, 2, 2, 3, 5),
    ]
    expect(getToneBenchmark(tone)?.band).toBe('average')
  })
})

describe('getAllBenchmarks', () => {
  it('データが無ければ空配列を返す', () => {
    expect(getAllBenchmarks([])).toEqual([])
  })

  it('比較可能なモードのみ含める', () => {
    const history = [
      ...entriesAt('spatial', 2, 2, 3, 3, 20),
      ...entriesAt('spatial', 2, 2, 3, 3, 5),
    ]
    const result = getAllBenchmarks(history)
    expect(result).toHaveLength(1)
    expect(result[0].mode).toBe('spatial')
  })

  it('8モードすべてに十分なデータがあれば8件返す', () => {
    const modes: [Mode, number, number][] = [
      ['digit', 2, 3],
      ['spatial', 2, 3],
      ['nback', 10, 15],
      ['pattern', 3, 4],
      ['dual-nback', 20, 40],
      ['random', 2, 5],
      ['word', 2, 3],
      ['tone', 2, 3],
    ]
    const history = modes.flatMap(([mode, correct, total]) => [
      ...entriesAt(mode, 1, 2, correct, total, 20, mode === 'digit' ? 'reverse' : undefined),
      ...entriesAt(mode, 1, 2, correct, total, 5, mode === 'digit' ? 'reverse' : undefined),
    ])
    expect(getAllBenchmarks(history)).toHaveLength(8)
  })
})
