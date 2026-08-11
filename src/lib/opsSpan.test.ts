import { describe, expect, it } from 'vitest'
import {
  pickOpsSpanQuestionSet,
  getOpsSpanExpectedAnswer,
  isOpsSpanAnswerCorrect,
  countJudgedCorrect,
} from './opsSpan'
import type { Level } from '../types'

describe('pickOpsSpanQuestionSet', () => {
  it('generates 3 questions with the correct trial count per level', () => {
    const lengths: Record<Level, number> = { 1: 3, 2: 4, 3: 5 }
    for (const level of [1, 2, 3] as const) {
      const set = pickOpsSpanQuestionSet(level)
      expect(set).toHaveLength(3)
      for (const q of set) {
        expect(q.trials).toHaveLength(lengths[level])
        for (const trial of q.trials) {
          expect(trial.memoryDigit).toBeGreaterThanOrEqual(0)
          expect(trial.memoryDigit).toBeLessThanOrEqual(9)
          expect(trial.judgmentCorrect).toBe(trial.a + trial.b === trial.shownSum)
        }
      }
    }
  })

  it('同一セット内で同じ記憶数字列が重複して出題されない', () => {
    for (let i = 0; i < 100; i++) {
      const set = pickOpsSpanQuestionSet(1)
      const serialized = set.map((q) => q.trials.map((t) => t.memoryDigit).join(','))
      expect(new Set(serialized).size).toBe(set.length)
    }
  })
})

describe('pickOpsSpanQuestionSet の除外機能', () => {
  it('excludeに渡した記憶数字列を避けて生成する（モードを途中でやめて再挑戦した際、同じ問題が出ないようにする）', () => {
    const exclude = [[1, 2, 3]]
    for (let i = 0; i < 50; i++) {
      const [question] = pickOpsSpanQuestionSet(1, exclude)
      expect(question.trials.map((t) => t.memoryDigit)).not.toEqual([1, 2, 3])
    }
  })
})

describe('getOpsSpanExpectedAnswer', () => {
  it('提示順のまま記憶数字を連結する（逆順にしない）', () => {
    const question = {
      id: 'x',
      trials: [
        { a: 1, b: 1, shownSum: 2, judgmentCorrect: true, memoryDigit: 5 },
        { a: 2, b: 2, shownSum: 4, judgmentCorrect: true, memoryDigit: 0 },
        { a: 3, b: 3, shownSum: 5, judgmentCorrect: false, memoryDigit: 7 },
      ],
    }
    expect(getOpsSpanExpectedAnswer(question)).toBe('507')
  })
})

describe('isOpsSpanAnswerCorrect', () => {
  it('accepts an answer typed without a leading zero', () => {
    expect(isOpsSpanAnswerCorrect('507', '0507')).toBe(true)
    expect(isOpsSpanAnswerCorrect('507', '507')).toBe(true)
  })

  it('rejects an empty answer', () => {
    expect(isOpsSpanAnswerCorrect('', '507')).toBe(false)
  })
})

describe('countJudgedCorrect', () => {
  it('counts how many judgments matched the actual correctness, treating null as unanswered', () => {
    const trials = [
      { a: 1, b: 1, shownSum: 2, judgmentCorrect: true, memoryDigit: 1 },
      { a: 2, b: 2, shownSum: 5, judgmentCorrect: false, memoryDigit: 2 },
      { a: 3, b: 3, shownSum: 6, judgmentCorrect: true, memoryDigit: 3 },
    ]
    expect(countJudgedCorrect(trials, [true, false, null])).toBe(2)
    expect(countJudgedCorrect(trials, [false, false, true])).toBe(2)
  })
})
