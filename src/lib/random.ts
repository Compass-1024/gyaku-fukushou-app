import { pickDigitQuestionSet } from './digits'
import { pickSequenceQuestionSet } from './sequence'
import { pickSpatialQuestionSet } from './spatial'
import { pickPatternQuestionSet } from './pattern'
import { pickToneQuestionSet } from './tone'
import type { Level, RandomRound } from '../types'

export const RANDOM_ROUNDS_PER_SET = 5

// すうじ・順唱・空間・変化検出・音/色の「単発質問→回答」型5モードから1問ずつ集め、
// シャッフルした順で5ラウンドのミックス練習を組み立てる。Nバック系（連続試行）と
// ことばモード（音声入出力）は構造が大きく異なるため対象外
export function buildRandomRounds(level: Level): RandomRound[] {
  const rounds: RandomRound[] = [
    { mode: 'digit', question: pickDigitQuestionSet(level)[0] },
    { mode: 'sequence', question: pickSequenceQuestionSet(level)[0] },
    { mode: 'spatial', question: pickSpatialQuestionSet(level)[0] },
    { mode: 'pattern', question: pickPatternQuestionSet(level)[0] },
    { mode: 'tone', question: pickToneQuestionSet(level)[0] },
  ]
  for (let i = rounds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rounds[i], rounds[j]] = [rounds[j], rounds[i]]
  }
  return rounds
}
