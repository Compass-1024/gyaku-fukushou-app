import { pickDigitQuestionSet } from './digits'
import { pickSpatialQuestionSet } from './spatial'
import { pickPatternQuestionSet } from './pattern'
import { pickToneQuestionSet } from './tone'
import { getLevelStats } from './history'
import type { DigitGameType, HistoryEntry, Level, Mode, RandomRound } from '../types'

export const RANDOM_ROUNDS_PER_SET = 5

// 出題数を選べるようにする（Nバック系のTRIAL_COUNT_OPTIONSと同じ考え方）。
// 5種類の候補ラウンド（すうじ・逆から/合計・空間・変化検出・音/色）のうち、
// 3問なら一部を間引き、7問なら一部を重複させて構成する
export const ROUND_COUNT_OPTIONS = [3, 5, 7] as const
export type RoundCount = (typeof ROUND_COUNT_OPTIONS)[number]
export const DEFAULT_ROUND_COUNT: RoundCount = 5

const ALL_LEVELS: readonly Level[] = [1, 2, 3]

// 弱点重視モード用: そのモード（+すうじの場合はgameType）の中で、挑戦履歴が
// ある中から最も正答率が低いレベルを選ぶ。挑戦履歴が無ければ選択レベルのまま
// にする（実装は`getWeakestAreas`と同じ「正答率が低いほど優先」の考え方だが、
// 対象をこのモード単体のレベル間比較に絞っている）
function pickFocusedLevel(
  history: HistoryEntry[],
  mode: Mode,
  gameType: DigitGameType | undefined,
  fallback: Level,
): Level {
  let worst: { level: Level; accuracy: number } | null = null
  for (const level of ALL_LEVELS) {
    const stats = getLevelStats(history, level, mode, gameType)
    if (stats.accuracy === null) continue
    if (worst === null || stats.accuracy < worst.accuracy) {
      worst = { level, accuracy: stats.accuracy }
    }
  }
  return worst?.level ?? fallback
}

export interface BuildRandomRoundsOptions {
  // ④-2: 各ラウンドのレベルを、選択レベル固定ではなくモードごとの弱点レベルに
  // 差し替える「弱点重視」オプション。認知トレーニング研究でのインターリーブ
  // 練習（複数課題を織り交ぜる方が定着しやすいという知見）を踏まえ、限られた
  // 練習時間をより弱い分野に配分する
  history: HistoryEntry[]
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// すうじ（逆から入力/合計を入力）・空間・変化検出・音/色の「単発質問→回答」型
// 5種類から1問ずつのラウンド生成関数を組み立てる。Nバック系（連続試行）と
// ことばモード（音声入出力）は構造が大きく異なるため対象外
function buildRoundGenerators(
  level: Level,
  options?: BuildRandomRoundsOptions,
): (() => RandomRound)[] {
  const levelFor = (mode: Mode, gameType?: DigitGameType): Level =>
    options ? pickFocusedLevel(options.history, mode, gameType, level) : level

  return [
    () => ({
      mode: 'digit',
      gameType: 'reverse',
      question: pickDigitQuestionSet(levelFor('digit', 'reverse'))[0],
    }),
    () => ({
      mode: 'digit',
      gameType: 'sum',
      question: pickDigitQuestionSet(levelFor('digit', 'sum'))[0],
    }),
    () => ({ mode: 'spatial', question: pickSpatialQuestionSet(levelFor('spatial'))[0] }),
    () => ({ mode: 'pattern', question: pickPatternQuestionSet(levelFor('pattern'))[0] }),
    () => ({ mode: 'tone', question: pickToneQuestionSet(levelFor('tone'))[0] }),
  ]
}

// roundCount問のミックス練習を組み立てる。候補は5種類（すうじ・逆から/合計/
// 空間/変化検出/音・色）で、roundCountがそれ以下なら重複無しでその中から
// roundCount種類を選び、それを超える場合（7問等）は超過分だけランダムに
// 重複させる。最終的な出題順はシャッフルする
export function buildRandomRounds(
  level: Level,
  roundCount: RoundCount = DEFAULT_ROUND_COUNT,
  options?: BuildRandomRoundsOptions,
): RandomRound[] {
  const generators = buildRoundGenerators(level, options)
  let selected: (() => RandomRound)[]
  if (roundCount <= generators.length) {
    selected = shuffled(generators).slice(0, roundCount)
  } else {
    const extraCount = roundCount - generators.length
    const extras = Array.from(
      { length: extraCount },
      () => generators[Math.floor(Math.random() * generators.length)],
    )
    selected = shuffled([...generators, ...extras])
  }
  return selected.map((generate) => generate())
}
