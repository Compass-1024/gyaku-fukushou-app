import { describe, expect, it } from 'vitest'
import {
  bandFor,
  getHighestMasteredLevel,
  getDigitSpanBenchmark,
  getSpatialSpanBenchmark,
  getNBackBenchmark,
  getPatternCapacityBenchmark,
  getAllBenchmarks,
} from './benchmarks'
import type { HistoryEntry, Level, Mode, DigitGameType } from '../types'

function entries(
  mode: Mode,
  level: Level,
  count: number,
  correct: number,
  total: number,
  gameType?: DigitGameType,
): HistoryEntry[] {
  return Array.from({ length: count }, () => ({
    mode,
    gameType,
    level,
    correct,
    total,
    timestamp: new Date().toISOString(),
  }))
}

describe('bandFor', () => {
  it('範囲未満はbelow', () => {
    expect(bandFor(3, 4, 5)).toBe('below')
  })
  it('範囲内（境界含む）はaverage', () => {
    expect(bandFor(4, 4, 5)).toBe('average')
    expect(bandFor(5, 4, 5)).toBe('average')
  })
  it('範囲超過はabove', () => {
    expect(bandFor(6, 4, 5)).toBe('above')
  })
})

describe('getHighestMasteredLevel', () => {
  it('挑戦回数不足なら未到達扱い', () => {
    const history = entries('spatial', 2, 1, 4, 4)
    expect(getHighestMasteredLevel(history, 'spatial')).toBeNull()
  })

  it('正答率不足なら未到達扱い', () => {
    const history = entries('spatial', 2, 2, 1, 3)
    expect(getHighestMasteredLevel(history, 'spatial')).toBeNull()
  })

  it('条件を満たす最も高いレベルを返す', () => {
    const history = [
      ...entries('spatial', 1, 2, 3, 3),
      ...entries('spatial', 2, 2, 3, 3),
      ...entries('spatial', 3, 2, 1, 3), // 正答率不足
    ]
    expect(getHighestMasteredLevel(history, 'spatial')).toBe(2)
  })

  it('gameTypeが一致する記録のみ対象にする', () => {
    const history = entries('digit', 2, 2, 5, 5, 'sum')
    expect(getHighestMasteredLevel(history, 'digit', 'reverse')).toBeNull()
  })
})

describe('getDigitSpanBenchmark', () => {
  it('データ不足ならnull', () => {
    expect(getDigitSpanBenchmark([])).toBeNull()
  })

  it('レベル1到達（3桁）はbelow', () => {
    const history = entries('digit', 1, 2, 3, 3, 'reverse')
    const result = getDigitSpanBenchmark(history)
    expect(result).toEqual({
      mode: 'digit',
      value: 3,
      band: 'below',
      referenceMin: 4,
      referenceMax: 5,
    })
  })

  it('レベル2到達（5桁）はaverage', () => {
    const history = entries('digit', 2, 2, 3, 3, 'reverse')
    expect(getDigitSpanBenchmark(history)?.band).toBe('average')
  })

  it('レベル3到達（7桁）はabove', () => {
    const history = entries('digit', 3, 2, 3, 3, 'reverse')
    expect(getDigitSpanBenchmark(history)?.band).toBe('above')
  })
})

describe('getSpatialSpanBenchmark', () => {
  it('レベル3到達（5マス）はaverage（上限と同値）', () => {
    const history = entries('spatial', 3, 2, 3, 3)
    expect(getSpatialSpanBenchmark(history)).toEqual({
      mode: 'spatial',
      value: 5,
      band: 'average',
      referenceMin: 4,
      referenceMax: 5,
    })
  })
})

describe('getNBackBenchmark', () => {
  it('データ不足ならnull', () => {
    expect(getNBackBenchmark([])).toBeNull()
  })

  it('最も高いN値の正答率を対象にする（マスタリー閾値は問わない）', () => {
    const history = [
      ...entries('nback', 1, 2, 15, 15),
      ...entries('nback', 2, 2, 6, 15), // 正答率40%でも対象になる
    ]
    const result = getNBackBenchmark(history)
    expect(result?.value).toBe(40)
    expect(result?.band).toBe('below')
    expect(result?.referenceMin).toBe(70)
    expect(result?.referenceMax).toBe(90)
  })

  it('2-backで正答率80%はaverage', () => {
    const history = entries('nback', 2, 2, 12, 15)
    expect(getNBackBenchmark(history)?.band).toBe('average')
  })
})

describe('getPatternCapacityBenchmark', () => {
  it('データ不足ならnull', () => {
    expect(getPatternCapacityBenchmark([])).toBeNull()
  })

  it('Cowanの公式でK値を算出する（N=4, 正答率100% → K=4）', () => {
    const history = entries('pattern', 1, 2, 3, 3)
    const result = getPatternCapacityBenchmark(history)
    expect(result?.value).toBe(4)
    expect(result?.band).toBe('average')
  })

  it('正答率50%（チャンスレベル）はK=0でbelow', () => {
    const history = entries('pattern', 1, 2, 2, 4) // correct=2/total=4=50%
    const result = getPatternCapacityBenchmark(history)
    expect(result?.value).toBe(0)
    expect(result?.band).toBe('below')
  })

  it('複数レベルに記録がある場合は最も高いK値を採用する', () => {
    const history = [
      ...entries('pattern', 1, 2, 2, 4), // K = 4*(2*0.5-1) = 0
      ...entries('pattern', 2, 2, 6, 6), // K = 6*(2*1-1) = 6
    ]
    expect(getPatternCapacityBenchmark(history)?.value).toBe(6)
  })
})

describe('getAllBenchmarks', () => {
  it('データが無ければ空配列を返す', () => {
    expect(getAllBenchmarks([])).toEqual([])
  })

  it('データがあるモードのみ含める', () => {
    const history = entries('spatial', 2, 2, 3, 3)
    const result = getAllBenchmarks(history)
    expect(result).toHaveLength(1)
    expect(result[0].mode).toBe('spatial')
  })
})
